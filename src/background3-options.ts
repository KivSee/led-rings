// Background 3 options for the background gallery (ui/background-gallery.html?set=3): OPTION_COUNT looping
// compositions of confetti and sparkles, in layers:
//   - a field: a calm colored ground in the main color of a matching color pair (plain, glowing from the inner side,
//     mottled, or with dots in the accent color),
//   - confetti on rand: white glitter, flecks of the accent color, colorful twinkles, dark flecks or popping dots,
//   - a mover on a second mapping: a soft band of light (ripples along rad, spinners round every small ring, blooms,
//     a chase round the big ring, a comet), or none,
//   - sometimes one small ring of every big ring moving on top (the inner, the outer or the side ones).
// The rings are split into groups (odd and even, top and bottom, … from the second set, or all the same), related in
// one of 3 ways: swapped (the groups trade the main and the accent color), split (each group its own confetti and
// mover) or echo (the same, half a cycle apart). Timed per ring by a layout from the first set.
// Run it (npx ts-node src/background3-options.ts) to write ui/public/background3-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "./animation/animation";
import { beats } from "./time/time";
import { elements, segment } from "./objects/elements";
import { all } from "./objects/ring-elements";
import { constColor } from "./effects/coloring";
import { addEffect } from "./effects/effect";
import { LAYOUTS, LOOP, cycleAt, glow, lap, side, withSpeed, type RingPlace } from "./background-options";
import { GROUPINGS as RING_GROUPINGS, type Grouping } from "./background2-options";

const BPM = 60;
const OPTION_COUNT = 200;
type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const L = (start: number, end: number): Fn => ({ linear: { start, end } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });
const repeatFn = (numberOfTimes: number, funcToRepeat: Fn): Fn => ({ repeat: { numberOfTimes, funcToRepeat } });

// The groupings: every ring the same, then the second set's.
const GROUPINGS: Grouping[] = [{ name: "All the same", desc: "every ring the same", group: () => 0, groups: 1 }, ...RING_GROUPINGS];

// Color pairs: the field's main color and its accent.
interface Hue { hue: number; sat: number }
interface Pair { name: string; main: Hue; accent: Hue }
const PAIRS: Pair[] = [
  { name: "ocean and gold", main: { hue: 0.55, sat: 0.9 }, accent: { hue: 0.11, sat: 0.75 } },
  { name: "violet and teal", main: { hue: 0.75, sat: 0.85 }, accent: { hue: 0.48, sat: 0.85 } },
  { name: "sunset and sky", main: { hue: 0.03, sat: 1 }, accent: { hue: 0.58, sat: 0.7 } },
  { name: "forest and gold", main: { hue: 0.36, sat: 0.9 }, accent: { hue: 0.12, sat: 0.8 } },
  { name: "indigo and white", main: { hue: 0.68, sat: 0.9 }, accent: { hue: 0.68, sat: 0 } },
  { name: "fire and gold", main: { hue: 0.0, sat: 1 }, accent: { hue: 0.1, sat: 0.9 } },
  { name: "teal and coral", main: { hue: 0.5, sat: 0.9 }, accent: { hue: 0.03, sat: 0.75 } },
  { name: "blue and lime", main: { hue: 0.62, sat: 0.9 }, accent: { hue: 0.25, sat: 0.9 } },
  { name: "lavender and gold", main: { hue: 0.74, sat: 0.55 }, accent: { hue: 0.12, sat: 0.7 } },
  { name: "deep sea and cyan", main: { hue: 0.64, sat: 1 }, accent: { hue: 0.5, sat: 0.6 } },
];
const FIELD_VAL = 0.35;

// Fields: the ground, in the main color, with a still shape.
interface Field { name: string; make: (main: Hue, accent: Hue) => void }
const mask = (seg: string, f: Fn) => segment(seg, () => addEffect({ position_brightness: { mult_factor_decrease: f } }));
const FIELDS: Field[] = [
  { name: "plain", make: main => constColor({ ...main, val: FIELD_VAL }) },
  { name: "glowing from the inner side", make: main => { constColor({ ...main, val: FIELD_VAL * 1.4 }); mask("rad", L(1, 0.3)); } },
  { name: "mottled", make: main => { constColor({ ...main, val: FIELD_VAL * 1.3 }); mask("rand", sin(0.35, 1, 0, 7)); } },
  { name: "with accent dots", make: (main, accent) => {
    constColor({ ...main, val: FIELD_VAL });
    segment("b1", () => constColor({ ...accent, val: FIELD_VAL * 1.6 }));
  } },
];

// Confetti on rand, each over a few snakes with different cycles (every other one running the other way), so the
// flecks never repeat in step.
interface Confetti { name: string; make: (main: Hue, accent: Hue, p: RingPlace) => void }
// How fast the confetti runs, on top of the overall speed (1 as in the gallery); set per call of optionEffects.
let confettiSpeed = 1;
const confettiCycle = (seconds: number, cb: Function) => cycleAt(seconds / confettiSpeed, cb);
const flecks = (count: number, tail: number, cycles: number[], p: RingPlace, fx: (head: Fn, tail: Fn) => void) =>
  segment("rand", () => { for (let k = 0; k < count; k++) confettiCycle(cycles[k % cycles.length], () => fx(lap(p.phase + k / count, k % 2 ? -p.dir : p.dir), K(tail))); });
const CONFETTI: Confetti[] = [
  { name: "white glitter", make: (_m, _a, p) => flecks(3, 0.05, [2.5, 4, 5], p, (head, tail_length) => {
    addEffect({ snake_saturation: { head, tail_length, cyclic: true, mult_factor_decrease: sin(0.05, 1, 0.25) } });
    addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_increase: glow(0.95) } });
  }) },
  { name: "accent flecks", make: (main, accent, p) => flecks(3, 0.07, [4, 5, 2.5], p, (head, tail_length) => {
    // The shorter way round the hue circle, so sunset to sky goes through violet rather than green.
    const to = ((((accent.hue - main.hue) % 1) + 1.5) % 1) - 0.5;
    addEffect({ snake_hue: { head, tail_length, cyclic: true, offset_factor: sin(0, to, -0.25) } });
    addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_increase: glow(0.9) } });
  }) },
  { name: "colorful twinkles", make: (_m, _a, p) => {
    segment("rand", () => addEffect({ position_hue: { offset_factor: L(0, 1) } }));
    flecks(3, 0.06, [4, 5, 10], p, (head, tail_length) =>
      addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_increase: glow(0.95) } }));
  } },
  { name: "dark flecks", make: (_m, _a, p) => flecks(3, 0.1, [4, 5, 10], p, (head, tail_length) =>
    addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_decrease: sin(0.05, 1, 0.25) } })) },
  { name: "popping dots", make: (_m, _a, p) => {
    confettiCycle(1.25, () => segment("rand", () => addEffect({
      position_brightness: { mult_factor_increase: repeatFn(5, { fixed_window: { start: p.phase, end: p.phase + 0.12, cyclic: true, outside_value: 0, func: K(0.9) } }) },
    })));
    flecks(2, 0.06, [4, 5], p, (head, tail_length) =>
      addEffect({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_increase: glow(0.95) } }));
  } },
];

// Movers: a soft band of light going round a second mapping, or none.
interface Mover { name: string; make: (p: RingPlace) => void }
const band = (seg: string, seconds: number, tail: number, p: RingPlace, count = 1) => segment(seg, () => cycleAt(seconds, () => {
  for (let k = 0; k < count; k++) addEffect({
    snake_brightness: { head: lap(p.phase + k / count, p.dir), tail_length: K(tail), cyclic: true, mult_factor_increase: glow(0.5) },
  });
}));
const MOVERS: Mover[] = [
  { name: "", make: () => {} },
  { name: "ripples along rad", make: p => band("rad", 4, 0.5, p) },
  { name: "spinners round every small ring", make: p => band("centric", 4, 0.3, p, 2) },
  { name: "blooms", make: p => band("arc", 5, 0.5, p) },
  { name: "a chase round the big ring", make: p => band("ind", 5, 0.4, p) },
  { name: "a comet", make: p => band("all", 10, 0.15, p) },
];

// The movers' short names, for the options' names.
const MOVER_SHORT = ["", "ripples", "spinners", "blooms", "chase", "comet"];

// On top: one small ring of every big ring, in the accent color, moving. The inner and the outer side of a big ring
// fall between two small rings, so the right half takes one and the left half the other, and the halves mirror.
interface Top { name: string; make: (accent: Hue, p: RingPlace, ring: number) => void }
const spin = (seg: string, dir: number, phase: number, accent: Hue) => segment(seg, () => {
  constColor({ ...accent, val: 0.1 });
  cycleAt(4, () => addEffect({ snake_brightness: { head: lap(phase, dir), tail_length: K(0.4), cyclic: true, mult_factor_increase: glow(0.95) } }));
});
const TOPS: Top[] = [
  { name: "", make: () => {} },
  { name: "the inner small ring spinning", make: (a, p, r) => spin(side(r) > 0 ? "3" : "2", p.dir, p.phase, a) },
  { name: "the outer small ring spinning", make: (a, p, r) => spin(side(r) > 0 ? "8" : "9", p.dir, p.phase, a) },
  { name: "the side small rings pulsing", make: (a, p) => ["6", "11"].forEach(seg => segment(seg, () => {
    constColor({ ...a, val: 0.1 });
    cycleAt(2.5, () => addEffect({ timed_brightness: { mult_factor_increase: sin(0, 0.85, -0.25 - p.phase) } }));
  })) },
];

// How a grouping's groups relate.
const MODES = ["swapped", "split", "echo"] as const;

interface Part { field: number; confetti: number; mover: number }
export interface Background3Option {
  name: string; category: string; tags: string[]; desc: string;
  grouping: number; mode: number; pair: number; timing: number; top: number; parts: Part[];
}
const TIMINGS = [1, 0, 5, 2, 3]; // mirror, together, round, alternate, quartets

/** The options, spread so neighbours differ: every grouping, then within it the pair, field, confetti, mover, mode,
 *  top and timing stepping at different rates. */
export const OPTIONS: Background3Option[] = Array.from({ length: OPTION_COUNT }, (_, i) => {
  const grouping = Math.floor((i * GROUPINGS.length) / OPTION_COUNT), g = GROUPINGS[grouping];
  const pair = i % PAIRS.length, b = Math.floor(i / PAIRS.length);
  const field = (i * 3 + b) % FIELDS.length, confetti = (b + 2 * i) % CONFETTI.length;
  const mover = (i * 5 + b) % MOVERS.length, mode = g.groups > 1 ? (i + b) % MODES.length : 2;
  const top = [0, 1, 0, 2, 0, 3][(i * 3 + Math.floor(i / 7)) % 6];
  const timing = TIMINGS[(i * 2 + Math.floor(i / 9)) % TIMINGS.length];
  const parts: Part[] = Array.from({ length: g.groups }, (_, k) => MODES[mode] === "split" && k > 0
    ? { field: (field + k) % FIELDS.length, confetti: (confetti + 1 + k) % CONFETTI.length, mover: (mover + 2 * k) % MOVERS.length }
    : { field, confetti, mover });
  const pl = PAIRS[pair], kind = g.groups > 1 ? MODES[mode] : "";
  const say = (pt: Part) => [FIELDS[pt.field].name + " field", CONFETTI[pt.confetti].name, MOVERS[pt.mover].name].filter(Boolean).join(", ");
  const looks = [...new Set(parts.map(say))];
  return {
    name: `${pl.name[0].toUpperCase()}${pl.name.slice(1)}: ${[...new Set(parts.map(pt => CONFETTI[pt.confetti].name))].join(" / ")}${MOVERS[mover].name ? ` + ${MOVER_SHORT[mover]}` : ""}${TOPS[top].name ? " + small ring" : ""}`,
    category: g.name,
    tags: [...(kind ? [kind] : []), ...(TOPS[top].name ? ["small ring on top"] : [])],
    desc: `${pl.name}; ${g.desc}${kind ? ` (${kind}${kind === "swapped" ? ": the main and accent colors traded" : kind === "echo" ? ": half a cycle apart" : ""})` : ""}: ${looks.join(" | ")}${TOPS[top].name ? `; ${TOPS[top].name}` : ""}. Timing: ${LAYOUTS[timing].name.toLowerCase()}.`,
    grouping, mode, pair, timing, top, parts,
  };
});

/** Option i's effects, from `from` to `to` seconds, its movements `speedFactor` times as fast as in the gallery and
 *  its confetti `confettiFactor` times as fast again. */
export const optionEffects = (i: number, from = 0, to = LOOP, speedFactor = 1, confettiFactor = 1) => withSpeed(speedFactor, () => {
  confettiSpeed = confettiFactor;
  const o = OPTIONS[i], g = GROUPINGS[o.grouping], pl = PAIRS[o.pair];
  all.forEach(ring => elements([ring], () => beats(from, to, () => {
    const k = g.group(ring), part = o.parts[k], base = LAYOUTS[o.timing].place(ring);
    // Echo: the later groups half a cycle behind; swapped: odd groups trade the main and the accent color.
    const p: RingPlace = MODES[o.mode] === "echo" && k > 0 ? { ...base, phase: base.phase + 0.5 * k } : base;
    const [main, accent] = MODES[o.mode] === "swapped" && k % 2 ? [pl.accent, pl.main] : [pl.main, pl.accent];
    FIELDS[part.field].make(main, accent);
    CONFETTI[part.confetti].make(main, accent, p);
    MOVERS[part.mover].make(p);
    TOPS[o.top].make(accent, p, ring);
  })));
  confettiSpeed = 1;
});

/** Option i on its own, as the sequence a trigger would send. */
export const optionSequence = (i: number) => {
  const anim = new Animation(`background3-option-${i}`, BPM, LOOP);
  anim.sync(() => optionEffects(i));
  return anim.getSequence();
};

if (require.main === module) {
  const out = path.join(__dirname, "..", "ui", "public", "background3-options.json");
  const options = OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: optionSequence(i) }));
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LOOP, options }));
  const mixes = new Set(OPTIONS.map(o => JSON.stringify([o.grouping, o.mode, o.pair, o.timing, o.top, o.parts])));
  console.log(`Saved ${out}: ${options.length} options (${mixes.size} different mixes)`);
}
