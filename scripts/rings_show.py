"""
Rings show controller: triggers with RFID interaction, then songs.

Cycle (the live show opens with the first song in SONG_ORDER, then step 1)
  1. Trigger phase (PHASE_SECONDS): a trigger from TRIGGER_LIST plays and RFID is
     live (boxes show "ready").
  2. No interaction: when the phase ends, the next song in SONG_ORDER plays (skipping
     it if it is the song that just played), then the next trigger starts.
  3. First chip (A): "agent" plays at once and A is remembered. Until agent ends plus
     SECOND_CHIP_GRACE seconds, a different chip (B) may be tapped (boxes show a
     rainbow). More taps of A do nothing. The trigger phase clock is paused while
     agent plays.
  4. Second chip (B != A) in time: agent is cut, "agent_story" plays (boxes show
     confetti), then the song picked for the pair (A, B) (boxes off), then the next
     trigger.
  5. No second chip in time: A is forgotten and the trigger we were on resumes with
     the time it had left.
  RFID is ignored while agent_story or a song plays. Brightness is left to the
  retained "brightness" topic (Home Assistant); this script never touches it.

Pair -> song uses rendezvous hashing over the two chip UIDs (order-independent):
a pair always gets the same song, pairs spread evenly over the songs, and adding a
song later only moves about 1/n of the pairs to it.

Song ends are read from the trigger service's retained MQTT "trigger" topic: the
song's name while it plays, {} once it has ended.

Usage
  python scripts/rings_show.py                 # run the show (Ctrl+C to quit)
  python scripts/rings_show.py --selftest      # run the scenario tests, no network
  TRIGGER_SERVICE_URL / MQTT_BROKER env vars override the defaults (localhost).
"""

import hashlib
import json
import os
import queue
import sys
import time

# --- show configuration -------------------------------------------------------

TRIGGER_LIST = ["psychedelic", "mystery", "random", "chill", "party", "background"]
SONG_ORDER = ["aladdin", "buttons", "loop", "shemesh", "inequal"]
PHASE_SECONDS = 3 * 60
AGENT_SONG = "agent"
STORY_SONG = "agent_story"
SECOND_CHIP_GRACE = 10.0      # seconds after agent ends to tap the second chip
SONG_START_TIMEOUT = 20.0     # a song that never shows up on the trigger topic counts as ended
TRIGGER_RESEND_GUARD = 3.0    # don't re-send a trigger more often than this

TRIGGER_SERVICE_URL = os.environ.get("TRIGGER_SERVICE_URL", "http://localhost:8083")
MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_TRIGGER_TOPIC = "trigger"
MQTT_RFID_TOPIC = "sensors/rfid"
NUM_BOXES = 5

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


# --- the show state machine (no I/O: actions are injected, time is passed in) ---

class Show:
    def __init__(self, actions, now, start_with_song=False):
        self.a = actions
        self.mode = "trigger"            # trigger | agent | story | song
        self.trig_idx = 0
        self.phase_left = PHASE_SECONDS  # seconds left in the current trigger phase
        self.phase_since = None          # when the phase clock last (re)started; None = paused
        self.order_idx = 0               # next song in SONG_ORDER
        self.last_song = None
        self.chip_a = None               # first chip, waiting for a second one
        self.window_until = None         # second-chip deadline once agent has ended
        self.pair_song = None            # song to play after agent_story
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

    def _next_order_song(self):
        for _ in range(len(SONG_ORDER)):
            song = SONG_ORDER[self.order_idx % len(SONG_ORDER)]
            self.order_idx += 1
            if song != self.last_song or len(SONG_ORDER) == 1:
                return song
        return SONG_ORDER[0]

    def _forget_chip(self):
        self.chip_a = None
        self.window_until = None

    # -- events --
    def on_chip(self, now, uid):
        # The box halts each chip after reading it, so one tap = one message.
        uid = str(uid)
        if self.mode in ("story", "song"):
            log(f"chip {uid} ignored ({self.mode} playing)")
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
        self.pair_song = pick_song(self.chip_a, uid, SONG_ORDER)
        log(f"second chip {uid}: pair ({self.chip_a}, {uid}) -> '{self.pair_song}'")
        self._forget_chip()
        if self.mode == "trigger":
            self._pause_phase(now)
        self._play(now, STORY_SONG, "story")

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
            self._start_trigger(now, fresh=True)

    def tick(self, now):
        if self.expect is not None and not self.expect_seen and now - self.expect_since > SONG_START_TIMEOUT:
            log(f"'{self.expect}' never started, moving on")
            self._song_ended(now, self.expect)
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


def run_live():
    import paho.mqtt.client as mqtt
    events = queue.Queue()

    def on_connect(client, userdata, flags, reason_code, properties=None):
        log(f"connected to MQTT {MQTT_BROKER}")
        client.subscribe(MQTT_TRIGGER_TOPIC)
        client.subscribe(f"{MQTT_RFID_TOPIC}/+/chip")

    def on_message(client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return
        if msg.topic == MQTT_TRIGGER_TOPIC:
            events.put(("status", data.get("trigger_name") if isinstance(data, dict) else None))
        elif msg.topic.endswith("/chip") and isinstance(data, dict) and data.get("UID"):
            events.put(("chip", data["UID"]))

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

    show = Show(LiveActions(client), time.monotonic(), start_with_song=True)
    log(f"show running: triggers {TRIGGER_LIST}, songs {SONG_ORDER}, phase {PHASE_SECONDS}s")
    try:
        while True:
            try:
                kind, value = events.get(timeout=0.2)
                now = time.monotonic()
                if kind == "status":
                    show.on_trigger_status(now, value)
                else:
                    show.on_chip(now, value)
            except queue.Empty:
                pass
            show.tick(time.monotonic())
    except KeyboardInterrupt:
        log("exiting")
    finally:
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
    quiet = []
    log = quiet.append  # keep test output clean
    fails = []

    def check(name, cond):
        print(("PASS " if cond else "FAIL ") + name)
        if not cond:
            fails.append(name)

    def run_song(show, t, song, length=100):
        """Simulate the trigger topic for a song we just started: playing, then {}."""
        show.on_trigger_status(t, song)
        show.on_trigger_status(t + length, None)
        return t + length

    # 1. no interaction: phase -> order song -> next trigger, songs in order
    fa = FakeActions(); s = Show(fa, 0)
    s.tick(PHASE_SECONDS - 1)
    check("no song before the phase ends", fa.last("song") is None)
    s.tick(PHASE_SECONDS)
    check("first order song is aladdin", fa.last("song") == "aladdin" and s.mode == "song")
    t = run_song(s, PHASE_SECONDS, "aladdin")
    check("next trigger after the song", fa.last("trigger") == TRIGGER_LIST[1] and s.mode == "trigger")
    s.tick(t + PHASE_SECONDS)
    check("second order song is buttons", fa.last("song") == "buttons")

    # 2. order skips the song that just played (e.g. a pair song)
    fa = FakeActions(); s = Show(fa, 0); s.last_song = "aladdin"
    s.tick(PHASE_SECONDS)
    check("order skips the song that just played", fa.last("song") == "buttons")

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
    check("second chip cuts to agent_story", fa.last("song") == STORY_SONG and s.mode == "story")
    pair = pick_song("A", "B", SONG_ORDER)
    s.on_trigger_status(21, STORY_SONG); s.on_trigger_status(80, None)
    check("pair song after agent_story", fa.last("song") == pair and s.mode == "song")
    s.on_trigger_status(81, pair); s.on_trigger_status(300, None)
    check("next trigger after the pair song", s.mode == "trigger" and fa.last("trigger") == TRIGGER_LIST[1])
    check("pair song counts as last played", s.last_song == pair)

    # 5. second chip within the grace after agent ended
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG); s.on_trigger_status(70, None)
    s.on_chip(75, "B")
    check("second chip inside the grace plays agent_story", fa.last("song") == STORY_SONG)

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
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS); s.on_trigger_status(PHASE_SECONDS + 1, "aladdin")
    s.on_chip(PHASE_SECONDS + 5, "A")
    check("chips ignored while a song plays", fa.last("song") == "aladdin" and s.chip_a is None)

    # 7. failures: agent_story missing -> pair song directly; song never starts -> move on
    fa = FakeActions(); fa.fail.add(STORY_SONG); s = Show(fa, 0)
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
    s.on_trigger_status(66, STORY_SONG); s.on_trigger_status(120, None)
    check("boxes off during the pair song", fa.last("boxes")[0] == BOX_OFF)
    fa = FakeActions(); s = Show(fa, 0); s.tick(PHASE_SECONDS)
    check("boxes off during an order song", fa.last("boxes")[0] == BOX_OFF)
    s.on_trigger_status(PHASE_SECONDS + 1, "aladdin"); s.on_trigger_status(PHASE_SECONDS + 200, None)
    check("boxes ready again in the next trigger's color", fa.last("boxes") == (BOX_COLOR, BOX_READY_COLORS[1]))
    fa = FakeActions(); s = Show(fa, 0)
    s.on_chip(10, "A"); s.on_trigger_status(11, AGENT_SONG); s.on_trigger_status(60, None); s.tick(70)
    check("boxes back to ready when chip A is forgotten", fa.last("boxes") == READY)

    # 9. live start: first order song, then the first trigger with a full phase
    fa = FakeActions(); s = Show(fa, 0, start_with_song=True)
    check("starts with the first order song", fa.last("song") == "aladdin" and s.mode == "song" and fa.last("trigger") is None)
    check("boxes off during the opening song", fa.last("boxes")[0] == BOX_OFF)
    s.on_trigger_status(1, "aladdin"); s.tick(PHASE_SECONDS + 1)
    check("opening song is not cut by the phase clock", s.mode == "song")
    s.on_trigger_status(PHASE_SECONDS + 2, None); t = PHASE_SECONDS + 2
    check("first trigger after the opening song", fa.last("trigger") == TRIGGER_LIST[0] and s.mode == "trigger" and s.phase_left == PHASE_SECONDS)
    check("boxes ready in the first color after the opening song", fa.last("boxes") == (BOX_COLOR, BOX_READY_COLORS[0]))
    s.tick(t + PHASE_SECONDS)
    check("next order song after the opening one is buttons", fa.last("song") == "buttons")

    # 10. pair hashing: order-independent, roughly even, adding a song moves few pairs
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

    print(f"\n{len(fails)} failed" if fails else "\nall passed")
    return 1 if fails else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    run_live()
