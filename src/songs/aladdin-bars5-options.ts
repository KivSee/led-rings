// Alternatives for Aladdin's bars 5-8 (beats 16-32), for the gallery (ui/background-gallery.html?set=aladdin_bars5),
// which plays that part of the song, looping, with every option side by side. The first card is the song as it is
// now. The music there is 2 parts with a quiet stop between them: part 1 (beats 16-22), 2 beats of stop (22-24) and
// part 2 (24-30). Each option splits the rings between the parts (a reveal: the part's rings come in over its 6
// beats), colors them (one color for each part, from Aladdin's colors), moves them on the beat, and goes quiet in the
// stop (black, holding dim and still, or fading out).
// Run it (npx ts-node src/songs/aladdin-bars5-options.ts) to write ui/public/aladdin_bars5-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "../animation/animation";
import { beats, cycle } from "../time/time";
import { elements, segment } from "../objects/elements";
import { all } from "../objects/ring-elements";
import { constColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import { height, lap, side } from "../background-options";

const SET = "aladdin_bars5";
// As in aladdin.ts.
const BPM = 64.725, LENGTH = 76, OFFSET_MS = 575;
export const FROM = 16, TO = 32;
// The 2 parts and the stop between them.
export const PART1 = 16, STOP = 22, PART2 = 24, PART2_END = 30;

type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const L = (start: number, end: number): Fn => ({ linear: { start, end } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });

// The 6 mirror pairs, top to bottom.
const PAIRS = [[12, 11], [1, 10], [2, 9], [3, 8], [4, 7], [5, 6]];
const pairOf = (r: number) => PAIRS.findIndex(p => p.includes(r));

// Reveals: which rings each part lights and when (beats into the part) each comes in; a ring can be in both parts.
// Ring 12 is the first ring, at the top: what starts at the top starts with it.
export interface Reveal { name: string; desc: string; parts: (r: number) => [part: number, at: number][]; fadeIn: number }
const order = (rings: number[], r: number, step = 1) => rings.indexOf(r) * step;
export const REVEALS: Reveal[] = [
  { name: "Halves", desc: "clockwise from the top, a ring a beat: 12, 1-5 in part 1, 6-11 in part 2",
    parts: r => [side(r) > 0 ? [0, order([12, 1, 2, 3, 4, 5], r)] : [1, order([6, 7, 8, 9, 10, 11], r)]], fadeIn: 0 },
  { name: "Mirrored halves", desc: "the right half from the top in part 1, the left half from the top in part 2",
    parts: r => [side(r) > 0 ? [0, order([12, 1, 2, 3, 4, 5], r)] : [1, order([11, 10, 9, 8, 7, 6], r)]], fadeIn: 0.5 },
  { name: "Top then bottom", desc: "the top half in part 1, the bottom half in part 2, out from the middle",
    parts: r => [height(r) > 0.5 ? [0, order([12, 11, 1, 10, 2, 9], r)] : [1, order([5, 6, 4, 7, 3, 8], r)]], fadeIn: 0.5 },
  { name: "Every other", desc: "every other ring clockwise from the top (12, 2, 4, …) in part 1, the ones between (1, 3, 5, …) in part 2",
    parts: r => [r % 2 ? [1, order([1, 3, 5, 7, 9, 11], r)] : [0, order([12, 2, 4, 6, 8, 10], r)]], fadeIn: 0.5 },
  { name: "Pairs down then up", desc: "all 12 in each part: the mirror pairs from the top down in part 1, from the bottom up in part 2",
    parts: r => [[0, pairOf(r)], [1, 5 - pairOf(r)]], fadeIn: 0.5 },
  { name: "All swelling", desc: "every ring swelling in at the start of each part", parts: () => [[0, 0], [1, 0]], fadeIn: 2 },
];

// The most a hue shimmer or wave may move a color, always toward yellow: from red earth (0.01) to sand (0.12) it
// stays within red, orange and yellow.
const DESERT_SHIFT = 0.04;

// Color pairs: part 1's and part 2's.
export interface Hue { hue: number; sat: number }
// Desert colors only (no pink or purple): sand, gold, amber, orange, terracotta and red earth, the 2 parts a little
// apart, so a pattern blending one into the other passes only through warm desert colors.
const PAIR_COLORS: { name: string; parts: [Hue, Hue] }[] = [
  { name: "terracotta then gold", parts: [{ hue: 0.03, sat: 1 }, { hue: 0.11, sat: 1 }] },
  { name: "amber then sand", parts: [{ hue: 0.08, sat: 1 }, { hue: 0.12, sat: 0.65 }] },
  { name: "gold then orange", parts: [{ hue: 0.12, sat: 1 }, { hue: 0.06, sat: 1 }] },
  { name: "burnt orange then sand", parts: [{ hue: 0.05, sat: 1 }, { hue: 0.11, sat: 0.6 }] },
  { name: "sand then terracotta", parts: [{ hue: 0.11, sat: 0.6 }, { hue: 0.03, sat: 1 }] },
  { name: "red earth then gold", parts: [{ hue: 0.01, sat: 1 }, { hue: 0.1, sat: 1 }] },
];

// Color patterns: a part's color with a second one (the other part's, or gold when both parts share a color), in a
// shape on a mapping. The hue goes the shorter way round from one to the other.
const GOLD: Hue = { hue: 0.11, sat: 1 };
const toward = (c: Hue, d: Hue) => ((((d.hue - c.hue) % 1) + 1.5) % 1) - 0.5;
const hueShape = (seg: string, f: Fn) => segment(seg, () => addEffect({ position_hue: { offset_factor: f } }));
const half = (f1: Fn, f2: Fn): Fn => ({ half: { f1, f2 } });
// Each paints with a phase `ph` (0-1), turning the shape round its mapping, so rings can show it shifted.
const PATTERNS: { name: string; paint: (c: Hue, d: Hue, ph: number) => void }[] = [
  { name: "glowing out to the second color", paint: (c, d, ph) => { constColor({ ...c, val: 1 }); hueShape("rad", sin(0, toward(c, d), -0.25 + ph, 0.5)); } },
  { name: "dots of the second color", paint: (c, d, ph) => {
    constColor({ ...c, val: 1 });
    // b1 and b2 have no positions to turn: the phase picks which dots get the second color.
    segment(ph % 1 < 0.5 ? "b1" : "b2", () => constColor({ ...d, val: 1 }));
  } },
  { name: "every other small ring", paint: (c, d, ph) => { constColor({ ...c, val: 1 }); hueShape("ind", sin(0, toward(c, d), 0.25 + ph, 5.5)); } },
  { name: "half of every small ring", paint: (c, d, ph) => { constColor({ ...c, val: 1 }); hueShape("centric", sin(0, toward(c, d), ph, 1)); } },
  // Only toward yellow (up to +DESERT_SHIFT), so no color tips over red into pink.
  { name: "spiral shimmer", paint: (c, _d, ph) => { constColor({ ...c, val: 1 }); hueShape("updown", sin(0, DESERT_SHIFT, ph, 2)); } },
  { name: "mottled", paint: (c, d, ph) => {
    constColor({ ...c, val: 1 });
    hueShape("rand", sin(0, toward(c, d) * 0.5, ph, 5));
    segment("rand", () => addEffect({ position_brightness: { mult_factor_decrease: sin(0.5, 1, ph, 7) } }));
  } },
  { name: "rings along rad", paint: (c, d, ph) => { constColor({ ...c, val: 1 }); hueShape("rad", sin(0, toward(c, d), 0.25 + ph, 2)); } },
];

// The coloring's phase across the rings, ring 12 first (at the top): how far each ring's pattern is turned.
const PHASES: { name: string; of: (r: number) => number }[] = [
  { name: "no phase", of: () => 0 },
  { name: "phase once round", of: r => (r % 12) / 12 },
  { name: "mirrored phase", of: r => 0.5 * (1 - height(r)) },
  { name: "every other ring opposite", of: r => (r % 2 ? 0.5 : 0) },
  { name: "phase in quartets", of: r => ((r % 12) % 4) / 4 },
];

// The stop: what the rings lit in part 1 do in the 2 beats of the stop.
// `paint` paints part 1's coloring (its color, pattern and phase), which the stop keeps, dimmed or fading.
const STOPS: { name: string; stop: (paint: () => void) => void }[] = [
  { name: "black", stop: () => {} },
  { name: "holding dim", stop: paint => { paint(); addEffect({ timed_brightness: { mult_factor_decrease: K(0.18) } }); } },
  { name: "fading out", stop: paint => { paint(); addEffect({ timed_brightness: { mult_factor_decrease: L(0.6, 0) } }); } },
];

// Motions on the beat (cycles in beats): dimming or lifting over the coloring.
interface Motion { name: string; move: (r: number) => void }
const dim = (seg: string, beatsPerLap: number, tail: number, r: number, n = 1) => segment(seg, () => cycle(beatsPerLap, () => {
  for (let k = 0; k < n; k++) addEffect({
    snake_brightness: { head: lap(k / n + pairOf(r) / 12, side(r)), tail_length: K(tail), cyclic: true, mult_factor_decrease: sin(0.25, 1, 0.25) },
  });
}));
const MOTIONS: Motion[] = [
  { name: "still", move: () => {} },
  { name: "ripples on every beat", move: () => segment("rad", () => cycle(1, () => addEffect({
    snake_brightness: { head: L(0, 1.4), tail_length: K(0.4), cyclic: false, mult_factor_decrease: sin(0.3, 1, 0.25) },
  }))) },
  { name: "spinners", move: r => dim("centric", 2, 0.35, r, 2) },
  { name: "comet spiral", move: r => dim("all", 4, 0.5, r) },
  { name: "pulse on the beat", move: () => cycle(1, () => addEffect({ timed_brightness: { mult_factor_decrease: L(0.45, 1) } })) },
  { name: "sparkles", move: () => segment("rand", () => cycle(4, () => addEffect({
    snake_brightness: { head: lap(0, 1), tail_length: K(0.3), cyclic: true, mult_factor_decrease: sin(0.2, 1, 0.25, 6) },
  }))) },
  { name: "hue wave", move: r => segment("centric", () => cycle(2, () => addEffect({
    snake_hue: { head: lap(pairOf(r) / 12, side(r)), tail_length: K(0.5), cyclic: true, offset_factor: sin(0, DESERT_SHIFT, -0.25) },
  }))) },
];

export const OPTIONS = REVEALS.flatMap((rv, ri) => Array.from({ length: 18 }, (_, j) => {
  const colors = j % PAIR_COLORS.length, stop = Math.floor(j / PAIR_COLORS.length) % STOPS.length;
  const motion = (3 * j + ri) % MOTIONS.length, pattern = (5 * j + 2 * ri) % PATTERNS.length;
  const phase = (j + 3 * ri + Math.floor(j / 5)) % PHASES.length;
  // Part 2 keeps the pattern (the same mapping and shape) and varies it: its own color, and a different phase.
  const pattern2 = pattern, phase2 = (phase + 1 + (j % 3)) % PHASES.length;
  return {
    name: `${rv.name}: ${PAIR_COLORS[colors].name}, ${PATTERNS[pattern].name} (${PHASES[phase].name} then ${PHASES[phase2].name}), ${MOTIONS[motion].name}, stop ${STOPS[stop].name}`,
    category: rv.name,
    tags: [`stop ${STOPS[stop].name}`, PHASES[phase].name],
    desc: `${rv.desc}; ${PAIR_COLORS[colors].name}; ${PATTERNS[pattern].name}, ${PHASES[phase].name} in part 1 and ${PHASES[phase2].name} in part 2; ${MOTIONS[motion].name}; in the stop the rings go ${STOPS[stop].name === "black" ? "black" : STOPS[stop].name}.`,
    reveal: ri, colors, stop, motion, patterns: [pattern, pattern2], phases: [phase, phase2],
  };
}));

/** Option i: each part's rings dark until they come in, then lit in the part's color, moving; the stop between. */
/** Option i, in its own color pair or in `colors` (part 1's and part 2's) instead. */
export const optionEffects = (i: number, colors?: [Hue, Hue]) => {
  const o = OPTIONS[i], rv = REVEALS[o.reveal], pair = colors ?? PAIR_COLORS[o.colors].parts;
  all.forEach(ring => elements([ring], () => rv.parts(ring).forEach(([part, at]) => {
    const [start, end] = part === 0 ? [PART1, STOP] : [PART2, PART2_END], from = start + at;
    const [c, other] = [pair[part], pair[1 - part]];
    const second = Math.abs(toward(c, other)) < 0.02 ? GOLD : other;
    const paint = () => PATTERNS[o.patterns[part]].paint(c, second, PHASES[o.phases[part]].of(ring));
    beats(from, end, () => {
      paint();
      MOTIONS[o.motion].move(ring);
    });
    if (rv.fadeIn) beats(from, Math.min(end, from + rv.fadeIn), () => addEffect({ timed_brightness: { mult_factor_decrease: L(0, 1) } }));
    if (part === 0) beats(STOP, PART2, () => STOPS[o.stop].stop(paint));
  })));
};

const sequenceOf = (cb: () => void) => {
  const anim = new Animation("aladdin", BPM, LENGTH, OFFSET_MS);
  anim.sync(cb);
  return anim.getSequence();
};

if (require.main === module) {
  // The part's time in the song, for the gallery to loop the audio over.
  const toSec = (beat: number) => OFFSET_MS / 1000 + (beat * 60) / BPM;
  const now = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "ui", "public", "aladdin.sequence.json"), "utf8")).sequence;
  const options = [
    { name: "As it is now", category: "As it is now", tags: [], desc: "the song as it is now (ui/public/aladdin.sequence.json)", sequence: now },
    ...OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: sequenceOf(() => optionEffects(i)) })),
  ];
  const out = path.join(__dirname, "..", "..", "ui", "public", `${SET}-options.json`);
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LENGTH, audio: "aladdin.wav", from: toSec(FROM), to: toSec(TO), options }));
  console.log(`Saved ${out}: ${options.length} options, playing ${toSec(FROM).toFixed(2)}-${toSec(TO).toFixed(2)} s`);
}
