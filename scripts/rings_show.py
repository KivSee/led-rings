"""
Rings show controller: triggers with RFID interaction, then songs.

Cycle (the live show opens with the first song in SONG_ORDER, then step 1)
  1. Trigger phase (PHASE_SECONDS): a trigger from TRIGGER_LIST plays and RFID is
     live (boxes show "ready").
  2. No interaction: when the phase ends, the next song in SONG_ORDER plays (skipping
     it if it is the song that just played), then after a dark pause of SONG_GAP_SECONDS
     the next trigger starts.
  3. First chip (A): agent (AGENT_SONG) plays at once and A is remembered. Until agent ends plus
     SECOND_CHIP_GRACE seconds, a different chip (B) may be tapped (boxes show a
     rainbow). More taps of A do nothing. The trigger phase clock is paused while
     agent plays.
  4. Second chip (B != A) in time: agent is cut, an agent_story (one of
     STORY_SONGS, at random) plays (boxes show confetti), then the song picked for the pair (A, B) (boxes off), then the next
     trigger.
  5. No second chip in time: A is forgotten and the trigger we were on resumes with
     the time it had left.
  RFID is ignored while agent_story or a song plays, and in the pause after a song. Brightness is left to the
  retained "brightness" topic (Home Assistant); this script never touches it.

Control page (http://<pi>:SHOW_UI_PORT/): shows what plays and the next song.
  Play now: during a trigger phase (or the pause after a song), ends it and plays the next song at once.
  Stop: a song stops and the next trigger starts (so does the pause after a song); agent / agent_story stop and the
    trigger we were on resumes (chip and pair song dropped).
  Next song: pick any song from SONG_ORDER to play next; the order continues after it.
  On/Off per song: an off song is left out of the order and of the pair songs, until it is switched on
    again (kept in DISABLED_FILE, across restarts). A song that is playing when switched off plays on.

Pair -> song uses rendezvous hashing over the two chip UIDs (order-independent):
a pair always gets the same song, pairs spread evenly over the songs, and adding a
song later only moves about 1/n of the pairs to it.

Song ends are read from the trigger service's retained MQTT "trigger" topic: the
song's name while it plays, {} once it has ended.

Usage
  python scripts/rings_show.py                 # run the show (Ctrl+C to quit)
  python scripts/rings_show.py --selftest      # run the scenario tests, no network
  TRIGGER_SERVICE_URL / MQTT_BROKER / SHOW_UI_PORT env vars override the defaults.
"""

import hashlib
import json
import os
import queue
import random
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# --- show configuration -------------------------------------------------------

TRIGGER_LIST = ["background", "background2", "background3"]
# No two songs by the same author back to back, the wrap-around included:
# Sapir's (el_jaguar, alor, jamaican_bam_bam) and Oren's (loop, inequal, buttons).
SONG_ORDER = ["el_jaguar", "loop", "aladdin", "alor", "inequal", "jamaican_bam_bam", "buttons", "shemesh", "children"]
SAME_AUTHOR = [{"el_jaguar", "alor", "jamaican_bam_bam"}, {"loop", "inequal", "buttons"}]
PHASE_SECONDS = 3 * 60
AGENT_SONG = "agent1"
STORY_SONGS = ["agent_story1", "agent_story2"]   # one picked at random per second chip
SECOND_CHIP_GRACE = 10.0      # seconds after agent ends to tap the second chip
SONG_START_TIMEOUT = 20.0     # a song that never shows up on the trigger topic counts as ended
SONG_GAP_SECONDS = 3.0        # dark pause after a song before the next trigger starts
TRIGGER_RESEND_GUARD = 3.0    # don't re-send a trigger more often than this

TRIGGER_SERVICE_URL = os.environ.get("TRIGGER_SERVICE_URL", "http://localhost:8083")
MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_TRIGGER_TOPIC = "trigger"
MQTT_RFID_TOPIC = "sensors/rfid"
NUM_BOXES = 5
DEVICE_QUIET_SECONDS = 20  # rings report every 5 s; this long without a report shows them as quiet
SHOW_UI_PORT = int(os.environ.get("SHOW_UI_PORT", "8090"))
DISABLED_FILE = os.environ.get("SHOW_DISABLED_FILE", os.path.expanduser("~/rings_show_disabled.json"))

# Box LEDs (esp32-Kivsee-box/include/LED_control.h): master_state 0 = off, 1 = confetti
# (random warm sparkles), 2 = color: color 1-5 solid hue with a chasing glow, color > 127
# = rainbow with white sparkles. Looks per stage:
#   ready     trigger phase, RFID live: solid color, changes with the trigger
#   rainbow   after chip A (agent + wait): invites the second chip
#   confetti  second chip, agent_story
#   off       songs
BOX_OFF, BOX_PATTERN, BOX_COLOR = 0, 1, 2
# Ready colors cycled per trigger: red, blue, purple. Some box pixels have a dead green
# LED, so yellow (2) and green (3) show red/blue dots there; these hues barely use green.
BOX_READY_COLORS = (1, 4, 5)
BOX_RAINBOW_COLOR = 128


def log(msg):
    print(time.strftime("%H:%M:%S"), msg, flush=True)


def pick_song(chip_a, chip_b, songs):
    """Song for a pair of chips: rendezvous hashing, independent of tap order."""
    pair = "|".join(sorted([str(chip_a), str(chip_b)]))
    return max(songs, key=lambda s: hashlib.sha256(f"{pair}|{s}".encode()).digest())


def load_disabled(path):
    """Songs switched off on the control page; a missing or broken file means none. Stale names are dropped."""
    try:
        with open(path, encoding="utf-8") as f:
            names = json.load(f)
    except (OSError, ValueError):
        return set()
    return set(names) & set(SONG_ORDER) if isinstance(names, list) else set()


def save_disabled(path, disabled):
    try:
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(sorted(disabled), f)
        os.replace(tmp, path)
    except OSError as e:
        log(f"could not save the songs switched off: {e}")


# --- the show state machine (no I/O: actions are injected, time is passed in) ---

class Show:
    def __init__(self, actions, now, start_with_song=False, disabled=()):
        self.a = actions
        self.disabled = set(disabled)    # songs switched off on the control page
        self.mode = "trigger"            # trigger | agent | story | song | gap (dark pause after a song)
        self.gap_until = None            # when the pause after a song ends
        self.trig_idx = 0
        self.phase_left = PHASE_SECONDS  # seconds left in the current trigger phase
        self.phase_since = None          # when the phase clock last (re)started; None = paused
        self.order_idx = 0               # next song in SONG_ORDER
        self.next_pick = None            # song picked on the control page to play next
        self.last_song = None
        self.chip_a = None               # first chip, waiting for a second one
        self.window_until = None         # second-chip deadline once agent has ended
        self.pair_song = None            # song to play after agent_story
        self.pair_chips = None           # the chips that picked it
        self.expect = None               # song we started and are watching
        self.expect_seen = False
        self.expect_since = 0.0
        self.last_trigger_sent = -1e9
        if start_with_song:
            # the song's end advances trig_idx, so start one before the first trigger
            self.trig_idx = -1
            self.phase_since = None
            self._play(now, self._next_order_song(), "song")
        else:
            self._start_trigger(now, fresh=True)

    # -- helpers --
    def trigger_name(self):
        return TRIGGER_LIST[self.trig_idx % len(TRIGGER_LIST)]

    def _box_color(self):
        return BOX_READY_COLORS[self.trig_idx % len(BOX_READY_COLORS)]

    def _boxes(self, look):
        if look == "ready":
            self.a.boxes(BOX_COLOR, self._box_color())
        elif look == "rainbow":
            self.a.boxes(BOX_COLOR, BOX_RAINBOW_COLOR)
        elif look == "confetti":
            self.a.boxes(BOX_PATTERN, self._box_color())
        else:
            self.a.boxes(BOX_OFF, self._box_color())

    def _phase_elapsed(self, now):
        return 0.0 if self.phase_since is None else now - self.phase_since

    def _pause_phase(self, now):
        self.phase_left -= self._phase_elapsed(now)
        self.phase_since = None

    def _start_trigger(self, now, fresh):
        if fresh:
            self.phase_left = PHASE_SECONDS
        self.mode = "trigger"
        self.expect = None
        self.phase_since = now
        self.last_trigger_sent = now
        self.a.trigger(self.trigger_name())
        self._boxes("rainbow" if self.chip_a else "ready")
        log(f"trigger '{self.trigger_name()}' ({self.phase_left:.0f}s left in phase)")

    def _play(self, now, song, mode):
        self.mode = mode
        self.expect, self.expect_seen, self.expect_since = song, False, now
        self._boxes({"agent": "rainbow", "story": "confetti"}.get(mode, "off"))
        ok = self.a.play_song(song)
        log(f"{mode}: playing '{song}'" + ("" if ok else " (FAILED to start)"))
        if not ok:
            self._song_ended(now, song)

    def _enabled_songs(self):
        return [s for s in SONG_ORDER if s not in self.disabled]

    def _peek_order_song(self):
        """(next song, order_idx after it), without advancing."""
        if self.next_pick is not None:
            return self.next_pick, SONG_ORDER.index(self.next_pick) + 1
        idx = self.order_idx
        enabled = self._enabled_songs()
        for _ in range(len(SONG_ORDER)):
            song = SONG_ORDER[idx % len(SONG_ORDER)]
            idx += 1
            if song in enabled and (song != self.last_song or len(enabled) == 1):
                return song, idx
        return enabled[0], self.order_idx

    def _next_order_song(self):
        song, self.order_idx = self._peek_order_song()
        self.next_pick = None
        return song

    def _forget_chip(self):
        self.chip_a = None
        self.window_until = None

    # -- events --
    def on_chip(self, now, uid):
        # The box halts each chip after reading it, so one tap = one message.
        uid = str(uid)
        if self.mode in ("story", "song", "gap"):
            log(f"chip {uid} ignored ({'pause after a song' if self.mode == 'gap' else self.mode + ' playing'})")
            return
        if self.chip_a is None:
            # first chip: agent now, trigger clock paused
            self.chip_a = uid
            self.window_until = None
            self._pause_phase(now)
            log(f"first chip {uid}")
            self._play(now, AGENT_SONG, "agent")
            return
        if uid == self.chip_a:
            log(f"chip {uid} is the first chip again, waiting for a different one")
            return
        # second chip: agent_story, then the pair's song
        self.pair_chips = (self.chip_a, uid)
        self.pair_song = pick_song(*self.pair_chips, self._enabled_songs())
        log(f"second chip {uid}: pair ({self.chip_a}, {uid}) -> '{self.pair_song}'")
        self._forget_chip()
        if self.mode == "trigger":
            self._pause_phase(now)
        self._play(now, random.choice(STORY_SONGS), "story")

    def on_trigger_status(self, now, name):
        """name = trigger_name on the 'trigger' topic, or None for {}."""
        if self.expect is not None:
            if name == self.expect:
                self.expect_seen = True
            elif self.expect_seen:
                self._song_ended(now, self.expect)
            return
        if self.mode == "trigger" and name is None and now - self.last_trigger_sent > TRIGGER_RESEND_GUARD:
            log("trigger topic went empty during a trigger phase, re-sending")
            self.last_trigger_sent = now
            self.a.trigger(self.trigger_name())

    def _song_ended(self, now, song):
        played = self.expect_seen
        self.expect = None
        if self.mode == "agent":
            # agent finished without a second chip: resume the trigger, keep the window open a bit
            self.window_until = now + SECOND_CHIP_GRACE
            log(f"agent ended, waiting {SECOND_CHIP_GRACE:.0f}s more for a second chip")
            self._start_trigger(now, fresh=False)
        elif self.mode == "story":
            song, self.pair_song = self.pair_song, None
            self._play(now, song, "song")
        elif self.mode == "song":
            self.last_song = song
            self.trig_idx += 1
            if played and SONG_GAP_SECONDS > 0:
                # a dark pause (the rings cleared when the song ended) before the next trigger
                self.mode = "gap"
                self.gap_until = now + SONG_GAP_SECONDS
                log(f"'{song}' ended, {SONG_GAP_SECONDS:.0f}s pause")
            else:
                self._start_trigger(now, fresh=True)

    # -- control page --
    def play_now(self, now):
        """Cut the trigger phase (or the pause after a song) and play the next song. Only between songs."""
        if self.mode not in ("trigger", "gap"):
            return False, f"not between songs ({self.mode} playing)"
        if self.mode == "gap":
            self.trig_idx -= 1  # the song's end moves the rotation on again
        self._forget_chip()
        self.phase_since = None
        song = self._next_order_song()
        log(f"play now: '{song}' (control page)")
        self._play(now, song, "song")
        return True, f"playing {song}"

    def stop(self, now):
        """Stop what plays: a song goes on to the next trigger; agent or agent_story go back
        to the trigger we were on, with its time left, dropping the chip and the pair song."""
        if self.mode == "trigger":
            return False, "nothing playing"
        if self.mode == "gap":
            log("pause after the song skipped (control page)")
            self._start_trigger(now, fresh=True)
            return True, "pause skipped"
        song = self.expect
        log(f"stop '{song}' (control page)")
        self.expect = None
        self.pair_song = None
        self._forget_chip()
        if self.mode == "song":
            self.last_song = song
            self.trig_idx += 1
            self._start_trigger(now, fresh=True)
        else:
            self._start_trigger(now, fresh=False)
        return True, f"stopped {song}"

    def set_next(self, song):
        if song not in SONG_ORDER:
            return False, f"unknown song '{song}'"
        if song in self.disabled:
            return False, f"{song} is switched off"
        self.next_pick = song
        log(f"next song set to '{song}' (control page)")
        return True, f"next song: {song}"

    def set_enabled(self, song, enabled):
        """Switch a song on or off. A song waiting to play next (picked, or for a pair) gives way to another."""
        if song not in SONG_ORDER:
            return False, f"unknown song '{song}'"
        if not enabled and self._enabled_songs() == [song]:
            return False, "at least one song has to stay on"
        (self.disabled.discard if enabled else self.disabled.add)(song)
        if not enabled and self.next_pick == song:
            self.next_pick = None
        if not enabled and self.pair_song == song:
            self.pair_song = pick_song(*self.pair_chips, self._enabled_songs())
        log(f"song '{song}' switched {'on' if enabled else 'off'} (control page)")
        return True, f"{song} is {'on' if enabled else 'off'}"

    def state(self, now):
        phase_left = None
        if self.mode == "trigger":
            phase_left = max(0.0, self.phase_left - self._phase_elapsed(now))
        return {
            "mode": self.mode,
            "trigger": self.trigger_name() if self.mode == "trigger" else None,
            "playing": self.expect if self.mode not in ("trigger", "gap") else None,
            "trigger_next": self.trigger_name() if self.mode == "gap" else None,
            "phase_left": phase_left,
            "phase_paused": self.mode == "trigger" and self.phase_since is None,
            "waiting_chip": self.chip_a is not None,
            "next_song": self._peek_order_song()[0],
            "next_picked": self.next_pick is not None,
            "last_song": self.last_song,
            "songs": SONG_ORDER,
            "disabled": sorted(self.disabled),
        }

    def tick(self, now):
        if self.expect is not None and not self.expect_seen and now - self.expect_since > SONG_START_TIMEOUT:
            log(f"'{self.expect}' never started, moving on")
            self._song_ended(now, self.expect)
            return
        if self.mode == "gap" and now >= self.gap_until:
            self._start_trigger(now, fresh=True)
            return
        if self.mode != "trigger":
            return
        if self.chip_a and self.window_until is not None and now >= self.window_until:
            log(f"no second chip, forgetting {self.chip_a}")
            self._forget_chip()
            self._boxes("ready")
        if self.phase_since is not None and self._phase_elapsed(now) >= self.phase_left:
            self._forget_chip()
            self.phase_since = None
            self._play(now, self._next_order_song(), "song")


# --- real I/O -----------------------------------------------------------------

class LiveActions:
    def __init__(self, mqtt_client):
        import requests
        self.requests = requests
        self.mqtt = mqtt_client

    def trigger(self, name):
        try:
            r = self.requests.post(f"{TRIGGER_SERVICE_URL}/trigger/{name}", timeout=3)
            if r.status_code >= 400:
                log(f"trigger '{name}' failed: HTTP {r.status_code} {r.text[:80]}")
        except self.requests.RequestException as e:
            log(f"trigger '{name}' failed: {e}")

    def play_song(self, name):
        try:
            r = self.requests.post(f"{TRIGGER_SERVICE_URL}/song/{name}/play", json={"start_offset_ms": 0}, timeout=5)
            if r.status_code >= 400:
                log(f"song '{name}' failed: HTTP {r.status_code} {r.text[:80]}")
                return False
            return True
        except self.requests.RequestException as e:
            log(f"song '{name}' failed: {e}")
            return False

    def boxes(self, master_state, color):
        payload = json.dumps({"color": color, "master_state": master_state})
        for n in range(1, NUM_BOXES + 1):
            self.mqtt.publish(f"{MQTT_RFID_TOPIC}/box{n}/leds", payload, retain=True)


class Devices:
    """Which devices are online, for the control page, from MQTT. Rings and lilums: retained
    thing/<name>/status ({"alive", "fw"}, with a last will of alive false), and every 5 s
    thing/<name>/debug, whose now.trig is the trigger the device plays. RFID boxes: retained
    sensors/rfid/<box>/monitor ({"alive"}). Written by the MQTT thread, read by the show loop."""

    def __init__(self):
        self.lock = threading.Lock()
        self.things = {f"box{n}": {"kind": "box", "alive": None} for n in range(1, NUM_BOXES + 1)}

    def on_message(self, topic, data, now):
        parts = topic.split("/")
        if not isinstance(data, dict):
            return
        with self.lock:
            if len(parts) == 3 and parts[0] == "thing":
                name = parts[1]
                kind = "ring" if name.startswith("ring") else "lilum" if name.startswith("lilum") else "other"
                d = self.things.setdefault(name, {"kind": kind, "alive": None})
                if parts[2] == "status":
                    d["alive"] = bool(data.get("alive"))
                    d["fw"] = data.get("fw")
                elif parts[2] == "debug":
                    d["trig"] = (data.get("now") or {}).get("trig")
                    d["seen"] = now
            elif topic.startswith(MQTT_RFID_TOPIC + "/") and parts[-1] == "monitor":
                self.things.setdefault(parts[-2], {"kind": "box"})["alive"] = bool(data.get("alive"))

    def view(self, now):
        """[{name, kind, state: on / off / quiet / unknown, fw, trig}], rings first, by number.
        quiet: says it is alive but its 5 s debug report stopped (DEVICE_QUIET_SECONDS)."""
        order = {"ring": 0, "lilum": 1, "box": 2}
        num = lambda name: int("".join(c for c in name if c.isdigit()) or 0)
        with self.lock:
            out = []
            for name, d in self.things.items():
                state = {True: "on", False: "off", None: "unknown"}[d.get("alive")]
                if state == "on" and "seen" in d and now - d["seen"] > DEVICE_QUIET_SECONDS:
                    state = "quiet"
                out.append({"name": name, "kind": d["kind"], "state": state, "fw": d.get("fw"),
                            "trig": d.get("trig") if state == "on" else None})
        return sorted(out, key=lambda x: (order.get(x["kind"], 3), num(x["name"]), x["name"]))


# --- control page ---------------------------------------------------------------

CONTROL_PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rings Show</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: #111; color: #eee; font: 16px system-ui, sans-serif; }
  main { max-width: 480px; margin: 0 auto; }
  h1 { font-size: 18px; color: #888; font-weight: 500; margin: 0 0 12px; }
  .status { background: #1c1c1c; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
  .mode { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #888; }
  .now { font-size: 26px; font-weight: 600; margin: 4px 0; }
  .sub { color: #aaa; font-size: 14px; }
  button { font: inherit; color: inherit; cursor: pointer; border: 0; border-radius: 10px; }
  .controls { display: flex; gap: 8px; margin-bottom: 18px; }
  .controls button { padding: 18px; font-size: 20px; font-weight: 600; }
  #play { flex: 1; background: #2a7; }
  #stop { background: #a33; padding-left: 26px; padding-right: 26px; }
  #play:disabled, #stop:disabled { background: #333; color: #777; cursor: default; }
  h2 { font-size: 14px; color: #888; font-weight: 500; margin: 0 0 8px; }
  .songs { display: grid; gap: 8px; }
  .row { display: flex; gap: 8px; }
  .song { flex: 1; min-width: 0; text-align: left; padding: 14px; background: #1c1c1c; display: flex; justify-content: space-between; }
  .toggle { flex: none; width: 60px; background: #264; color: #bfc; font-size: 14px; font-weight: 600; }
  .row.off .toggle { background: #333; color: #999; }
  .row.off .song { color: #777; text-decoration: line-through; cursor: default; }
  .song.next { background: #234; outline: 2px solid #48f; }
  .song.playing { background: #2a2a1a; }
  .tag { font-size: 12px; color: #8af; }
  .song.playing .tag { color: #db6; }
  #msg { min-height: 20px; color: #f88; font-size: 14px; margin-top: 12px; }
  .devices { margin-top: 18px; }
  .group { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .dev { background: #1c1c1c; border-radius: 8px; padding: 6px 9px; font-size: 13px; display: flex; align-items: center; gap: 6px; }
  .dev i { width: 9px; height: 9px; border-radius: 50%; background: #555; flex: none; }
  .dev.on i { background: #3c6; }
  .dev.off { color: #f88; } .dev.off i { background: #e44; }
  .dev.quiet i, .dev.wrong i { background: #db6; }
  .dev.unknown { color: #777; }
  .dev small { color: #db6; }
</style></head>
<body><main>
<h1>Rings Show</h1>
<div class="status"><div class="mode" id="mode">connecting...</div><div class="now" id="now"></div><div class="sub" id="sub"></div></div>
<div class="controls"><button id="play" disabled>Play now</button><button id="stop" disabled>Stop</button></div>
<h2>Next song (tap to choose). Off songs stay out of the show.</h2>
<div class="songs" id="songs"></div>
<div id="msg"></div>
<div class="devices"><h2 id="devsum">Devices</h2><div id="devices"></div></div>
</main>
<script>
const $ = id => document.getElementById(id);
let st = null;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const LABEL = { trigger: 'Between songs', agent: 'Agent', story: 'Agent story', song: 'Playing song', gap: 'Pause after the song' };

function render() {
  if (!st) return;
  $('mode').textContent = LABEL[st.mode] || st.mode;
  if (st.mode === 'trigger') {
    $('now').textContent = st.trigger;
    $('sub').textContent = (st.phase_paused ? 'paused, ' : '') + fmt(st.phase_left) + ' until ' + st.next_song
      + (st.waiting_chip ? ' (waiting for a second chip)' : '');
  } else if (st.mode === 'gap') {
    $('now').textContent = 'rings dark';
    $('sub').textContent = 'then ' + st.trigger_next + ', then ' + st.next_song;
  } else {
    $('now').textContent = st.playing || '';
    $('sub').textContent = st.mode === 'song' ? 'then a background, then ' + st.next_song : 'then the pair song';
  }
  const between = st.mode === 'trigger' || st.mode === 'gap';
  $('play').disabled = !between;
  $('play').textContent = between ? 'Play ' + st.next_song + ' now' : 'Play now (between songs only)';
  $('stop').disabled = st.mode === 'trigger';
  $('songs').replaceChildren(...st.songs.map(name => {
    const b = document.createElement('button');
    const playing = st.mode === 'song' && st.playing === name;
    const off = st.disabled.includes(name);
    b.className = 'song' + (name === st.next_song ? ' next' : '') + (playing ? ' playing' : '');
    b.disabled = off;
    const tag = name === st.next_song ? (st.next_picked ? 'next (picked)' : 'next') : playing ? 'playing' : '';
    b.innerHTML = '<span></span><span class="tag"></span>';
    b.firstChild.textContent = name;
    b.lastChild.textContent = tag;
    b.onclick = () => send('/api/next', { song: name });
    const t = document.createElement('button');
    t.className = 'toggle';
    t.textContent = off ? 'Off' : 'On';
    t.setAttribute('aria-label', name + ' in the show: ' + t.textContent);
    t.onclick = () => send('/api/song-enabled', { song: name, enabled: off });
    const row = document.createElement('div');
    row.className = 'row' + (off ? ' off' : '');
    row.append(b, t);
    return row;
  }));
  renderDevices();
}

// What the rings should be playing: the song / agent, or the background between songs (nothing in the pause).
const DEV_NOTE = { off: 'offline', quiet: 'no report for a while', unknown: 'never reported' };
function renderDevices() {
  const devs = st.devices || [];
  const expected = st.mode === 'trigger' ? st.trigger : st.playing;
  const kinds = [['ring', 'rings'], ['lilum', 'lilums'], ['box', 'boxes'], ['other', 'other']];
  $('devsum').textContent = 'Devices: ' + kinds.map(([k, label]) => {
    const all = devs.filter(d => d.kind === k);
    return all.length ? all.filter(d => d.state === 'on').length + '/' + all.length + ' ' + label : '';
  }).filter(Boolean).join(', ');
  $('devices').replaceChildren(...kinds.map(([k]) => {
    const g = document.createElement('div');
    g.className = 'group';
    g.append(...devs.filter(d => d.kind === k).map(d => {
      const el = document.createElement('div');
      // a ring playing something else than the show (it takes up to 5 s to report a switch)
      const wrong = d.state === 'on' && d.trig && expected && d.trig !== expected;
      el.className = 'dev ' + d.state + (wrong ? ' wrong' : '');
      el.innerHTML = '<i></i><span></span>';
      el.lastChild.textContent = d.name;
      if (wrong) { const s = document.createElement('small'); s.textContent = d.trig; el.append(s); }
      el.title = [DEV_NOTE[d.state], d.fw ? 'fw ' + d.fw : '', d.trig ? 'playing ' + d.trig : ''].filter(Boolean).join(', ');
      return el;
    }));
    return g;
  }).filter(g => g.childElementCount));
}

async function poll() {
  try {
    st = await (await fetch('/api/state')).json();
    render();
  } catch (e) { $('mode').textContent = 'show script not reachable'; }
}

async function send(path, body) {
  $('msg').textContent = '';
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const res = await r.json();
    if (!res.ok) $('msg').textContent = res.message;
  } catch (e) { $('msg').textContent = 'request failed'; }
  poll();
}

$('play').onclick = () => send('/api/play-now');
$('stop').onclick = () => { if (confirm('Stop ' + (st && st.playing || 'playing') + '?')) send('/api/stop'); };
poll();
setInterval(poll, 1000);
</script>
</body></html>
"""


def start_control_server(events, snapshot):
    """Serve the control page. Commands go through `events` to the show loop; state is
    read from snapshot["state"], which the loop refreshes."""

    class Handler(BaseHTTPRequestHandler):
        def _send(self, code, body, ctype="application/json"):
            data = body.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                self._send(200, CONTROL_PAGE, "text/html; charset=utf-8")
            elif self.path == "/api/state":
                self._send(200, json.dumps(snapshot.get("state")))
            else:
                self._send(404, json.dumps({"ok": False, "message": "not found"}))

        def do_POST(self):
            try:
                n = int(self.headers.get("Content-Length") or 0)
                body = json.loads(self.rfile.read(n).decode("utf-8") or "{}") if n else {}
            except (ValueError, UnicodeDecodeError):
                body = {}
            if self.path == "/api/play-now":
                cmd = ("play_now", None)
            elif self.path == "/api/stop":
                cmd = ("stop", None)
            elif self.path == "/api/next" and isinstance(body, dict):
                cmd = ("set_next", body.get("song"))
            elif self.path == "/api/song-enabled" and isinstance(body, dict):
                cmd = ("set_enabled", (body.get("song"), bool(body.get("enabled"))))
            else:
                return self._send(404, json.dumps({"ok": False, "message": "not found"}))
            reply = queue.Queue()
            events.put(("cmd", (cmd, reply)))
            try:
                ok, message = reply.get(timeout=5)
            except queue.Empty:
                ok, message = False, "show loop did not answer"
            self._send(200 if ok else 409, json.dumps({"ok": ok, "message": message}))

        def log_message(self, fmt, *args):
            pass  # keep the show log clean

    server = ThreadingHTTPServer(("0.0.0.0", SHOW_UI_PORT), Handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    log(f"control page on port {SHOW_UI_PORT}")
    return server


def run_live():
    import paho.mqtt.client as mqtt
    events = queue.Queue()
    devices = Devices()

    def on_connect(client, userdata, flags, reason_code, properties=None):
        log(f"connected to MQTT {MQTT_BROKER}")
        client.subscribe(MQTT_TRIGGER_TOPIC)
        client.subscribe(f"{MQTT_RFID_TOPIC}/+/chip")
        client.subscribe(f"{MQTT_RFID_TOPIC}/+/monitor")
        client.subscribe("thing/+/status")
        client.subscribe("thing/+/debug")

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return
        if msg.topic == MQTT_TRIGGER_TOPIC:
            events.put(("status", data.get("trigger_name") if isinstance(data, dict) else None))
        elif msg.topic.endswith("/chip") and isinstance(data, dict) and data.get("UID"):
            events.put(("chip", data["UID"]))
        else:
            devices.on_message(msg.topic, data, time.monotonic())

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    while True:
        try:
            client.connect(MQTT_BROKER, 1883, 30)
            break
        except OSError:
            log("waiting for the MQTT broker...")
            time.sleep(2)
    client.loop_start()
    time.sleep(1)  # let the retained trigger status arrive

    show = Show(LiveActions(client), time.monotonic(), start_with_song=True, disabled=load_disabled(DISABLED_FILE))
    log(f"show running: triggers {TRIGGER_LIST}, songs {SONG_ORDER}, phase {PHASE_SECONDS}s")
    snapshot = {"state": dict(show.state(time.monotonic()), devices=devices.view(time.monotonic()))}
    try:
        server = start_control_server(events, snapshot)
    except OSError as e:
        server = None
        log(f"control page not started: {e}")
    try:
        while True:
            try:
                kind, value = events.get(timeout=0.2)
                now = time.monotonic()
                if kind == "status":
                    show.on_trigger_status(now, value)
                elif kind == "chip":
                    show.on_chip(now, value)
                else:
                    (name, arg), reply = value
                    if name == "set_next":
                        reply.put(show.set_next(arg))
                    elif name == "set_enabled":
                        reply.put(show.set_enabled(*arg))
                        save_disabled(DISABLED_FILE, show.disabled)
                    else:
                        reply.put(getattr(show, name)(now))
            except queue.Empty:
                pass
            show.tick(time.monotonic())
            now = time.monotonic()
            snapshot["state"] = dict(show.state(now), devices=devices.view(now))
    except KeyboardInterrupt:
        log("exiting")
    finally:
        if server:
            server.shutdown()
        client.loop_stop()
        client.disconnect()


# --- self-test: every scenario on a fake clock, no network ----------------------

class FakeActions:
    def __init__(self):
        self.calls = []
        self.fail = set()

    def trigger(self, name):
        self.calls.append(("trigger", name))

    def play_song(self, name):
        self.calls.append(("song", name))
        return name not in self.fail

    def boxes(self, master_state, color):
        self.calls.append(("boxes", (master_state, color)))

    def last(self, kind):
        return next((v for k, v in reversed(self.calls) if k == kind), None)


def selftest():
    global log
    FIRST, SECOND = SONG_ORDER[0], SONG_ORDER[1]
    quiet = []
    log = quiet.append  # keep test output clean
    fails = []

    def check(name, cond):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            fails.append(name)

    def run_song(show, t, song, length=100):
        """Simulate the trigger topic for a song we just started: playing, then {}; then the pause after it."""
        show.on_trigger_status(t, song)
        show.on_trigger_status(t + length, None)
        show.tick(t + length + SONG_GAP_SECONDS)
        return t + length + SONG_GAP_SECONDS

    # 1. no interaction: phase -> order song -> next trigger, songs in order
    fa = FakeActions(); s = Show(fa, 0)
    s.tick(PHASE_SECONDS - 1)
    check("no song before the phase ends", fa.last("song") is None)
    s.tick(PHASE_SECONDS)
    check("first order song is aladdin", fa.last("song") == FIRST and s.mode == "song")
    t = run_song(s, PHASE_SECONDS, FIRST)
    check("next trigger after the song", fa.last("trigger") == TRIGGER_LIST[1] and s.mode == "trigger")
    s.tick(t + PHASE_SECONDS)
    check("second order song is buttons", fa.last("song") == SECOND)

    # 2. order skips the song that just played (e.g. a pair song)
    fa = FakeActions(); s = Show(fa, 0); s.last_song = FIRST
    s.tick(PHASE_SECONDS)
    check("order skips the song that just played", fa.last("song") == SECOND)

    # 3. single chip: agent, clock paused, resume with time left, chip forgotten after the grace
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(100, "A")
    check("first chip plays agent", fa.last("song") == AGENT_SONG and s.mode == "agent")
    s.on_trigger_status(101, AGENT_SONG)
    s.tick(100 + PHASE_SECONDS)  # long after the phase would have ended: clock is paused
    check("phase clock paused during agent", s.mode == "agent")
    s.on_trigger_status(160, None)  # agent ended after 60s
    check("trigger resumes after agent", s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[0])
    check("time left preserved", abs(s.phase_left - (PHASE_SECONDS - 100)) < 1e-6)
    s.tick(160 + SECOND_CHIP_GRACE - 0.1)
    check("still waiting inside the grace", s.chip_a == "A")
    s.tick(160 + SECOND_CHIP_GRACE)
    check("chip forgotten after the grace", s.chip_a is None and fa.last("boxes") == (BOX_COLOR, 1))
    s.tick(160 + (PHASE_SECONDS - 100) - 0.1)
    check("phase not over before its remaining time", s.mode == "trigger")
    s.tick(160 + (PHASE_SECONDS - 100))
    check("phase ends after its remaining time", s.mode == "song")

    # 4. second chip during agent: cut to agent_story, then the pair song, then next trigger
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG)
    s.on_chip(20, "B")
    check("second chip cuts to agent_story", fa.last("song") in STORY_SONGS and s.mode == "story")
    pair = pick_song("A", "B", SONG_ORDER)
    s.on_trigger_status(21, s.expect); s.on_trigger_status(80, None)
    check("pair song after agent_story", fa.last("song") == pair and s.mode == "song")
    s.on_trigger_status(81, pair); s.on_trigger_status(300, None); s.tick(300 + SONG_GAP_SECONDS)
    check("next trigger after the pair song", s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1])
    check("pair song counts as last played", s.last_song == pair)

    # 5. second chip within the grace after agent ended
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG); s.on_trigger_status(70, None)
    s.on_chip(75, "B")
    check("second chip inside the grace plays agent_story", fa.last("song") in STORY_SONGS)
    stories = set()
    for _ in range(50):
        fa = FakeActions(); s = Show(fa, 0); s.on_chip(10, "A"); s.on_chip(20, "B")
        stories.add(fa.last("song"))
    check("both agent_story songs get picked", stories == set(STORY_SONGS))

    # 6. chip A again does nothing until A is forgotten; then A starts over; chips ignored during songs
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG)
    n = len(fa.calls)
    s.on_chip(11, "A"); s.on_chip(30, "A")                     # during agent, even right after the first tap
    s.on_trigger_status(70, None)                              # agent ends, grace window opens
    n_after_agent = len(fa.calls)
    s.on_chip(71, "A"); s.on_chip(79.9, "A")                   # during the grace window
    check("chip A again during agent and grace does nothing", len(fa.calls) == n_after_agent and n_after_agent > n
          and s.mode == "trigger" and s.chip_a == "A" and fa.calls[n:n_after_agent].count(("song", AGENT_SONG)) == 0)
    s.tick(80)                                                 # grace over: A forgotten
    s.on_chip(80.5, "A")                                       # immediately tapping A again starts a new agent
    check("chip A after being forgotten starts agent again", fa.last("song") == AGENT_SONG and s.mode == "agent" and s.chip_a == "A")
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS); s.on_trigger_status(PHASE_SECONDS + 1, FIRST)
    s.on_chip(PHASE_SECONDS + 5, "A")
    check("chips ignored while a song plays", fa.last("song") == FIRST and s.chip_a is None)

    # 7. failures: agent_story missing -> pair song directly; song never starts -> move on
    fa = FakeActions(); fa.fail.update(STORY_SONGS); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_chip(20, "B")
    check("missing agent_story falls back to the pair song", fa.last("song") == pick_song("A", "B", SONG_ORDER) and s.mode == "song")
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    s.tick(PHASE_SECONDS + SONG_START_TIMEOUT + 1)
    check("song that never starts is skipped", s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1])

    # 8. box looks per stage: ready -> rainbow (agent + wait) -> confetti (story) -> off (songs)
    READY, RAINBOW, CONFETTI = (BOX_COLOR, 1), (BOX_COLOR, BOX_RAINBOW_COLOR), (BOX_PATTERN, 1)
    fa = FakeActions(); s = Show(fa, 0)
    check("boxes ready during the trigger", fa.last("boxes") == READY)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG)
    check("boxes rainbow during agent", fa.last("boxes") == RAINBOW)
    s.on_trigger_status(60, None)
    check("boxes stay rainbow during the wait", fa.last("boxes") == RAINBOW and s.mode == "trigger")
    s.on_chip(65, "B")
    check("boxes confetti during agent_story", fa.last("boxes") == CONFETTI)
    s.on_trigger_status(66, s.expect); s.on_trigger_status(120, None)
    check("boxes off during the pair song", fa.last("boxes")[0] == BOX_OFF)
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    check("boxes off during an order song", fa.last("boxes")[0] == BOX_OFF)
    s.on_trigger_status(PHASE_SECONDS + 1, FIRST); s.on_trigger_status(PHASE_SECONDS + 200, None)
    check("boxes stay off in the pause after the song", fa.last("boxes")[0] == BOX_OFF)
    s.tick(PHASE_SECONDS + 200 + SONG_GAP_SECONDS)
    check("boxes ready again in the next trigger's color", fa.last("boxes") == (BOX_COLOR, BOX_READY_COLORS[1]))
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG); s.on_trigger_status(60, None); s.tick(70)
    check("boxes back to ready when chip A is forgotten", fa.last("boxes") == READY)

    # 9. live start: first order song, then the first trigger with a full phase
    fa = FakeActions(); s = Show(fa, 0, start_with_song=True)
    check("starts with the first order song", fa.last("song") == FIRST and s.mode == "song" and fa.last("trigger") is None)
    check("boxes off during the opening song", fa.last("boxes")[0] == BOX_OFF)
    s.on_trigger_status(1, FIRST); s.tick(PHASE_SECONDS + 1)
    check("opening song is not cut by the phase clock", s.mode == "song")
    s.on_trigger_status(PHASE_SECONDS + 2, None); t = PHASE_SECONDS + 2 + SONG_GAP_SECONDS; s.tick(t)
    check("first trigger after the opening song", fa.last("trigger") == TRIGGER_LIST[0] and s.mode == "trigger" and s.phase_left == PHASE_SECONDS)
    check("boxes ready in the first color after the opening song", fa.last("boxes") == (BOX_COLOR, BOX_READY_COLORS[0]))
    s.tick(t + PHASE_SECONDS)
    check("next order song after the opening one is buttons", fa.last("song") == SECOND)

    # 10. control page: play now between songs only, picked next song, order continues after it
    fa = FakeActions(); s = Show(fa, 0)
    check("state shows the next order song", s.state(10)["next_song"] == FIRST and s.state(10)["phase_left"] == PHASE_SECONDS - 10)
    ok, _ = s.play_now(10)
    check("play now cuts the trigger phase", ok and fa.last("song") == FIRST and s.mode == "song")
    ok, _ = s.play_now(11)
    check("play now refused while a song plays", not ok and fa.last("song") == FIRST)
    s.on_trigger_status(11, FIRST); t = run_song(s, 11, FIRST)
    check("next trigger with a full phase after play now", s.mode == "trigger" and s.phase_left == PHASE_SECONDS)
    check("unknown song refused", not s.set_next("nope")[0])
    ok, _ = s.set_next("inequal")
    check("picked song shows as next", ok and s.state(t)["next_song"] == "inequal" and s.state(t)["next_picked"])
    s.tick(t + PHASE_SECONDS)
    check("picked song plays at the phase end", fa.last("song") == "inequal")
    t = run_song(s, t + PHASE_SECONDS, "inequal")
    check("order continues after the picked song", s.state(t)["next_song"] == SONG_ORDER[(SONG_ORDER.index("inequal") + 1) % len(SONG_ORDER)]
          and not s.state(t)["next_picked"])
    fa = FakeActions(); s = Show(fa, 0); s.set_next("loop")
    s.on_chip(10, "A")
    check("play now refused during agent", not s.play_now(20)[0])
    s.on_chip(30, "B"); s.on_trigger_status(31, s.expect); s.on_trigger_status(80, None)
    check("pick survives a pair song", s.next_pick == "loop")
    fa = FakeActions(); s = Show(fa, 0); s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG); s.on_trigger_status(60, None)
    s.set_next(SECOND); s.play_now(62)
    check("play now during the chip wait forgets the chip", s.chip_a is None and fa.last("song") == SECOND)
    fa = FakeActions(); s = Show(fa, 0); s.last_song = FIRST; s.set_next(FIRST); s.play_now(5)
    check("a picked song plays even if it just played", fa.last("song") == FIRST)

    # 11. stop: song -> next trigger with a full phase; agent/story -> back to the trigger with its time left
    fa = FakeActions(); s = Show(fa, 0)
    check("stop refused between songs", not s.stop(5)[0])
    s.tick(PHASE_SECONDS); s.on_trigger_status(PHASE_SECONDS + 1, FIRST)
    ok, _ = s.stop(PHASE_SECONDS + 30)
    check("stop during a song goes to the next trigger", ok and s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1]
          and s.phase_left == PHASE_SECONDS and s.last_song == FIRST and fa.last("boxes") == (BOX_COLOR, BOX_READY_COLORS[1]))
    s.on_trigger_status(PHASE_SECONDS + 31, None)  # the stopped song's end must not count as anything
    check("stopped song's end is ignored", s.mode == "trigger" and s.state(PHASE_SECONDS + 31)["next_song"] == SECOND)
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(100, "A"); s.on_trigger_status(101, AGENT_SONG)
    s.stop(120)
    check("stop during agent resumes the trigger with its time left", s.mode == "trigger" and s.chip_a is None
          and fa.last("trigger") == TRIGGER_LIST[0] and abs(s.phase_left - (PHASE_SECONDS - 100)) < 1e-6)
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_chip(20, "B"); s.on_trigger_status(21, s.expect)
    s.stop(30)
    check("stop during agent_story drops the pair song", s.mode == "trigger" and s.pair_song is None and fa.last("boxes") == READY)
    s.on_trigger_status(31, None)
    check("no pair song after a stopped agent_story", s.mode == "trigger" and fa.last("song") in STORY_SONGS)

    # 12. the dark pause after a song: no trigger, chips ignored; stop skips it, play now plays from it
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    s.on_trigger_status(PHASE_SECONDS + 1, FIRST); end = PHASE_SECONDS + 100
    n = len(fa.calls); s.on_trigger_status(end, None)
    check("pause after the song: no trigger yet", s.mode == "gap" and ("trigger", TRIGGER_LIST[1]) not in fa.calls[n:])
    s.on_chip(end + 1, "A")
    check("chips ignored in the pause", s.chip_a is None and s.mode == "gap")
    s.tick(end + SONG_GAP_SECONDS - 0.1)
    check("pause lasts SONG_GAP_SECONDS", s.mode == "gap")
    s.tick(end + SONG_GAP_SECONDS)
    check("next trigger after the pause, full phase", s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1]
          and s.phase_left == PHASE_SECONDS)
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    s.on_trigger_status(PHASE_SECONDS + 1, FIRST); s.on_trigger_status(PHASE_SECONDS + 50, None)
    ok, _ = s.stop(PHASE_SECONDS + 51)
    check("stop skips the pause", ok and s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1])
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    s.on_trigger_status(PHASE_SECONDS + 1, FIRST); s.on_trigger_status(PHASE_SECONDS + 50, None)
    ok, _ = s.play_now(PHASE_SECONDS + 51)
    check("play now from the pause plays the next song", ok and s.mode == "song" and fa.last("song") == SECOND)
    run_song(s, PHASE_SECONDS + 52, SECOND)
    check("rotation keeps its order after play now from the pause", fa.last("trigger") == TRIGGER_LIST[1])
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS); s.tick(PHASE_SECONDS + SONG_START_TIMEOUT + 1)
    check("no pause after a song that never started", s.mode == "trigger")
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    s.on_trigger_status(PHASE_SECONDS + 1, FIRST); s.on_trigger_status(PHASE_SECONDS + 50, None)
    st = s.state(PHASE_SECONDS + 51)
    check("state in the pause", st["mode"] == "gap" and st["playing"] is None and st["trigger_next"] == TRIGGER_LIST[1])

    # 13. song order: no two songs by the same author back to back, the wrap-around included
    pairs_in_order = list(zip(SONG_ORDER, SONG_ORDER[1:] + SONG_ORDER[:1]))
    check("no same-author songs back to back", not any({a, b} <= g for a, b in pairs_in_order for g in SAME_AUTHOR))
    check("every author's song is in the show", all(g <= set(SONG_ORDER) for g in SAME_AUTHOR))

    # 14. pair hashing: order-independent, roughly even, adding a song moves few pairs
    check("pair song independent of tap order", pick_song("x1", "y2", SONG_ORDER) == pick_song("y2", "x1", SONG_ORDER))
    pairs = [(f"chip{i}", f"chip{i + 1000}") for i in range(5000)]
    counts = {s_: 0 for s_ in SONG_ORDER}
    for p in pairs:
        counts[pick_song(*p, SONG_ORDER)] += 1
    spread = max(counts.values()) / min(counts.values())
    check(f"pairs spread evenly over songs (max/min {spread:.2f})", spread < 1.15)
    more = SONG_ORDER + ["newsong"]
    moved = sum(pick_song(*p, SONG_ORDER) != pick_song(*p, more) for p in pairs) / len(pairs)
    check(f"adding a song moves only its share of pairs ({moved:.1%})", moved < 1.3 / len(more))

    # 15. devices for the control page
    dv = Devices()
    dv.on_message("thing/ring10/status", {"thingName": "ring10", "alive": True, "fw": 134}, 0)
    dv.on_message("thing/ring2/status", {"thingName": "ring2", "alive": True, "fw": 134}, 0)
    dv.on_message("thing/ring2/debug", {"now": {"trig": "buttons"}}, 0)
    dv.on_message("thing/lilum4/status", {"alive": False}, 0)
    dv.on_message(f"{MQTT_RFID_TOPIC}/box1/monitor", {"alive": True}, 0)
    v = {d["name"]: d for d in dv.view(5)}
    check("devices: rings by number first, then lilums, then boxes",
          [d["name"] for d in dv.view(5)][:4] == ["ring2", "ring10", "lilum4", "box1"])
    check("devices: states and what a ring plays", v["ring2"]["state"] == "on" and v["ring2"]["trig"] == "buttons"
          and v["lilum4"]["state"] == "off" and v["box1"]["state"] == "on" and v[f"box{NUM_BOXES}"]["state"] == "unknown")
    v = {d["name"]: d for d in dv.view(DEVICE_QUIET_SECONDS + 1)}
    check("devices: a ring whose reports stopped is quiet", v["ring2"]["state"] == "quiet" and v["ring10"]["state"] == "on")

    # 16. songs switched off: out of the order and the pair songs, kept across restarts
    fa = FakeActions(); s = Show(fa, 0, disabled={FIRST})
    check("an off song is skipped in the order", s.state(0)["next_song"] == SECOND and s.state(0)["disabled"] == [FIRST])
    fa = FakeActions(); s = Show(fa, 0, start_with_song=True, disabled={FIRST})
    check("the opening song skips an off song", fa.last("song") == SECOND)
    fa = FakeActions(); s = Show(fa, 0); s.set_enabled(SECOND, False)
    s.tick(PHASE_SECONDS); t = run_song(s, PHASE_SECONDS, FIRST)
    check("the order goes past a song switched off", s.state(t)["next_song"] == SONG_ORDER[2])
    s.set_enabled(SECOND, True); s.order_idx = 1
    check("a song switched on again is back in the order", s.state(t)["next_song"] == SECOND)
    fa = FakeActions(); s = Show(fa, 0); s.set_next(SECOND); s.set_enabled(SECOND, False)
    check("switching off the picked song drops the pick", not s.state(0)["next_picked"] and s.state(0)["next_song"] == FIRST)
    check("an off song can't be picked", not s.set_next(SECOND)[0])
    check("unknown song can't be switched", not s.set_enabled("nope", False)[0])
    pair = pick_song("A", "B", SONG_ORDER)
    fa = FakeActions(); s = Show(fa, 0, disabled={pair}); s.on_chip(10, "A"); s.on_chip(20, "B")
    check("pair songs leave out off songs", s.pair_song != pair and s.pair_song == pick_song("A", "B", s._enabled_songs()))
    fa = FakeActions(); s = Show(fa, 0); s.on_chip(10, "A"); s.on_chip(20, "B"); s.set_enabled(pair, False)
    check("a waiting pair song switched off gives way", s.pair_song not in (pair, None))
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS); s.on_trigger_status(PHASE_SECONDS + 1, FIRST)
    s.set_enabled(FIRST, False)
    check("a song switched off while playing plays on", s.mode == "song" and s.state(PHASE_SECONDS + 2)["playing"] == FIRST)
    fa = FakeActions(); s = Show(fa, 0, disabled=[x for x in SONG_ORDER if x != FIRST])
    check("the last song on can't be switched off", not s.set_enabled(FIRST, False)[0] and s.state(0)["next_song"] == FIRST)
    s.last_song = FIRST
    check("the only song on plays even if it just played", s.state(0)["next_song"] == FIRST)
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "off.json")
        check("no file: all songs on", load_disabled(path) == set())
        save_disabled(path, {FIRST})
        check("switched-off songs survive a restart", load_disabled(path) == {FIRST})
        with open(path, "w") as f:
            json.dump([SECOND, "gone"], f)
        check("names no longer in the show are dropped", load_disabled(path) == {SECOND})
        with open(path, "w") as f:
            f.write("{broken")
        check("a broken file means all songs on", load_disabled(path) == set())

    print(f"\n{len(fails)} failed" if fails else "\nall passed")
    return 1 if fails else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    run_live()
