// Options for agent story 1 (a text being read, agent_story1.wav) for the gallery (ui/background-gallery.html?set=
// agent_story1), played side by side with the reading: steady background animations, not following the voice, made
// of 3 layers on different mappings stacked on each other:
//   1. a motion of light (ripples, blooms, spinners, a spiral on updown, a chase, a comet through all, a breath),
//   2. a motion of color over it (hue waves on another mapping, a pale shimmer, dark shadows),
//   3. something on top, always moving (white glitter, the inner and outer small rings counter-spinning, a white
//      small ring travelling round the big ring, 2 of them chasing, one hopping a small ring at a time, the b1 and b2
//      dots trading places) or nothing,
// over a colorful coloring (rainbows round the big ring, inside every ring, along rad, round the small rings, in a
// spiral, by height; vivid trios, halves and pairs) and a still decoration, with a phase pattern across the 12 rings (together, mirror, once round,
// twice round, quartets, or neighbours counter-turning).
// Run it (npx ts-node src/songs/agent_story1-options.ts) to write ui/public/agent_story1-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "../animation/animation";
import { beats } from "../time/time";
import { elements, segment } from "../objects/elements";
import { all } from "../objects/ring-elements";
import { constColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import { DECORATIONS, VAL, cycleAt, glow, height, lap, side, type RingPlace } from "../background-options";

// At 60 BPM a beat is a second.
const NAME = "agent_story1", BPM = 60, LENGTH = 23.59, END = 24;
const OPTION_COUNT = 180;

type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });

// Colorful colorings, at VAL (the layers brighten and darken from there).
const L = (start: number, end: number): Fn => ({ linear: { start, end } });
const hues = (seg: string, spread: number) => segment(seg, () => addEffect({ position_hue: { offset_factor: L(0, spread) } }));
const COLORINGS: { name: string; color: (r: number) => void }[] = [
  { name: "Rainbow round", color: r => constColor({ hue: (r - 1) / 12, sat: 0.95, val: VAL }) },
  { name: "Rainbow in every ring", color: () => { constColor({ hue: 0, sat: 0.95, val: VAL }); hues("ind", 1); } },
  { name: "Rainbow along rad", color: () => { constColor({ hue: 0, sat: 0.95, val: VAL }); hues("rad", 1); } },
  { name: "Rainbow round the small rings", color: () => { constColor({ hue: 0, sat: 0.95, val: VAL }); hues("centric", 1); } },
  { name: "Rainbow spiral", color: () => { constColor({ hue: 0, sat: 0.95, val: VAL }); hues("updown", 1); } },
  { name: "Rainbow by height", color: r => constColor({ hue: 0.8 * height(r), sat: 0.95, val: VAL }) },
  { name: "Red, green and blue", color: r => constColor({ hue: [0.02, 0.33, 0.62][(r - 1) % 3], sat: 1, val: VAL }) },
  { name: "Orange and blue halves", color: r => constColor({ hue: height(r) > 0.5 ? 0.08 : 0.6, sat: 1, val: VAL }) },
  { name: "Magenta and cyan", color: r => constColor({ hue: r % 2 ? 0.85 : 0.5, sat: 0.95, val: VAL }) },
  { name: "Sunset to sea", color: () => { constColor({ hue: 0.03, sat: 1, val: VAL }); hues("rad", 0.6); } },
];

// Phase patterns across the 12 rings: where in a cycle each ring is, and which way it turns.
interface Phasing { name: string; desc: string; place: (r: number) => RingPlace }
const PHASINGS: Phasing[] = [
  { name: "Together", desc: "every ring the same", place: () => ({ phase: 0, dir: 1, group: 0 }) },
  { name: "Mirror", desc: "the halves mirror each other, from the bottom up", place: r => ({ phase: 0.5 * (1 - height(r)), dir: side(r), group: 0 }) },
  { name: "Once round", desc: "each ring a twelfth of a cycle behind the one before", place: r => ({ phase: (r - 1) / 12, dir: 1, group: 0 }) },
  { name: "Twice round", desc: "round the big ring twice, a sixth of a cycle a ring", place: r => ({ phase: (r - 1) / 6, dir: 1, group: 0 }) },
  { name: "Quartets", desc: "4 groups a quarter of a cycle apart", place: r => ({ phase: ((r - 1) % 4) / 4, dir: 1, group: 0 }) },
  { name: "Counter-turning", desc: "neighbours turning opposite ways, half a cycle apart",
    place: r => ({ phase: (r % 2) * 0.5, dir: r % 2 ? 1 : -1, group: (r % 2) as 0 | 1 }) },
];

/** n snakes evenly round a mapping, a lap every `seconds`, lifting the light by up to `peak`. */
const lights = (seg: string, seconds: number, tail: number, peak: number, p: RingPlace, n = 1) => segment(seg, () => cycleAt(seconds, () => {
  for (let k = 0; k < n; k++) addEffect({
    snake_brightness: { head: lap(p.phase + k / n, p.dir), tail_length: K(tail), cyclic: true, mult_factor_increase: glow(peak) },
  });
}));

// Layer 1: a motion of light, with its mapping.
interface Layer { name: string; mapping: string; make: (p: RingPlace, ring: number) => void }
const LIGHTS: Layer[] = [
  { name: "ripples", mapping: "rad", make: p => lights("rad", 4, 0.5, 0.65, p) },
  { name: "double ripples", mapping: "rad", make: p => lights("rad", 5, 0.3, 0.65, p, 2) },
  { name: "blooms", mapping: "arc", make: p => lights("arc", 4, 0.45, 0.65, p) },
  { name: "2 spinners", mapping: "centric", make: p => lights("centric", 4, 0.25, 0.7, p, 2) },
  { name: "3 spinners", mapping: "centric", make: p => lights("centric", 6, 0.15, 0.7, p, 3) },
  { name: "spiral", mapping: "updown", make: p => lights("updown", 4, 0.35, 0.65, p, 2) },
  { name: "chase", mapping: "ind", make: p => lights("ind", 5, 0.35, 0.7, p) },
  { name: "comet spiral", mapping: "all", make: p => lights("all", 6, 0.2, 0.8, p, 2) },
  { name: "breath", mapping: "whole ring", make: p => cycleAt(5, () => addEffect({ timed_brightness: { mult_factor_increase: sin(0, 0.55, -0.25 - p.phase) } })) },
];

// Layer 2: a motion of color, with its mapping.
const hueWave = (seg: string, seconds: number, tail: number, amount: number) => (p: RingPlace) => segment(seg, () => cycleAt(seconds, () =>
  addEffect({ snake_hue: { head: lap(p.phase + 0.5, -p.dir), tail_length: K(tail), cyclic: true, offset_factor: sin(0, amount, -0.25) } })));
const COLORS: Layer[] = [
  { name: "hue waves round the small rings", mapping: "centric", make: hueWave("centric", 5, 0.5, 0.14) },
  { name: "hue spiral", mapping: "updown", make: hueWave("updown", 6, 0.5, 0.16) },
  { name: "hue comet", mapping: "all", make: hueWave("all", 10, 0.3, 0.18) },
  { name: "hue rings", mapping: "rad", make: hueWave("rad", 5, 0.5, 0.12) },
  { name: "pale shimmer", mapping: "rand", make: p => segment("rand", () => cycleAt(5, () => addEffect({
    snake_saturation: { head: lap(p.phase, p.dir), tail_length: K(0.25), cyclic: true, mult_factor_decrease: sin(0.4, 1, 0.25) },
  }))) },
  { name: "dark shadows", mapping: "ind", make: p => segment("ind", () => cycleAt(6, () => addEffect({
    snake_brightness: { head: lap(p.phase + 0.5, -p.dir), tail_length: K(0.3), cyclic: true, mult_factor_decrease: sin(0.35, 1, 0.25) },
  }))) },
];

// Layer 3: on top. The inner and the outer side of a big ring each fall between two small rings: the right half
// takes one and the left half the other, so the halves mirror.
const spin = (seg: string, dir: number, phase: number) => segment(seg, () => {
  constColor({ hue: 0.12, sat: 0.5, val: 0.1 });
  cycleAt(4, () => addEffect({ snake_brightness: { head: lap(phase, dir), tail_length: K(0.4), cyclic: true, mult_factor_increase: glow(0.95) } }));
});
const TOPS: Layer[] = [
  { name: "", mapping: "", make: () => {} },
  { name: "white glitter", mapping: "rand", make: p => segment("rand", () => [2.5, 4].forEach((s, k) => cycleAt(s, () => {
    const head = lap(p.phase + k / 2, k ? -p.dir : p.dir), tail_length = K(0.04);
    addEffect({ snake_saturation: { head, tail_length, cyclic: true, mult_factor_decrease: sin(0.05, 1, 0.25) } });
    addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_increase: glow(0.9) } });
  }))) },
  { name: "small rings counter-spinning", mapping: "small rings", make: (p, ring) => {
    spin(side(ring) > 0 ? "3" : "2", p.dir, p.phase);
    spin(side(ring) > 0 ? "8" : "9", -p.dir, p.phase);
  } },
  { name: "dots trading places", mapping: "b1 and b2", make: p => {
    segment("b1", () => cycleAt(2, () => addEffect({ timed_brightness: { mult_factor_decrease: sin(0.4, 1, 0.25 - p.phase) } })));
    segment("b2", () => cycleAt(2, () => addEffect({ timed_brightness: { mult_factor_decrease: sin(0.4, 1, -0.25 - p.phase) } })));
  } },
  { name: "a white small ring travelling", mapping: "ind", make: p => whiteRings(p, 1, 4) },
  { name: "2 white small rings chasing", mapping: "ind", make: p => whiteRings(p, 2, 6) },
  { name: "a white small ring hopping", mapping: "ind", make: p => segment("ind", () => cycleAt(6, () => {
    // A small ring a step, 12 steps a lap, the head in the middle of the small ring it is on.
    const at = Math.round(12 * (p.phase % 1));
    [0, p.dir > 0 ? -12 : 12].forEach(wrap => white({ steps: { num_steps: 12, diff_per_step: p.dir / 11, first_step_value: (at + wrap + 0.5) / 11 } }));
  })) },
];

// On ind small ring k is at k / 11, from 0 to 1, so the first and the last meet when it wraps round: the white small
// rings do not wrap (cyclic), they move over 0 to 12 / 11 (a small ring a twelfth of the way), with a second snake 12
// small rings behind for the part of the lap past the end. A snake a small ring long (1 / 11) always covers one.
const SMALL_RING = 1 / 11;
/** A white small ring: on ind, the pixels under the snake at full and white. */
const white = (head: Fn) => {
  addEffect({ snake_saturation: { head, tail_length: K(SMALL_RING), cyclic: false, mult_factor_decrease: K(0.08) } });
  addEffect({ snake_brightness: { head, tail_length: K(SMALL_RING), cyclic: false, mult_factor_increase: K(0.95) } });
};
/** n white small rings evenly round the big ring, gliding round it once every `seconds`. */
const whiteRings = (p: RingPlace, n: number, seconds: number) => segment("ind", () => cycleAt(seconds, () => {
  for (let k = 0; k < n; k++) {
    const at = 12 * ((p.phase + k / n) % 1), lapEnd = at + 12 * p.dir;
    [0, -12 * p.dir].forEach(wrap => white(L((at + wrap) / 11, (lapEnd + wrap) / 11)));
  }
}));

export const OPTIONS = Array.from({ length: OPTION_COUNT }, (_, i) => {
  const phasing = Math.floor((i * PHASINGS.length) / OPTION_COUNT), j = i % 30;
  const light = (i * 4 + phasing) % LIGHTS.length;
  let color = (i * 5 + Math.floor(i / 9)) % COLORS.length;
  if (COLORS[color].mapping === LIGHTS[light].mapping) color = (color + 1) % COLORS.length;
  const top = [1, 2, 3, 0, 4, 5, 6, 1, 3, 0, 4][(i * 2 + phasing) % 11];
  const coloring = (i * 7 + phasing) % COLORINGS.length, decoration = [0, 1, 4, 7, 6, 0, 5][(j + phasing) % 7];
  const [l, c, t, ph] = [LIGHTS[light], COLORS[color], TOPS[top], PHASINGS[phasing]];
  return {
    name: `${l.name} + ${c.name}${t.name ? ` + ${t.name}` : ""}`,
    category: ph.name,
    tags: [...new Set([l.mapping, c.mapping, t.mapping].filter(Boolean))],
    desc: `${l.name} (${l.mapping}), ${c.name} (${c.mapping})${t.name ? `, ${t.name} on top` : ""}; ${COLORINGS[coloring].name.toLowerCase()}, ${DECORATIONS[decoration].name}; ${ph.desc}.`,
    phasing, light, color, top, coloring, decoration,
  };
});

/** Option i over the whole reading (`end` seconds long). */
export const optionEffects = (i: number, end = END) => {
  const o = OPTIONS[i];
  all.forEach(ring => elements([ring], () => beats(0, end, () => {
    const p = PHASINGS[o.phasing].place(ring);
    COLORINGS[o.coloring].color(ring);
    DECORATIONS[o.decoration].deco(p);
    LIGHTS[o.light].make(p, ring);
    COLORS[o.color].make(p, ring);
    TOPS[o.top].make(p, ring);
  })));
};

export const optionSequence = (i: number) => {
  const anim = new Animation(NAME, BPM, LENGTH, 0);
  anim.sync(() => optionEffects(i));
  return anim.getSequence();
};

if (require.main === module) {
  const out = path.join(__dirname, "..", "..", "ui", "public", `${NAME}-options.json`);
  const options = OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: optionSequence(i) }));
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LENGTH, audio: `${NAME}.wav`, options }));
  const mixes = new Set(OPTIONS.map(o => [o.phasing, o.light, o.color, o.top, o.coloring, o.decoration].join()));
  console.log(`Saved ${out}: ${options.length} options (${mixes.size} different mixes)`);
}
