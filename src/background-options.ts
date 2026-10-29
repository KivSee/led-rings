// Background options for the background gallery (ui/background-gallery.html): OPTION_COUNT calm, looping
// animations, each a mix of a layout (how the 12 rings are grouped and timed), a coloring, a decoration (a static
// pattern over the coloring) and a movement (snakes on a mapping, or a breath).
// Run it (npx ts-node src/background-options.ts) to write ui/public/background-options.json, which the gallery plays.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "./animation/animation";
import { beats, cycle } from "./time/time";
import { elements, segment } from "./objects/elements";
import { all } from "./objects/ring-elements";
import { constColor } from "./effects/coloring";
import { addEffect } from "./effects/effect";

// At 60 BPM a beat is a second. Every option loops over LOOP seconds; all its cycles divide LOOP, so it loops without
// a seam.
const BPM = 60;
export const LOOP = 20;
const OPTION_COUNT = 100;

type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const L = (start: number, end: number): Fn => ({ linear: { start, end } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });

/** Ring r's height in the big ring: 1 at the top (between 11 and 12), 0 at the bottom (between 5 and 6). */
export const height = (r: number) => (Math.cos(((r + 0.5) * Math.PI) / 6) + 1) / 2;
/** 1 on the right side of the big ring (rings 12-5), -1 on the left (6-11). */
export const side = (r: number) => (Math.sin(((r + 0.5) * Math.PI) / 6) > 0 ? 1 : -1);

/** What a layout gives each ring: where in a cycle it is (0-1), which way it turns, and its group (0 or 1). */
export interface RingPlace { phase: number; dir: 1 | -1; group: 0 | 1 }
interface Layout { name: string; desc: string; place: (r: number) => RingPlace }
export const LAYOUTS: Layout[] = [
  { name: "Together", desc: "every ring the same, at the same time", place: () => ({ phase: 0, dir: 1, group: 0 }) },
  { name: "Mirror", desc: "the left and right halves mirror each other, timed from the bottom up",
    place: r => ({ phase: 0.5 * (1 - height(r)), dir: side(r), group: 0 }) },
  { name: "Alternate", desc: "odd and even rings half a cycle apart, turning opposite ways",
    place: r => ({ phase: (r % 2) * 0.5, dir: r % 2 ? 1 : -1, group: (r % 2) as 0 | 1 }) },
  { name: "Quartets", desc: "4 groups (1, 5, 9 / 2, 6, 10 / …) a quarter of a cycle apart",
    place: r => ({ phase: ((r - 1) % 4) / 4, dir: 1, group: ((r - 1) % 2) as 0 | 1 }) },
  { name: "Top and bottom", desc: "the top half and the bottom half half a cycle apart, turning opposite ways",
    place: r => (height(r) > 0.5 ? { phase: 0, dir: 1, group: 0 } : { phase: 0.5, dir: -1, group: 1 }) },
  { name: "Round", desc: "each ring a twelfth of a cycle behind the one before, so it goes round the big ring",
    place: r => ({ phase: (r - 1) / 12, dir: 1, group: ((r - 1) % 2) as 0 | 1 }) },
];

// The colorings, at VAL (the movements and decorations brighten and darken from there).
export const VAL = 0.45;
interface Coloring { name: string; color: (r: number, p: RingPlace) => void }
const plain = (hue: number, sat: number, val = VAL) => constColor({ hue, sat, val });
export const COLORINGS: Coloring[] = [
  { name: "Blue to violet", color: r => plain(0.76 + height(r) * (0.62 - 0.76), 0.85) },
  { name: "Teal to blue", color: r => plain(0.62 + height(r) * (0.5 - 0.62), 0.85) },
  { name: "Indigo to sea", color: r => plain(0.56 + height(r) * (0.7 - 0.56), 0.9) },
  { name: "Sunset", color: r => plain(height(r) * 0.11, 1) },
  { name: "Forest", color: r => plain(0.38 + height(r) * 0.1, 0.85) },
  { name: "Rainbow round", color: r => plain((r - 1) / 12, 0.85) },
  { name: "Two tones", color: (_r, p) => plain(p.group ? 0.75 : 0.58, 0.85) },
  { name: "Rainbow in every ring", color: () => { plain(0.6, 0.75); segment("ind", () => addEffect({ position_hue: { offset_factor: L(0, 1) } })); } },
  { name: "Lavender", color: () => plain(0.74, 0.5) },
  { name: "Deep sea", color: () => { plain(0.5, 0.9); segment("rad", () => addEffect({ position_hue: { offset_factor: L(0, 0.16) } })); } },
];

// The decorations: brightness times a static shape on a mapping, DECO_LOW at its darkest.
const DECO_LOW = 0.35;
interface Decoration { name: string; deco: (p: RingPlace) => void }
const mask = (seg: string, f: Fn) => segment(seg, () => addEffect({ position_brightness: { mult_factor_decrease: f } }));
export const DECORATIONS: Decoration[] = [
  { name: "plain", deco: () => {} },
  { name: "inner glow", deco: () => mask("rad", L(1, DECO_LOW)) },
  { name: "dots", deco: () => mask("b2", K(DECO_LOW)) },
  { name: "gear teeth", deco: p => mask("ind", sin(DECO_LOW, 1, p.dir > 0 ? 0.25 : -0.25, 5.5)) },
  { name: "half moons", deco: () => mask("arc", L(1, DECO_LOW)) },
  { name: "3 spots a ring", deco: () => mask("centric", sin(DECO_LOW, 1, 0.25, 3)) },
  { name: "mottled", deco: () => mask("rand", sin(DECO_LOW, 1, 0, 7)) },
  { name: "rings along rad", deco: () => mask("rad", sin(DECO_LOW, 1, 0.25, 2)) },
];

// How fast the movements run (1 as in the gallery); a trigger can run them faster with withSpeed().
let speed = 1;
/** Run `cb` with every movement's cycles `factor` times faster. */
export const withSpeed = (factor: number, cb: () => void) => { const before = speed; speed = factor; try { cb(); } finally { speed = before; } };
/** A cycle of `seconds` at the current speed. */
export const cycleAt = (seconds: number, cb: Function) => cycle(seconds / speed, cb);

// The movements: snakes going round a mapping (cyclic, so they never stop), or a breath; each over its own cycle.
interface Movement { name: string; move: (p: RingPlace) => void }
export const glow = (peak: number) => sin(0, peak, -0.25); // rising and falling smoothly along the snake
/** A lap from `phase`, the way `dir` turns, kept within 0-2. */
export const lap = (phase: number, dir: number) => (dir > 0 ? L(phase, phase + 1) : L(phase + 1, phase));
const snake = (seg: string, seconds: number, tail: number, peak: number, p: RingPlace, count = 1, reverse = false) =>
  segment(seg, () => cycleAt(seconds, () => {
    for (let k = 0; k < count; k++) addEffect({
      snake_brightness: { head: lap(p.phase + k / count, reverse ? -p.dir : p.dir), tail_length: K(tail), cyclic: true, mult_factor_increase: glow(peak) },
    });
  }));
export const MOVEMENTS: Movement[] = [
  { name: "ripples out", move: p => snake("rad", 4, 0.5, 0.6, p) },
  { name: "ripples in", move: p => snake("rad", 4, 0.5, 0.6, p, 1, true) },
  { name: "2 spinners", move: p => snake("centric", 4, 0.3, 0.7, p, 2) },
  { name: "blooms", move: p => snake("arc", 5, 0.5, 0.6, p) },
  { name: "chase round the ring", move: p => snake("ind", 5, 0.4, 0.7, p) },
  { name: "twinkles", move: p => snake("rand", 5, 0.06, 0.8, p, 2) },
  { name: "comet", move: p => snake("all", 10, 0.15, 0.8, p) },
  { name: "drifting shadows", move: p => segment("rand", () => cycleAt(10, () => addEffect({
    snake_brightness: { head: lap(p.phase, p.dir), tail_length: K(0.4), cyclic: true, mult_factor_decrease: sin(0.3, 1, 0.25) },
  }))) },
  { name: "breath", move: p => cycleAt(5, () => addEffect({ timed_brightness: { mult_factor_increase: sin(0, 0.6, -0.25 - p.phase) } })) },
  { name: "color waves", move: p => segment("centric", () => cycleAt(4, () => addEffect({
    snake_hue: { head: lap(p.phase, p.dir), tail_length: K(0.5), cyclic: true, offset_factor: sin(0, 0.12, -0.25) },
  }))) },
];

export interface BackgroundOption { name: string; category: string; desc: string; parts: [number, number, number, number] }
/** The options: each a layout, a coloring, a decoration and a movement, spread so neighbours differ and no two
 *  options share a coloring and a movement (option a + 10 b: coloring a, movement b + 3a). */
export const OPTIONS: BackgroundOption[] = Array.from({ length: OPTION_COUNT }, (_, i) => {
  const a = i % 10, b = Math.floor(i / 10);
  const layout = Math.floor((i * LAYOUTS.length) / OPTION_COUNT);
  const coloring = a % COLORINGS.length;
  const decoration = (i * 3 + b) % DECORATIONS.length;
  const movement = (b + 3 * a) % MOVEMENTS.length;
  const [l, c, d, m] = [LAYOUTS[layout], COLORINGS[coloring], DECORATIONS[decoration], MOVEMENTS[movement]];
  return {
    name: d.name === "plain" ? `${c.name}, ${m.name}` : `${c.name}, ${d.name}, ${m.name}`,
    category: l.name,
    desc: `${c.name} coloring, ${d.name}, ${m.name}; ${l.desc}.`,
    parts: [layout, coloring, decoration, movement],
  };
});

/** Option i's effects, from `from` to `to` seconds (a whole number of loops long). */
export const optionEffects = (i: number, from = 0, to = LOOP) => {
  const [layout, coloring, decoration, movement] = OPTIONS[i].parts;
  all.forEach(ring => elements([ring], () => beats(from, to, () => {
    const p = LAYOUTS[layout].place(ring);
    COLORINGS[coloring].color(ring, p);
    DECORATIONS[decoration].deco(p);
    MOVEMENTS[movement].move(p);
  })));
};

/** Option i on its own, as the sequence a trigger would send. */
export const optionSequence = (i: number) => {
  const anim = new Animation(`background-option-${i}`, BPM, LOOP);
  anim.sync(() => optionEffects(i));
  return anim.getSequence();
};

if (require.main === module) {
  const out = path.join(__dirname, "..", "ui", "public", "background-options.json");
  const options = OPTIONS.map((o, i) => ({ name: o.name, category: o.category, desc: o.desc, sequence: optionSequence(i) }));
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LOOP, options }));
  const names = new Set(OPTIONS.map(o => o.parts.join()));
  console.log(`Saved ${out}: ${options.length} options (${names.size} different mixes)`);
}
