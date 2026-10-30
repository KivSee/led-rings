import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats } from "../time/time";
import { constColor, noColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import { FloatFunction } from "../effects/functions";
import { nestingDepth, functionCount, compactEffects } from "../effects/compact";
import { elements, segment } from "../objects/elements";
import { all } from "../objects/ring-elements";
import { sendSequence } from "../services/sequence";
import { startSong } from "../services/trigger";
import { ChildrenNote, PIANO_NOTES, RISING_PIANO_NOTES, GUITAR_NOTES, WHITE_FLICKERS } from "./children-notes";
import { CONTINUING_PIANO_NOTES, CONTINUATION_BEAT_SECONDS, CONTINUATION_BEAT_ANCHOR_SECONDS, CONTINUATION_END_SECONDS } from "./children-continuation";
import { AIR_SWELL, SYNTH_NOTES, SYNTH_ENTRANCE, LATER_FLICKERS, SECOND_BUILD_START_SECONDS, SECOND_DROP_SECONDS, THIRD_BUILD_START_SECONDS, MINI_DROP_SECONDS } from "./children-accents";
import { DRUM_ROLLS, PRE_FINALE_DRUM_HITS, DRUM_FINALE_RESOLVE_SECONDS } from "./children-drums";
import { BASS_NOTES } from "./children-bass";
import { PAD_NOTES, PAD_PASSAGES } from "./children-pad";
import { BASS_ROLLS } from "./children-bass-rolls";
import { GUITAR_GESTURES } from "./children-guitar";
import { PIANO_ARTICULATIONS } from "./children-piano-review";

const BPM = 136;
const BEATS_PER_SECOND = BPM / 60;
// Raw 8-bit beat brightness, converted to the renderer's 0–1 scale.
const BEAT_FLOOR = 0;
const BEAT_PEAK = 64 / 255;
const GUITAR_START_SECONDS = GUITAR_NOTES[0].startSeconds;
const BUILD_START_SECONDS = 28;
const FIRST_FLICKER_START_SECONDS = 64 / BEATS_PER_SECOND;
const AIR_FADE_START_BEAT = 72;
const AIR_END_BEAT = 88;
const AIR_RETURN_START_BEAT = (56 - 1) * 4;
const AIR_RETURN_FADE_BEAT = (59 - 1) * 4;
const AIR_RETURN_END_BEAT = 60 * 4;
const DROP_SECONDS = 42;
// Preserve the four-beat drop fade before the gentle rhythm layer enters.
const DROP_END_SECONDS = DROP_SECONDS + 4 / BEATS_PER_SECOND;
const DURATION_SECONDS = CONTINUATION_END_SECONDS;
const GOLD_CONTOUR_START_SECONDS = (120 - 1) * 4 / BEATS_PER_SECOND;
const GOLD_BEAT_START_SECONDS = (128 - 1) * 4 / BEATS_PER_SECOND;
const GOLD_BEAT_SATURATION = Math.pow(0.80, 0.25);
// Both blooms share the same four-bar release; their radial directions differ.
const BLOOM_FADE_SECONDS = 16 * CONTINUATION_BEAT_SECONDS;
const SECOND_DROP_END_SECONDS = SECOND_DROP_SECONDS + BLOOM_FADE_SECONDS;
const MINI_DROP_END_SECONDS = MINI_DROP_SECONDS + BLOOM_FADE_SECONDS;
const DRUM_WAVE_SECONDS = 0.34;
const FINAL_DRUM_WAVE_SECONDS = 0.50;
const FIRST_DRUM_ROLL_END_SECONDS = DRUM_ROLLS[0].hits[DRUM_ROLLS[0].hits.length - 1].startSeconds + DRUM_WAVE_SECONDS;
const CCW_RINGS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const BASS_RINGS = [2, 6, 10];
const BASS_INNER_RING = "5";
const BASS_END_SECONDS = 60 / BEATS_PER_SECOND;
// Use the same short articulations in the MIDI roll and the purple lights.
const BASS_BREATHS = BASS_NOTES.filter(note => note.startSeconds < BASS_END_SECONDS).map(note => ({
  ...note,
  endSeconds: Math.min(note.endSeconds, note.startSeconds + (note.soft ? 1.25 : 1.40), BASS_END_SECONDS),
}));
// The five F4 fragments after the final C5 are false piano detections.
// The last real piano note ends during displayed beat 55.
const INTRO_PIANO_REST = { startSeconds: 24.338, endSeconds: 28 };
// Around bar 28 the remaining D♯ tail is masked by percussion, not five
// fresh piano attacks. Keep its travel slots, but exclude it from light/MIDI.
const PIANO_REST = { startSeconds: 45.827, endSeconds: 48.213 };
const pianoArticulation = (note: ChildrenNote) => PIANO_ARTICULATIONS.find(review =>
  note.pitch === review.pitch && note.startSeconds >= review.startSeconds && note.startSeconds < review.endSeconds);
const isPianoRest = (note: ChildrenNote) => (note.pitch === 65
  && note.startSeconds >= INTRO_PIANO_REST.startSeconds && note.startSeconds < INTRO_PIANO_REST.endSeconds)
  || note.startSeconds > (pianoArticulation(note)?.startSeconds ?? Infinity);
const pianoNoteEnd = (note: ChildrenNote) => Math.min(note.endSeconds, pianoArticulation(note)?.attackEndSeconds ?? Infinity);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
// Adjacent pairs on opposite sides; saturated cyan stays distinct from white.
const PIANO_ROLES = {
  low: { innerRings: [6, 7], buildInnerRings: [6, 7, 5, 8, 4], orderedArc: [8, 7, 6, 5, 4], hue: 0.60, sat: 0.95 },
  high: { innerRings: [12, 1], buildInnerRings: [12, 1, 11, 2, 10], orderedArc: [2, 1, 12, 11, 10], hue: 0.51, sat: 1 },
};
// Each four-bar return grows into a wider arc on the same opposite sides.
// The last phrase keeps its full size until the recorded drop attack.
const PIANO_BUILD_STAGES = [
  { innerRingCount: 2, brightness: 0.55 },
  { innerRingCount: 3, brightness: 0.70 },
  { innerRingCount: 4, brightness: 0.85 },
  { innerRingCount: 5, brightness: 1.00 },
].map((stage, index) => ({
  ...stage,
  startBeat: (59 + index * 4) * 4,
  endBeat: index === 3 ? SECOND_DROP_SECONDS * BEATS_PER_SECOND : (63 + index * 4) * 4,
}));

type OutroMotion = "steady" | "unfold" | "sweep";
// Bar-wide totals, not a uniform count on every main circle. Smaller breaths
// between larger expansions keep the build growing without equal-sized steps.
const OUTRO_BARS = [
  [8, 0.50], [17, 0.52], [21, 0.55], [26, 0.56], [28, 0.60], [31, 0.62],
  [35, 0.63], [38, 0.67], [40, 0.68], [45, 0.71], [48, 0.74], [52, 0.75],
  [55, 0.78], [57, 0.81], [62, 0.83], [66, 0.84], [69, 0.87], [72, 0.90],
  [76, 0.91], [79, 0.94], [82, 0.96], [86, 0.98], [90, 1.00],
].map(([innerRingCount, brightness], index) => ({
  number: 112 + index, innerRingCount, brightness,
  previousBrightness: index === 0 ? brightness : 0,
  motion: (["steady", "unfold", "sweep", "steady", "unfold", "sweep"] as OutroMotion[])[Math.floor(index / 4)],
  startBeat: (111 + index) * 4,
  endBeat: Math.min((112 + index) * 4, DRUM_ROLLS[1].hits[0].startSeconds * BEATS_PER_SECOND),
}));
OUTRO_BARS.forEach((bar, index) => { bar.previousBrightness = OUTRO_BARS[Math.max(0, index - 1)].brightness; });
const outroStage = (note: ChildrenNote) => OUTRO_BARS.find(stage =>
  note.startSeconds * BEATS_PER_SECOND >= stage.startBeat && note.startSeconds * BEATS_PER_SECOND < stage.endBeat);
const noteBar = (note: ChildrenNote) => Math.floor(note.startSeconds * BEATS_PER_SECOND / 4);
const outroLowestPitches = new Map<number, number>();
for (const note of CONTINUING_PIANO_NOTES) {
  if (!outroStage(note)) continue;
  const bar = noteBar(note);
  outroLowestPitches.set(bar, Math.min(outroLowestPitches.get(bar) ?? 127, note.pitch));
}
const isOutroLowNote = (note: ChildrenNote) => !!outroStage(note) && outroLowestPitches.get(noteBar(note)) === note.pitch;

function planOutroRings() {
  const plans = new Map<ChildrenNote, number[]>();
  let step = 0;
  const visits = [...PIANO_NOTES, ...RISING_PIANO_NOTES, ...CONTINUING_PIANO_NOTES].map(note => {
    const ring = CCW_RINGS[step % CCW_RINGS.length];
    step += Math.max(1, Math.round((note.endSeconds - note.startSeconds) * BEATS_PER_SECOND * 4));
    return { note, ring, role: isOutroLowNote(note) ? "low" as const : note.buildRole ?? "low" as const };
  });
  const arcs = { low: [6, 7, 5, 8, 4, 9, 3, 10], high: [12, 1, 11, 2, 10, 3, 9, 4] };
  let previousTotal = 0;
  OUTRO_BARS.forEach((bar, barIndex) => {
    const phrase = Math.floor(barIndex / 4);
    const groups = new Map<string, { ring: number; order: number[]; count: number; weight: number; notes: ChildrenNote[] }>();
    const cells = new Set<string>();
    for (const { note, ring, role } of visits) {
      // Include tails crossing the bar line in the actual participating total.
      if (note.startSeconds * BEATS_PER_SECOND < bar.startBeat && note.endSeconds * BEATS_PER_SECOND > bar.startBeat) {
        for (const inner of plans.get(note) ?? PIANO_ROLES[role].innerRings) cells.add(`${ring}:${inner}`);
      }
      if (outroStage(note) !== bar) continue;
      const key = `${ring}:${role}`;
      if (!groups.has(key)) {
        const order = [...arcs[role]];
        // Alternate which edge opens first, retaining a continuous arc.
        if ((ring + phrase) % 3 === 0) for (let i = 0; i < order.length; i += 2) [order[i], order[i + 1]] = [order[i + 1], order[i]];
        const angle = (ring - 1) * Math.PI / 6 - phrase * 1.1;
        groups.set(key, { ring, order, count: 2, weight: 1 + 0.38 * Math.cos(angle) + 0.13 * Math.sin(2 * angle), notes: [] });
      }
      groups.get(key)!.notes.push(note);
    }
    for (const group of groups.values()) for (const inner of group.order.slice(0, 2)) cells.add(`${group.ring}:${inner}`);
    const target = Math.max(bar.innerRingCount, cells.size, previousTotal + 1);
    while (cells.size < target) {
      // Unequal spatial weights let some circles open sooner than others.
      const next = [...groups.values()].filter(group => group.count < group.order.length)
        .sort((a, b) => (a.count - 1) / a.weight - (b.count - 1) / b.weight)[0];
      if (!next) throw new Error(`Bar ${bar.number} cannot reach ${target} participating inner rings`);
      cells.add(`${next.ring}:${next.order[next.count++]}`);
    }
    for (const group of groups.values()) {
      // Order the chosen cells along the arc for the soft sweep/opening motion.
      const order = group.order.includes(12) ? [4, 3, 2, 1, 12, 11, 10, 9] : [10, 9, 8, 7, 6, 5, 4, 3];
      const selected = order.filter(inner => group.order.slice(0, group.count).includes(inner));
      for (const note of group.notes) plans.set(note, selected);
    }
    bar.innerRingCount = previousTotal = cells.size;
  });
  return plans;
}
const OUTRO_RING_PLANS = planOutroRings();

function outroMotionWeight(motion: OutroMotion, progress: number, index: number, count: number) {
  if (motion === "steady") return 1;
  if (motion === "unfold") {
    const x = clamp(progress * 2 - index / (count - 1) * 0.5);
    return 0.65 + 0.35 * x * x * (3 - 2 * x);
  }
  const distance = Math.abs(index - (progress * (count + 1) - 1));
  return 0.65 + 0.35 * (1 + Math.cos(Math.PI * clamp(distance / 1.5))) / 2;
}

function outroSections() {
  const firstRollStart = DRUM_ROLLS[0].hits[0].startSeconds * BEATS_PER_SECOND;
  const firstRollEnd = FIRST_DRUM_ROLL_END_SECONDS * BEATS_PER_SECOND;
  const flashesStart = PRE_FINALE_DRUM_HITS[0].startSeconds * BEATS_PER_SECOND;
  const endBeat = OUTRO_BARS[OUTRO_BARS.length - 1].endBeat;
  const boundaries = [...new Set([...OUTRO_BARS.map(s => s.startBeat), firstRollStart, firstRollEnd, flashesStart, endBeat])].sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((startBeat, index) => {
    const stage = OUTRO_BARS.find(s => startBeat >= s.startBeat && startBeat < s.endBeat)!;
    const drums = startBeat >= firstRollStart && startBeat < firstRollEnd ? " + drum ripples"
      : startBeat >= flashesStart ? " + drum flashes" : "";
    return {
      name: `Build · bar ${stage.number} · ${stage.innerRingCount} inner rings${drums}`,
      startBeat, endBeat: boundaries[index + 1], fadeInBeats: 0, fadeOutBeats: 0,
    };
  });
}

function firstPianoBuild(note: ChildrenNote) {
  const start = (17 - 1) * 4 / BEATS_PER_SECOND;
  if (!note.buildRole || note.startSeconds < start || note.startSeconds >= DROP_SECONDS) return undefined;
  // Stable randomness gives every replay the same musical accents. Share the
  // variation across a low/high note pair instead of changing it every frame.
  const random = (index: number, salt: number) => {
    let x = Math.imul(index + 1, 374761393) ^ salt;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 0xffffffff * 2 - 1;
  };
  const pair = Math.floor((note.startSeconds - RISING_PIANO_NOTES[0].startSeconds + 0.015) / CONTINUATION_BEAT_SECONDS);
  const bar = Math.floor(pair / 4);
  const time = RISING_PIANO_NOTES[0].startSeconds + pair * CONTINUATION_BEAT_SECONDS;
  const progress = clamp((time - start) / (DROP_SECONDS - start));
  const count = Math.max(2, Math.min(6, Math.round(2 + 4 * progress + 0.9 * random(pair, 0x4348494c) + 0.4 * random(bar, 0x52494e47))));
  const brightness = Math.max(0.28, Math.min(1, 0.34 + 0.64 * Math.pow(progress, 0.9)
    + 0.08 * random(pair, 0x5049414e) + 0.06 * random(bar, 0x4255494c)));
  const role = PIANO_ROLES[note.buildRole];
  const arc = [...role.buildInnerRings, note.buildRole === "low" ? 9 : 3];
  if (random(bar, 0x45444745) > 0) {
    [arc[2], arc[3]] = [arc[3], arc[2]];
    [arc[4], arc[5]] = [arc[5], arc[4]];
  }
  return { innerRings: arc.slice(0, count), brightness };
}

function buildEnvelope(note: ChildrenNote, variedBrightness?: number): number[] {
  const peak = Math.max(0.001, ...note.envelope);
  return note.envelope.map((level, i) => {
    const time = note.startSeconds + (note.endSeconds - note.startSeconds) * i / (note.envelope.length - 1);
    const progress = clamp((time - BUILD_START_SECONDS) / (DROP_SECONDS - BUILD_START_SECONDS));
    // The bar-17 build has local dips and surges around a rising trend. Retain
    // the measured attack/decay and the original entrance before bar 17.
    const crescendo = variedBrightness ?? 0.32 + 0.68 * Math.pow(progress, 1.25);
    return crescendo * (0.45 + 0.55 * Math.pow(clamp(level / peak), 0.6));
  });
}

// Short envelopes keep controller allocations small: at most two half nodes
// along a path. Audio onsets/durations remain in the effect config.
const sampledEnvelope = (levels: number[]): FloatFunction => {
  const at = (x: number) => {
    const pos = x * (levels.length - 1), i = Math.min(levels.length - 2, Math.floor(pos));
    return levels[i] + (levels[i + 1] - levels[i]) * (pos - i);
  };
  const values = [0, 0.25, 0.5, 0.75, 1].map(at);
  const line = (a: number, b: number): FloatFunction => ({ linear: { start: a, end: b } });
  if (values.every(v => Math.abs(v - values[0]) < 0.002)) return { const_value: { value: values[0] } };
  if (values.every((v, i) => Math.abs(v - (values[0] + (values[4] - values[0]) * i / 4)) < 0.015)) return line(values[0], values[4]);
  return { half: { f1: { half: { f1: line(values[0], values[1]), f2: line(values[1], values[2]) } },
    f2: { half: { f1: line(values[2], values[3]), f2: line(values[3], values[4]) } } } };
};

// One shallow sine gives a smooth pulse from dark to raw brightness 64.
function beatPulse(start: number, end: number): FloatFunction {
  return { sin: {
    min: BEAT_FLOOR, max: BEAT_PEAK,
    phase: 0.25 + (start - CONTINUATION_BEAT_ANCHOR_SECONDS) / CONTINUATION_BEAT_SECONDS,
    repeats: (end - start) / CONTINUATION_BEAT_SECONDS,
  } };
}

function whiteBeatAt(time: number) {
  const start = Math.round(DROP_END_SECONDS * 1000) / 1000;
  const x = clamp((time - start) / (4 * CONTINUATION_BEAT_SECONDS));
  const b = (1 + Math.cos(2 * Math.PI * (time - CONTINUATION_BEAT_ANCHOR_SECONDS) / CONTINUATION_BEAT_SECONDS)) / 2;
  const pulse = BEAT_FLOOR + (BEAT_PEAK - BEAT_FLOOR) * b;
  return pulse * x * x * (3 - 2 * x);
}

function bassBreaths() {
  const smooth = (x: number) => x * x * (3 - 2 * x);
  for (const note of BASS_BREATHS) {
    const attack = 0.05 / (note.endSeconds - note.startSeconds);
    const levels = Array.from({ length: 65 }, (_, i) => {
      const progress = i / 64;
      // Keep the attack on the bass hit, then settle with a longer, smooth tail.
      return progress < attack ? smooth(progress / attack)
        : Math.pow(1 - smooth((progress - attack) / (1 - attack)), 1.4);
    });
    const breath = sampledEnvelope(levels);
    const pitch = clamp((note.pitch - 34) / (41 - 34));
    elements(BASS_RINGS, () => beats(note.startSeconds * BEATS_PER_SECOND, note.endSeconds * BEATS_PER_SECOND, () => segment(BASS_INNER_RING, () => {
      // One outward-facing inner ring on three equally spaced main rings.
      // The later intro notes stay quieter, still continuously pitch-scaled.
      constColor(note.soft
        ? { hue: 0.78, sat: 0.99 - 0.03 * pitch, val: 0.25 + 0.08 * pitch }
        : { hue: 0.78, sat: 0.97, val: 0.42 + 0.14 * pitch });
      addEffect({ timed_brightness: { mult_factor_decrease: breath } });
    })));
  }
}

function sustainedPad(notes: typeof PAD_NOTES, fadeInStartSeconds: number) {
  const end = notes[notes.length - 1].endSeconds;
  const smooth = (x: number) => { const y = clamp(x); return y * y * (3 - 2 * y); };
  const shade = (note: typeof PAD_NOTES[number]) => {
    const pitch = clamp((note.pitch - 72) / 8);
    // Rich amber-gold through vivid yellow-gold as the pitch rises. The model
    // displays saturation to the fourth power, so specify it in visible space.
    return { hue: 0.105 + 0.030 * pitch, sat: Math.pow(0.84 - 0.14 * pitch, 0.25), val: (0.50 + 0.30 * pitch) * note.level };
  };
  let innerRing = 3;
  notes.forEach((note, index) => {
    const previousNote = notes[Math.max(0, index - 1)];
    // All four lights take the same one-ring step at each pitch change:
    // clockwise for a rise, counterclockwise for a fall, wrapping at twelve.
    innerRing = (innerRing + Math.sign(note.pitch - previousNote.pitch) + 12) % 12;
    const previous = shade(previousNote);
    const next = shade(note);
    const colors = Array.from({ length: 65 }, (_, i) => {
      const time = note.startSeconds + (note.endSeconds - note.startSeconds) * i / 64;
      // Retain the gentle shade transition and the whole phrase's entrance/exit.
      const mix = smooth((time - note.startSeconds) / 0.18);
      const gate = smooth((time - fadeInStartSeconds) / 0.9) * smooth((end - time) / 1.75);
      const val = previous.val + (next.val - previous.val) * mix;
      const base = whiteBeatAt(time);
      return {
        hue: previous.hue + (next.hue - previous.hue) * mix,
        sat: (previous.sat + (next.sat - previous.sat) * mix) * gate,
        val: base + (val - base) * gate,
      };
    });
    // Four equally spaced main rings, always sharing one inner-ring position.
    // Foreground notes still paint above this warm background layer.
    elements([12, 3, 6, 9], () => beats(note.startSeconds * BEATS_PER_SECOND, note.endSeconds * BEATS_PER_SECOND, () => segment(String(innerRing), () => {
      const hue = sampledEnvelope(colors.filter((_, i) => i % 2 === 0).map(color => color.hue));
      // Equal rainbow endpoints set one animated hue plus full S/V in one effect.
      addEffect({ rainbow: { hue_start: hue, hue_end: hue } });
      addEffect({ timed_saturation: { mult_factor_decrease: sampledEnvelope(colors.filter((_, i) => i % 2 === 0).map(color => color.sat)) } });
      addEffect({ timed_brightness: { mult_factor_decrease: sampledEnvelope(colors.filter((_, i) => i % 2 === 0).map(color => color.val)) } });
    })));
  });
}

function bassRollFlashes() {
  for (const roll of BASS_ROLLS) {
    roll.hits.forEach((hit, index) => {
      const next = roll.hits[index + 1]?.startSeconds ?? roll.dropSeconds;
      const end = Math.min(hit.startSeconds + 0.065, next, roll.dropSeconds);
      const progress = index / Math.max(1, roll.hits.length - 1);
      const peak = (0.09 + 0.09 * progress) * (0.65 + 0.35 * Math.sqrt(hit.strength));
      const envelope = sampledEnvelope([0, 0.55, 0.9, 1, 0.95, 0.82, 0.65, 0.48, 0.34, 0.23, 0.15, 0.09, 0.05, 0.025, 0.01, 0.003, 0].map(level => level * peak));
      elements(BASS_RINGS, () => beats(hit.startSeconds * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment(BASS_INNER_RING, () => {
        // Tiny accents on just 36 LEDs; preserve their existing color and beat.
        // The piano and flicker are painted above this supporting rhythm.
        addEffect({ timed_brightness: { mult_factor_increase: envelope } });
      })));
    });
  }
}

function breathingBeat() {
  // Four evenly spaced LEDs from b1 pulse on the measured kick phase. The sine stays
  // smooth; later note and accent layers paint over this base.
  const start = Math.round(DROP_END_SECONDS * 1000) / 1000;
  const end = CONTINUATION_END_SECONDS;
  const fadeSeconds = 4 * CONTINUATION_BEAT_SECONDS;
  const ease = Array.from({ length: 17 }, (_, i) => {
    const x = i / 16;
    return x * x * (3 - 2 * x);
  });
  elements(all, () => {
    beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment("b1_sparse", () => {
      constColor({ hue: 0, sat: 0, val: 1 });
      addEffect({ timed_brightness: { mult_factor_decrease: beatPulse(start, end) } });
    }));
    // Ease out of the drop's black endpoint over the first bar.
    beats(start * BEATS_PER_SECOND, (start + fadeSeconds) * BEATS_PER_SECOND, () => segment("b1_sparse", () => {
      addEffect({ timed_brightness: { mult_factor_decrease: sampledEnvelope(ease) } });
    }));
    // The final snare uses full-ring confetti, then settles into the existing
    // held gold glow for the recording's fade to black.
    beats(DRUM_FINALE_RESOLVE_SECONDS * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => {
      constColor({ hue: 0.125, sat: GOLD_BEAT_SATURATION, val: 1 });
    });
  });
}

function goldSnareConfetti() {
  const geometry = require("../ring-segments/segments.json") as {
    numberOfPixels: number;
    segments: { name: string; pixels: { index: number; relPos: number }[] }[];
  };
  const edge = geometry.segments.find(s => s.name === "rad")!.pixels.filter(p => p.relPos >= 0.86).map(p => p.index);
  const full = geometry.segments.find(s => s.name === "all")!.pixels.map(p => p.index);
  const stepFunction = (values: number[]): FloatFunction => values.length === 1
    ? { const_value: { value: values[0] } }
    : { half: { f1: stepFunction(values.slice(0, values.length / 2)), f2: stepFunction(values.slice(values.length / 2)) } };
  const passages = [
    { start: GOLD_CONTOUR_START_SECONDS, end: GOLD_BEAT_START_SECONDS, pool: edge, count: 6 },
    { start: GOLD_BEAT_START_SECONDS, end: DRUM_FINALE_RESOLVE_SECONDS, pool: full, count: 36 },
  ];
  CCW_RINGS.forEach(ring => {
    let seed = (0x534e4152 ^ Math.imul(ring, 0x9e3779b9)) >>> 0;
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0x100000000; };
    for (const passage of passages) {
      const start = Math.round(passage.start * 1000) / 1000;
      const end = Math.round(passage.end * 1000) / 1000;
      const frames: number[][] = [];
      let previous = new Set<number>();
      for (let frame = 0; frame < 4; frame++) {
        const available = passage.pool.filter(index => !previous.has(index) && (frame !== 3 || !frames[0].includes(index)));
        for (let i = available.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [available[i], available[j]] = [available[j], available[i]];
        }
        const selected = available.slice(0, passage.count);
        frames.push(selected); previous = new Set(selected);
      }
      elements([ring], () => {
        // The shared layer is emitted once. Each spark has one repeating
        // position track instead of another six effects every sixteenth note.
        beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => constColor({ hue: 0.125, sat: 0, val: 0 }));
        for (let spark = 0; spark < passage.count; spark++) {
          let entrance = start;
          if (passage.count === 36 && spark >= 18) {
            // Invert the original smooth density ramp: 18 -> 36 sparks.
            const target = (spark - 18 + 0.5) / 18;
            let lo = 0, hi = 1;
            for (let i = 0; i < 24; i++) { const x = (lo + hi) / 2; if (x * x * (3 - 2 * x) < target) lo = x; else hi = x; }
            entrance += (end - start) * (lo + hi) / 2;
          }
          const offset = Math.ceil((entrance - start) / (CONTINUATION_BEAT_SECONDS / 4));
          entrance = Math.round((start + offset * CONTINUATION_BEAT_SECONDS / 4) * 1000) / 1000;
          const head = stepFunction(frames.map((_, i) => (frames[(i + offset) % 4][spark] + 0.45) / (geometry.numberOfPixels - 1)));
          const snake = { head, tail_length: { const_value: { value: 0.90 / (geometry.numberOfPixels - 1) } }, cyclic: false };
          beats(entrance * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => cycle(CONTINUATION_BEAT_SECONDS * BEATS_PER_SECOND, () => {
            addEffect({ snake_brightness: { ...snake, mult_factor_increase: { const_value: { value: 1 } } } });
            addEffect({ snake_saturation: { ...snake, mult_factor_increase: { const_value: { value: GOLD_BEAT_SATURATION } } } });
          }));
        }
        beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => {
          const pulse = { sin: { min: 0, max: 1, phase: 0.25 + (start - CONTINUATION_BEAT_ANCHOR_SECONDS) / CONTINUATION_BEAT_SECONDS, repeats: (end - start) / CONTINUATION_BEAT_SECONDS } };
          // Multiplication gives the same smooth beat crest without baking
          // hundreds of samples into one deeply nested function.
          for (let i = 0; i < 3; i++) addEffect({ timed_brightness: { mult_factor_decrease: pulse } });
          addEffect({ timed_brightness: { mult_factor_decrease: passage.count === 6
            ? { const_value: { value: 0.88 } }
            : sampledEnvelope(Array.from({ length: 17 }, (_, i) => 0.45 + 0.05 * (i / 16) ** 2 * (3 - 2 * i / 16))) } });
        });
        // Keep the gold tint breathing on the measured beat, independently
        // of the one-beat shuffle. Handle the initial partial beat separately.
        const nextBeat = CONTINUATION_BEAT_ANCHOR_SECONDS + Math.ceil((start - CONTINUATION_BEAT_ANCHOR_SECONDS) / CONTINUATION_BEAT_SECONDS) * CONTINUATION_BEAT_SECONDS;
        const tint = (a: number, b: number) => sampledEnvelope(Array.from({ length: 17 }, (_, i) => {
          const time = a + (b - a) * i / 16;
          return ((1 + Math.cos(2 * Math.PI * (time - CONTINUATION_BEAT_ANCHOR_SECONDS) / CONTINUATION_BEAT_SECONDS)) / 2) ** 0.25;
        }));
        beats(start * BEATS_PER_SECOND, nextBeat * BEATS_PER_SECOND, () => addEffect({ timed_saturation: { mult_factor_decrease: tint(start, nextBeat) } }));
        beats(nextBeat * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => cycle(CONTINUATION_BEAT_SECONDS * BEATS_PER_SECOND, () => {
          addEffect({ timed_saturation: { mult_factor_decrease: tint(nextBeat, nextBeat + CONTINUATION_BEAT_SECONDS) } });
        }));
        beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment("b1_sparse", () => addEffect({ timed_brightness: { mult_factor_increase: beatPulse(start, end) } })));
      });
    }
  });
}

function whiteFlickers() {
  // A continuous sixteenth-note shimmer: the 30% variation rides on a
  // rising floor, smoothly moving from 0–30% to 70–100% before each drop.
  const passages = [
    [FIRST_FLICKER_START_SECONDS, DROP_SECONDS],
    [SECOND_BUILD_START_SECONDS, SECOND_DROP_SECONDS],
    [THIRD_BUILD_START_SECONDS, MINI_DROP_SECONDS],
  ];
  for (const [start, end] of passages) elements(all, () => beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment("2", () => {
    const period = CONTINUATION_BEAT_SECONDS / 4;
    constColor({ hue: 0, sat: 0, val: 1 });
    addEffect({ timed_brightness: { mult_factor_decrease: { comb2: {
      f1: { linear: { start: 0, end: 0.7 } }, amount1: 1,
      f2: { sin: { min: 0, max: 0.3, phase: -0.25, repeats: (end - start) / period } }, amount2: 1,
    } } } });
  })));
}

function greenCarrier(start: number, end: number, lap: number, returnWave: boolean) {
  const edge: FloatFunction = { fixed_window: { start: 0.82, end: 1.001, outside_value: 0, func: { const_value: { value: 1 } } } };
  CCW_RINGS.forEach((ring, index) => elements([ring], () => beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment("rad", () => {
    constColor({ hue: 0.34, sat: 1, val: 0.85 });
    addEffect({ position_brightness: { mult_factor_decrease: edge } });
    if (returnWave) addEffect({ position_saturation: { mult_factor_decrease: edge } });
    const carrier: FloatFunction = { fixed_window: { start: index / 12, end: index / 12 + 0.35, cyclic: true, outside_value: 0,
      func: { sin: { min: 0, max: 1, phase: -0.25, repeats: 1 } } } };
    cycle(lap * BEATS_PER_SECOND, () => {
      addEffect({ timed_brightness: { mult_factor_decrease: carrier } });
      if (returnWave) addEffect({ timed_saturation: { mult_factor_decrease: carrier } });
    });
    const entryEnd = Math.min(end, start + (returnWave ? 2 / BEATS_PER_SECOND : (72 / BEATS_PER_SECOND - start)));
    beats(start * BEATS_PER_SECOND, entryEnd * BEATS_PER_SECOND, () => addEffect({ timed_brightness: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } }));
    const fadeStart = returnWave ? AIR_RETURN_FADE_BEAT : AIR_FADE_START_BEAT;
    beats(fadeStart, end * BEATS_PER_SECOND, () => addEffect({ timed_brightness: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } }));
    if (returnWave) segment("b1_sparse", () => addEffect({ timed_brightness: { mult_factor_increase: beatPulse(start, end) } }));
  }))));
}

function airWave() {
  greenCarrier(AIR_SWELL.startSeconds, AIR_END_BEAT / BEATS_PER_SECOND, (AIR_SWELL.endSeconds - AIR_SWELL.startSeconds) / 2, false);
}

function airWaveReturn() {
  greenCarrier(AIR_RETURN_START_BEAT / BEATS_PER_SECOND, AIR_RETURN_END_BEAT / BEATS_PER_SECOND, 4 / BEATS_PER_SECOND, true);
}

function synthQuads() {
  const runs: typeof SYNTH_NOTES[] = [];
  for (const note of SYNTH_NOTES) {
    const run = runs[runs.length - 1];
    if (!run || note.startSeconds - run[run.length - 1].endSeconds > 0.3) runs.push([note]);
    else run.push(note);
  }
  const innerSteps = [11, 10, 9, 8];
  for (const run of runs) for (let ring = 0; ring < 12; ring++) for (let step = 0; step < 4; step++) {
    const notes = run.filter(note => note.quad % 12 === ring && note.step === step);
    if (!notes.length) continue;
    const first = notes[0], last = notes[notes.length - 1];
    const period = 12 * CONTINUATION_BEAT_SECONDS;
    const duration = first.endSeconds - first.startSeconds;
    const level = notes.reduce((total, note) => total + note.level, 0) / notes.length;
    elements([CCW_RINGS[ring]], () => beats(first.startSeconds * BEATS_PER_SECOND, last.endSeconds * BEATS_PER_SECOND, () => segment(String(innerSteps[step]), () => {
      cycleBeats(period * BEATS_PER_SECOND, 0, duration * BEATS_PER_SECOND, () => {
        constColor({ hue: 0.76, sat: 1, val: level });
        addEffect({ timed_brightness: { mult_factor_decrease: { half: {
          f1: { linear: { start: 0, end: 1 } }, f2: { linear: { start: 1, end: 0 } },
        } } } });
      });
      if (first.startSeconds < SYNTH_ENTRANCE.endSeconds) beats(first.startSeconds * BEATS_PER_SECOND, SYNTH_ENTRANCE.endSeconds * BEATS_PER_SECOND, () => {
        addEffect({ timed_brightness: { mult_factor_decrease: { linear: { start: 0, end: 1 } } } });
      });
    })));
  }
}

function drumRipples() {
  for (const roll of DRUM_ROLLS) {
    const duration = roll.finale ? FINAL_DRUM_WAVE_SECONDS : DRUM_WAVE_SECONDS;
    const width = roll.finale ? 0.70 : 0.45;
    for (const hit of roll.hits) {
      const strength = Math.sqrt(hit.strength);
      const rawPeak = roll.finale ? 0.36 + 0.25 * strength : 0.18 + 0.20 * strength;
      const peak = rawPeak * (hit.startSeconds >= GOLD_BEAT_START_SECONDS ? 0.5 : 1);
      elements(all, () => beats(hit.startSeconds * BEATS_PER_SECOND, (hit.startSeconds + duration) * BEATS_PER_SECOND, () => segment("rad", () => {
        // The same radial crest crosses every main ring together. Add light to
        // the soft white beat, with zero at both edges so overlapping hits flow.
        addEffect({ snake_brightness: {
          head: { linear: { start: 0, end: 1 + width } },
          tail_length: { const_value: { value: width } },
          cyclic: false,
          mult_factor_increase: { sin: { min: 0, max: peak, phase: -0.25, repeats: 1 } },
        } });
      })));
    }
  }
  // A single broad bloom carries the last drum roll into the recording's tail.
  elements(all, () => beats(DRUM_FINALE_RESOLVE_SECONDS * BEATS_PER_SECOND, DURATION_SECONDS * BEATS_PER_SECOND, () => {
    const rise = sampledEnvelope(Array.from({ length: 17 }, (_, i) => {
      const x = i / 16;
      return 0.68 * x * x * (3 - 2 * x);
    }));
    addEffect({ timed_brightness: { mult_factor_increase: { fixed_window: {
      start: 0, end: CONTINUATION_BEAT_SECONDS / (DURATION_SECONDS - DRUM_FINALE_RESOLVE_SECONDS),
      outside_value: 0.68, func: rise,
    } } } });
  }));
}

function slowerDrumFlashes() {
  for (const hit of PRE_FINALE_DRUM_HITS) {
    const peak = (0.36 + 0.20 * Math.sqrt(hit.strength)) * 0.5;
    const envelope = sampledEnvelope([0, 0.65, 1, 0.97, 0.90, 0.80, 0.68, 0.55, 0.43, 0.32, 0.23, 0.15, 0.09, 0.045, 0.015, 0.003, 0].map(v => v * peak));
    elements(all, () => beats(hit.startSeconds * BEATS_PER_SECOND, (hit.startSeconds + 0.22) * BEATS_PER_SECOND, () => {
      // Every LED responds, including melody pixels, without erasing their hue.
      addEffect({ timed_brightness: { mult_factor_increase: envelope } });
    }));
  }
}

function dropBloom(start: number, end: number, direction: "inward" | "outward") {
  // A lingering white base, painted before the colored notes. Add to the beat
  // so the glow settles into it without a black frame or a brightness jump.
  const fade = sampledEnvelope(Array.from({ length: 33 }, (_, i) => 0.70 * Math.pow(1 - i / 32, 1.6)));
  elements(all, () => beats(start * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => {
    addEffect({ timed_brightness: { mult_factor_increase: fade } });
  }));
  // One broad, soft crest travels radially. The second drop contracts inward;
  // the third expands outward, sharing the same fade and travel duration.
  const width = 0.55;
  elements(all, () => beats((start + 0.5 * CONTINUATION_BEAT_SECONDS) * BEATS_PER_SECOND, end * BEATS_PER_SECOND, () => segment("rad", () => {
    addEffect({ snake_brightness: {
      head: { linear: direction === "inward" ? { start: 1 + width, end: 0 } : { start: 0, end: 1 + width } },
      tail_length: { const_value: { value: width } },
      cyclic: false,
      mult_factor_increase: { sin: { min: 0, max: 0.28, phase: -0.25, repeats: 1 } },
    } });
  })));
}

function guitarMelody() {
  const pitches = [...new Set(GUITAR_GESTURES.map(note => note.pitch))].sort((a, b) => a - b);
  // Higher tones move counterclockwise inside the main circle. Every extracted
  // pitch has its own stable position, instead of sharing the same orange pair.
  const innerPositions = [9, 8, 7, 6, 5, 4, 3, 2, 1, 12];
  let step = 0;
  GUITAR_GESTURES.forEach(note => {
    const ring = CCW_RINGS[step % CCW_RINGS.length];
    // Match the piano's travel: each note advances by its duration in quarters.
    step += Math.max(1, Math.round((note.endSeconds - note.startSeconds) * BEATS_PER_SECOND * 4));
    const inner = innerPositions[pitches.indexOf(note.pitch)] % 12;
    elements([ring], () => beats(note.startSeconds * BEATS_PER_SECOND, note.endSeconds * BEATS_PER_SECOND, () => segment(String(inner), () => {
      constColor({ hue: 0.075, sat: 0.96, val: 1 });
      // Hold each note on its ring through the measured pluck/re-attacks and decay.
      addEffect({ timed_brightness: { mult_factor_decrease: sampledEnvelope(note.envelope) } });
    })));
  });
}

function instrument(notes: ChildrenNote[], innerRings: number[], hue: number, piano = false) {
  let step = 0;
  for (const note of notes) {
    const startBeat = note.startSeconds * BEATS_PER_SECOND;
    const endBeat = note.endSeconds * BEATS_PER_SECOND;
    const pitch = clamp((note.pitch - 65) / 15);
    const ring = CCW_RINGS[step % CCW_RINGS.length];
    // One main circle per note; a beat advances four positions, a half beat two.
    step += Math.max(1, Math.round((endBeat - startBeat) * 4));
    if (piano && isPianoRest(note)) continue;
    const audibleEndSeconds = piano ? pianoNoteEnd(note) : note.endSeconds;
    const outro = piano ? outroStage(note) : undefined;
    const lowAccent = piano && isOutroLowNote(note);
    const role = piano && note.buildRole ? PIANO_ROLES[lowAccent ? "low" : note.buildRole] : undefined;
    const firstBuild = piano ? firstPianoBuild(note) : undefined;
    const phraseBuild = role && PIANO_BUILD_STAGES.find(stage => startBeat >= stage.startBeat && startBeat < stage.endBeat);
    const noteInnerRings = role
      ? outro ? OUTRO_RING_PLANS.get(note)!
        : firstBuild ? firstBuild.innerRings
        : phraseBuild ? role.buildInnerRings.slice(0, phraseBuild.innerRingCount) : role.innerRings
      : innerRings;
    const brightness = phraseBuild?.brightness ?? 0.95;
    const notePeak = Math.max(0.001, ...note.envelope);
    const levels = outro ? note.envelope.map((level, sample) => {
      const beat = startBeat + (endBeat - startBeat) * sample / (note.envelope.length - 1);
      const x = clamp((beat - outro.startBeat) / (outro.endBeat - outro.startBeat));
      const gain = outro.previousBrightness + (outro.brightness - outro.previousBrightness) * x * x * (3 - 2 * x);
      // Keep the measured attack/decay, with a rising peak that quiet source
      // notes cannot accidentally flatten as the arrangement fills out.
      return gain * Math.pow(clamp(level / notePeak), lowAccent ? 0.30 : 0.40);
    }) : role && note.startSeconds < DROP_SECONDS ? buildEnvelope(note, firstBuild?.brightness)
      : role ? note.envelope.map(level => brightness * Math.pow(clamp(level), lowAccent ? 0.30 : 0.40))
      : note.envelope.map(level => 0.18 + 0.82 * Math.pow(clamp(level), 0.45));
    const echo = piano && note.echoPair;
    // Quantize the shared boundary once, to the controller's millisecond clock.
    const middleBeat = Math.round((note.startSeconds + note.endSeconds) * 500) / 1000 * BEATS_PER_SECOND;
    const middleSample = (levels.length - 1) / 2;
    elements([ring], () => {
      noteInnerRings.forEach((inner, index) => {
        // Ring 11 follows the whole note; ring 12 joins halfway through.
        // Both stay on the same main circle and retain the measured decay.
        const from = echo && index === 1 ? middleBeat : startBeat;
        let envelope = outro
          ? levels.map((level, sample) => level * outroMotionWeight(outro.motion, sample / (levels.length - 1), index, noteInnerRings.length))
          : echo && index === 1 ? levels.slice(middleSample) : levels;
        if (outro) {
          // Changing arc motion must not reduce the new bar's brightness.
          const peakScale = Math.max(...levels) / Math.max(0.001, ...envelope);
          envelope = envelope.map(level => level * peakScale);
        }
        // Clock labels 1–12 use segment names 1–11, 0 in the wiring map.
        beats(from, audibleEndSeconds * BEATS_PER_SECOND, () => segment(String(inner % 12), () => {
          constColor(lowAccent ? { hue: 0.88, sat: 0.94, val: 1 } : role
            ? { hue: role.hue, sat: role.sat, val: 1 }
            : { hue, sat: piano ? 0.92 - pitch * 0.1 : 0.94, val: piano ? 0.84 + pitch * 0.16 : 1 });
          // Slice the measured envelope instead of replaying a fresh attack
          // or normalizing the quieter echo back to full brightness.
          addEffect({ timed_brightness: {
            mult_factor_decrease: audibleEndSeconds < note.endSeconds ? { fixed_window: {
              // Clip the tail without speeding up the surviving attack/decay.
              start: 0,
              end: (Math.round(note.endSeconds * 1000) - Math.round(from / BEATS_PER_SECOND * 1000))
                / (Math.round(audibleEndSeconds * 1000) - Math.round(from / BEATS_PER_SECOND * 1000)),
              outside_value: 0,
              func: sampledEnvelope(envelope),
            } } : sampledEnvelope(envelope),
          } });
          if (piano && pianoArticulation(note)) {
            // A brief release makes the conservative short note settle cleanly.
            const releaseStart = Math.max(0, 1 - 0.04 / (audibleEndSeconds - note.startSeconds));
            addEffect({ timed_brightness: { mult_factor_decrease: { fixed_window: {
              start: releaseStart, end: 1, outside_value: 1,
              func: { linear: { start: 1, end: 0 } },
            } } } });
          }
        }));
      });
    });
  }
}

const children = async () => {
  const anim = new Animation("children", BPM, DURATION_SECONDS, 0);
  const pianoNotes = [...PIANO_NOTES, ...RISING_PIANO_NOTES, ...CONTINUING_PIANO_NOTES];
  anim.midiNotes = [
    ...pianoNotes.filter(note => !isPianoRest(note)).map(note => ({
      startSeconds: note.startSeconds, endSeconds: pianoNoteEnd(note), pitch: note.pitch,
      buildRole: note.buildRole, instrument: "piano" as const,
      ...(isOutroLowNote(note) ? { accent: "bar-low" as const } : {}),
    })),
    ...GUITAR_NOTES.map(({ startSeconds, endSeconds, pitch }) => ({ startSeconds, endSeconds, pitch, instrument: "guitar" as const })),
    ...SYNTH_NOTES.map(({ startSeconds, endSeconds, pitch }) => ({ startSeconds, endSeconds, pitch, instrument: "synth" as const })),
    ...PAD_NOTES.map(({ startSeconds, endSeconds, pitch }) => ({ startSeconds, endSeconds, pitch, instrument: "pad" as const })),
    ...BASS_BREATHS.map(({ startSeconds, endSeconds, pitch }) => ({ startSeconds, endSeconds, pitch, instrument: "bass" as const })),
  ]
    .sort((a, b) => a.startSeconds - b.startSeconds);
  anim.sections = [
    { name: "Piano · blue 11 / 12", startBeat: 0, endBeat: GUITAR_START_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "+ Guitar · orange pitch shapes", startBeat: GUITAR_START_SECONDS * BEATS_PER_SECOND, endBeat: INTRO_PIANO_REST.startSeconds * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Guitar + bass · piano rest", startBeat: INTRO_PIANO_REST.startSeconds * BEATS_PER_SECOND, endBeat: 28 * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano build + green air wave", startBeat: BUILD_START_SECONDS * BEATS_PER_SECOND, endBeat: AIR_FADE_START_BEAT, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + flicker · green fade", startBeat: AIR_FADE_START_BEAT, endBeat: BASS_ROLLS[0].hits[0].startSeconds * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + flicker + bass roll · green fade", startBeat: BASS_ROLLS[0].hits[0].startSeconds * BEATS_PER_SECOND, endBeat: AIR_END_BEAT, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + flicker + bass roll", startBeat: AIR_END_BEAT, endBeat: DROP_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Drop · all rings fade", startBeat: DROP_SECONDS * BEATS_PER_SECOND, endBeat: DROP_END_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + white beat", startBeat: DROP_END_SECONDS * BEATS_PER_SECOND, endBeat: PIANO_REST.startSeconds * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "White beat · piano rest", startBeat: PIANO_REST.startSeconds * BEATS_PER_SECOND, endBeat: PIANO_REST.endSeconds * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + white beat", startBeat: PIANO_REST.endSeconds * BEATS_PER_SECOND, endBeat: 70.124 * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + synth quads", startBeat: 70.124 * BEATS_PER_SECOND, endBeat: AIR_RETURN_START_BEAT, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + synth quads + green wave", startBeat: AIR_RETURN_START_BEAT, endBeat: 98.16 * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Quiet piano + green wave", startBeat: 98.16 * BEATS_PER_SECOND, endBeat: PIANO_BUILD_STAGES[0].startBeat, fadeInBeats: 0, fadeOutBeats: 0 },
    ...PIANO_BUILD_STAGES.flatMap((stage, index) => {
      const endBeat = Math.min(stage.endBeat, SECOND_BUILD_START_SECONDS * BEATS_PER_SECOND);
      const boundaries = [stage.startBeat, ...(AIR_RETURN_END_BEAT > stage.startBeat && AIR_RETURN_END_BEAT < endBeat ? [AIR_RETURN_END_BEAT] : []), endBeat];
      return boundaries.slice(0, -1).map((startBeat, i) => ({
        name: `Piano build ${index + 1}/4 · ${stage.innerRingCount} inner rings${startBeat < AIR_RETURN_END_BEAT ? " + green fade" : ""}`,
        startBeat, endBeat: boundaries[i + 1], fadeInBeats: 0, fadeOutBeats: 0,
      }));
    }),
    { name: "Piano build 4/4 + flicker", startBeat: SECOND_BUILD_START_SECONDS * BEATS_PER_SECOND, endBeat: SECOND_DROP_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Drop · long inward bloom + melody", startBeat: SECOND_DROP_SECONDS * BEATS_PER_SECOND, endBeat: SECOND_DROP_END_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + white beat", startBeat: SECOND_DROP_END_SECONDS * BEATS_PER_SECOND, endBeat: 147.228 * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Synth quads return", startBeat: 147.228 * BEATS_PER_SECOND, endBeat: THIRD_BUILD_START_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Flicker build", startBeat: THIRD_BUILD_START_SECONDS * BEATS_PER_SECOND, endBeat: MINI_DROP_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Mini drop · outward bloom + melody", startBeat: MINI_DROP_SECONDS * BEATS_PER_SECOND, endBeat: MINI_DROP_END_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano + synth quads", startBeat: MINI_DROP_END_SECONDS * BEATS_PER_SECOND, endBeat: 189.28 * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Piano outro + white beat", startBeat: 189.28 * BEATS_PER_SECOND, endBeat: OUTRO_BARS[0].startBeat, fadeInBeats: 0, fadeOutBeats: 0 },
    ...outroSections(),
    { name: "Final drum roll · wider ripples", startBeat: DRUM_ROLLS[1].hits[0].startSeconds * BEATS_PER_SECOND, endBeat: DRUM_FINALE_RESOLVE_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
    { name: "Final glow · fade to black", startBeat: DRUM_FINALE_RESOLVE_SECONDS * BEATS_PER_SECOND, endBeat: CONTINUATION_END_SECONDS * BEATS_PER_SECOND, fadeInBeats: 0, fadeOutBeats: 0 },
  ];

  anim.sync(() => {
    elements(all, () => beats(0, DURATION_SECONDS * BEATS_PER_SECOND, () => noColor()));
    breathingBeat();
    goldSnareConfetti();
    dropBloom(SECOND_DROP_SECONDS, SECOND_DROP_END_SECONDS, "inward");
    dropBloom(MINI_DROP_SECONDS, MINI_DROP_END_SECONDS, "outward");
    airWaveReturn();
    bassBreaths();
    drumRipples();
    airWave();
    PAD_PASSAGES.forEach((notes, index) => sustainedPad(notes, index === 0 ? DROP_END_SECONDS : SECOND_DROP_END_SECONDS));
    bassRollFlashes();
    instrument(pianoNotes, [11, 12], 0.60, true);
    guitarMelody();
    synthQuads();
    slowerDrumFlashes();
    whiteFlickers();
    // Every pixel flashes together, then fades smoothly to black over the bar.
    elements(all, () => beats(DROP_SECONDS * BEATS_PER_SECOND, DROP_END_SECONDS * BEATS_PER_SECOND, () => {
      constColor({ hue: 0, sat: 0, val: 1 });
      addEffect({ timed_brightness: { mult_factor_decrease: { linear: { start: 1, end: 0 } } } });
    }));
    // Let the final drum bloom settle across the whole recording tail.
    const endFade = Array.from({ length: 17 }, (_, i) => {
      const x = i / 16;
      return 1 - x * x * (3 - 2 * x);
    });
    elements(all, () => beats(DRUM_FINALE_RESOLVE_SECONDS * BEATS_PER_SECOND, DURATION_SECONDS * BEATS_PER_SECOND, () => {
      addEffect({ timed_brightness: { mult_factor_decrease: sampledEnvelope(endFade) } });
    }));
  });

  console.log(`Sending the ${DURATION_SECONDS}-second Children sequence`);
  const sequence = anim.getSequence();
  // Stay dark when the recording ends instead of looping the intro.
  for (const [name, ring] of Object.entries(sequence)) {
    ring.num_repeats = 1;
    ring.effects = compactEffects(ring.effects);
    const depth = Math.max(...ring.effects.map(nestingDepth));
    if (ring.effects.length >= 1000 || depth > 10 || functionCount(ring) > 3500) {
      throw new Error(`${name}: ${ring.effects.length} effects, depth ${depth}; controller limits exceeded`);
    }
    console.log(`${name}: ${ring.effects.length} effects, max nesting ${depth}`);
  }
  await sendSequence("children", sequence);
  if (!process.env.SEND_ONLY) await startSong("children", 0);
};

void children();
