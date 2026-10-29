// Background 2 options for the background gallery (ui/background-gallery.html?set=2): OPTION_COUNT calm, looping
// animations where the rings are split into groups (odd and even, top and bottom, …), each group with its own
// coloring, decoration and movement (from the first set, src/background-options.ts), matched so they go together:
// the same colors with different movements, the same movement in different colors, or both different from a
// matching pair. Many also have one small ring of every big ring moving on top of the rest (the inner one, the outer
// one, both, or the ones at the sides).
// Run it (npx ts-node src/background2-options.ts) to write ui/public/background2-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "./animation/animation";
import { beats, cycle } from "./time/time";
import { elements, segment } from "./objects/elements";
import { all } from "./objects/ring-elements";
import { constColor } from "./effects/coloring";
import { addEffect } from "./effects/effect";
import { COLORINGS, DECORATIONS, LAYOUTS, LOOP, MOVEMENTS, cycleAt, glow, height, lap, side, withSpeed, type RingPlace } from "./background-options";

const BPM = 60;
const OPTION_COUNT = 400;
const K = (value: number) => ({ const_value: { value } });
const sin = (min: number, max: number, phase: number, repeats = 1) => ({ sin: { min, max, phase, repeats } });

// The groupings: which group (0, 1 or 2) each ring is in.
interface Grouping { name: string; desc: string; group: (r: number) => number; groups: number }
const PAIR = (r: number) => [[12, 11], [1, 10], [2, 9], [3, 8], [4, 7], [5, 6]].findIndex(p => p.includes(r));
const GROUPINGS: Grouping[] = [
  { name: "Odd and even", desc: "the odd and the even rings", group: r => r % 2, groups: 2 },
  { name: "Top and bottom", desc: "the top half and the bottom half", group: r => (height(r) > 0.5 ? 0 : 1), groups: 2 },
  { name: "Every third", desc: "rings 1, 4, 7, 10 and the rest", group: r => ((r - 1) % 3 === 0 ? 0 : 1), groups: 2 },
  { name: "Sides and poles", desc: "the rings at the sides (2, 3, 8, 9) and the top and bottom ones",
    group: r => ([2, 3, 8, 9].includes(r) ? 0 : 1), groups: 2 },
  { name: "Three groups", desc: "3 groups, every third ring (1, 4, 7, 10 / 2, 5, 8, 11 / 3, 6, 9, 12)", group: r => (r - 1) % 3, groups: 3 },
  { name: "Mirror pairs", desc: "the mirror pairs taking turns from the top (12 and 11, 2 and 9, 4 and 7 / the others)",
    group: r => PAIR(r) % 2, groups: 2 },
];

// Colorings that go together: for coloring c, the one its other groups get.
const MATCH = [8, 9, 1, 4, 1, 7, 2, 5, 0, 2];

// What goes on top: one small ring of every big ring, recolored and moving over the rest. The inner and the outer
// side of a big ring each fall between two small rings (local 12 between small rings 2 and 3, local 6 between 8 and
// 9), so the right half takes one and the left half the other, and the halves mirror each other.
interface Overlay { name: string; on: (p: RingPlace, ring: number) => void }
const ACCENTS = [{ hue: 0.12, sat: 0.55 }, { hue: 0.52, sat: 0.6 }, { hue: 0, sat: 0 }];
const spin = (seg: string, dir: number, phase: number, accent: { hue: number; sat: number }) => segment(seg, () => {
  constColor({ ...accent, val: 0.1 });
  cycleAt(4, () => addEffect({ snake_brightness: { head: lap(phase, dir), tail_length: K(0.4), cyclic: true, mult_factor_increase: glow(0.95) } }));
});
const OVERLAYS: ((accent: { hue: number; sat: number }) => Overlay)[] = [
  () => ({ name: "", on: () => {} }),
  a => ({ name: "the inner small ring spinning", on: (p, r) => spin(side(r) > 0 ? "3" : "2", p.dir, p.phase, a) }),
  a => ({ name: "the outer small ring spinning", on: (p, r) => spin(side(r) > 0 ? "8" : "9", p.dir, p.phase, a) }),
  a => ({ name: "the inner and outer small rings spinning opposite ways", on: (p, r) => {
    spin(side(r) > 0 ? "3" : "2", p.dir, p.phase, a);
    spin(side(r) > 0 ? "8" : "9", -p.dir, p.phase, a);
  } }),
  a => ({ name: "the side small rings pulsing", on: p => ["6", "11"].forEach(seg => segment(seg, () => {
    constColor({ ...a, val: 0.1 });
    cycleAt(2.5, () => addEffect({ timed_brightness: { mult_factor_increase: sin(0, 0.8, -0.25 - p.phase) } }));
  })) }),
];

interface Recipe { coloring: number; decoration: number; movement: number }
export interface Background2Option { name: string; category: string; tags: string[]; desc: string; layout: number; grouping: number; recipes: Recipe[]; overlay: number; accent: number }

/** The options, spread so that neighbours differ. Every third is "same colors", "same movement" or "matching". */
export const OPTIONS: Background2Option[] = Array.from({ length: OPTION_COUNT }, (_, i) => {
  const grouping = Math.floor((i * GROUPINGS.length) / OPTION_COUNT), mode = i % 3;
  const a = i % 10, b = Math.floor(i / 10);
  const coloring = a, movement = (b + 3 * a) % MOVEMENTS.length, decoration = (i * 3 + b) % DECORATIONS.length;
  const recipes: Recipe[] = Array.from({ length: GROUPINGS[grouping].groups }, (_, g) => {
    if (g === 0) return { coloring, decoration, movement };
    const otherMove = (movement + 2 + ((i + g) % 6)) % MOVEMENTS.length;
    const otherDeco = (decoration + 3 * g) % DECORATIONS.length;
    if (mode === 0) return { coloring, decoration: otherDeco, movement: otherMove };
    if (mode === 1) return { coloring: g === 1 ? MATCH[coloring] : MATCH[MATCH[coloring]], decoration, movement };
    return { coloring: g === 1 ? MATCH[coloring] : MATCH[MATCH[coloring]], decoration: otherDeco, movement: otherMove };
  });
  const overlay = [0, 1, 0, 2, 3, 0, 4][(i * 3 + Math.floor(i / 7)) % 7];
  const accent = (i + b) % ACCENTS.length;
  const layout = [1, 0, 5, 2, 3, 1][(i * 5 + Math.floor(i / 13)) % 6];
  const kind = ["same colors", "same movement", "matching"][mode];
  const top = OVERLAYS[overlay](ACCENTS[accent]).name;
  const parts = recipes.map(rc => `${COLORINGS[rc.coloring].name.toLowerCase()} with ${DECORATIONS[rc.decoration].name}, ${MOVEMENTS[rc.movement].name}`);
  return {
    name: `${[...new Set(recipes.map(rc => COLORINGS[rc.coloring].name))].join(" & ")}: ${[...new Set(recipes.map(rc => MOVEMENTS[rc.movement].name))].join(" / ")}${top ? " + small ring" : ""}`,
    category: GROUPINGS[grouping].name,
    tags: [kind, ...(top ? ["small ring on top"] : [])],
    desc: `${GROUPINGS[grouping].desc} (${kind}): ${parts.join("; ")}${top ? `; ${top}` : ""}. Timing: ${LAYOUTS[layout].name.toLowerCase()}.`,
    layout, grouping, recipes, overlay, accent,
  };
});

/** Option i's effects, from `from` to `to` seconds, its movements `speedFactor` times as fast as in the gallery. */
export const optionEffects = (i: number, from = 0, to = LOOP, speedFactor = 1) => withSpeed(speedFactor, () => {
  const o = OPTIONS[i], g = GROUPINGS[o.grouping], top = OVERLAYS[o.overlay](ACCENTS[o.accent]);
  all.forEach(ring => elements([ring], () => beats(from, to, () => {
    const p = LAYOUTS[o.layout].place(ring), rc = o.recipes[g.group(ring)];
    COLORINGS[rc.coloring].color(ring, p);
    DECORATIONS[rc.decoration].deco(p);
    MOVEMENTS[rc.movement].move(p);
    top.on(p, ring);
  })));
});

/** Option i on its own, as the sequence a trigger would send. */
export const optionSequence = (i: number) => {
  const anim = new Animation(`background2-option-${i}`, BPM, LOOP);
  anim.sync(() => optionEffects(i));
  return anim.getSequence();
};

if (require.main === module) {
  const out = path.join(__dirname, "..", "ui", "public", "background2-options.json");
  const options = OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: optionSequence(i) }));
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LOOP, options }));
  const mixes = new Set(OPTIONS.map(o => JSON.stringify([o.layout, o.grouping, o.recipes, o.overlay, o.accent])));
  console.log(`Saved ${out}: ${options.length} options (${mixes.size} different mixes)`);
}
