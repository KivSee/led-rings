// Patterns for Aladdin's beats 36-39, over its colors there (the even rings orange, the odd ones pale blue, then the
// red dots), for the gallery (ui/background-gallery.html?set=aladdin_beats36), which loops beats 34-40 with every
// option side by side. A pattern only changes the colors under it a little (shading, a white glint, a tint toward
// gold or sky blue, or lifting the light), so the colors stay; it is a mapping, a kind, a phase across the rings and a speed.
// aladdin.ts draws the picked one (patternEffects); the gallery's base is aladdin.ts exported without it
// (ALADDIN_BEATS36=none).
// Run it (npx ts-node src/songs/aladdin-beats36-options.ts) to write ui/public/aladdin_beats36-options.json.
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { Animation } from "../animation/animation";
import { beats, cycle } from "../time/time";
import { elements, segment } from "../objects/elements";
import { addEffect } from "../effects/effect";

const SET = "aladdin_beats36";
// As in aladdin.ts.
const BPM = 64.725, LENGTH = 76, OFFSET_MS = 575;
export const FROM = 36, TO = 39;
// The gallery plays a little around it.
const PLAY_FROM = 34, PLAY_TO = 40;

type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const L = (start: number, end: number): Fn => ({ linear: { start, end } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });

// The rings, ring 12 first (at the top), and their mirror pairs from the top.
const RINGS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const PAIRS = [[12, 11], [1, 10], [2, 9], [3, 8], [4, 7], [5, 6]];
const pairOf = (r: number) => PAIRS.findIndex(p => p.includes(r));
const right = (r: number) => r === 12 || r <= 5;

// What a pattern does to the pixels under it, gentlest at its ends.
interface Kind { name: string; fx: (head: Fn, tail: number, cyclic: boolean, ring: number) => object[] }
const KINDS: Kind[] = [
  { name: "shadows", fx: (head, tail, cyclic) => [{ snake_brightness: { head, tail_length: K(tail), cyclic, mult_factor_decrease: sin(0.25, 1, 0.25) } }] },
  { name: "white glints", fx: (head, tail, cyclic) => [
    { snake_saturation: { head, tail_length: K(tail), cyclic, mult_factor_decrease: sin(0.15, 1, 0.25) } },
    { snake_brightness: { head, tail_length: K(tail), cyclic, mult_factor_increase: sin(0, 0.8, -0.25) } },
  ] },
  // The even rings are orange (toward gold) and the odd ones pale blue (toward sky blue): never toward pink or purple.
  { name: "tint", fx: (head, tail, cyclic, ring) =>
    [{ snake_hue: { head, tail_length: K(tail), cyclic, offset_factor: sin(0, ring % 2 ? -0.08 : 0.07, -0.25) } }] },
  { name: "light", fx: (head, tail, cyclic) => [{ snake_brightness: { head, tail_length: K(tail), cyclic, mult_factor_increase: sin(0, 0.7, -0.25) } }] },
];
// Where it moves: a mapping, how many snakes, how long.
interface Mapping { name: string; seg: string; count: number; tail: number }
const MAPPINGS: Mapping[] = [
  { name: "2 spinning round the small rings", seg: "centric", count: 2, tail: 0.3 },
  { name: "3 spinning round the small rings", seg: "centric", count: 3, tail: 0.18 },
  { name: "ripples along rad", seg: "rad", count: 1, tail: 0.45 },
  { name: "double ripples along rad", seg: "rad", count: 2, tail: 0.25 },
  { name: "blooms (arc)", seg: "arc", count: 1, tail: 0.45 },
  { name: "chase round the big ring (ind)", seg: "ind", count: 1, tail: 0.35 },
  { name: "spiral (updown)", seg: "updown", count: 2, tail: 0.3 },
  { name: "comets through every pixel (all)", seg: "all", count: 3, tail: 0.15 },
  { name: "twinkles (rand)", seg: "rand", count: 3, tail: 0.1 },
];
// How the rings are timed against each other.
interface Phase { name: string; of: (r: number) => number; dir: (r: number) => number }
const PHASES: Phase[] = [
  { name: "mirrored, a pair after another", of: r => pairOf(r) / 12, dir: r => (right(r) ? 1 : -1) },
  { name: "all together", of: () => 0, dir: () => 1 },
  { name: "once round from ring 12", of: r => RINGS.indexOf(r) / 12, dir: () => 1 },
  { name: "neighbours opposite", of: r => (r % 2) * 0.5, dir: r => (r % 2 ? 1 : -1) },
];
// Laps in beats: a lap every half beat, every beat, or one slow sweep over the 3 beats.
const SPEEDS = [{ name: "fast", beats: 0.5 }, { name: "a lap a beat", beats: 1 }, { name: "one slow sweep", beats: 3 }];

/** A lap from `phase`, the way `dir` turns, kept within 0-2. */
const lap = (phase: number, dir: number): Fn => (dir > 0 ? L(phase, phase + 1) : L(phase + 1, phase));

export const OPTIONS = KINDS.flatMap((k, ki) => MAPPINGS.flatMap((m, mi) => PHASES.flatMap((ph, pi) => SPEEDS.flatMap((sp, si) => {
  // Every other combination (about half), spread so each kind, mapping, phase and speed shows up often; the first
  // (shadows, 2 spinning, mirrored, a lap a beat) is the one in the song now.
  const first = ki === 0 && mi === 0 && pi === 0 && si === 1;
  if (!first && (ki + mi + pi + si) % 2 !== 0) return [];
  return [{
    name: `${k.name}: ${m.name}, ${ph.name}, ${sp.name}`,
    category: k.name,
    tags: [m.seg, ph.name, sp.name],
    desc: `${k.name}, ${m.name}, ${ph.name}, ${sp.name}, over the colors of beats 36-39.`,
    kind: ki, mapping: mi, phase: pi, speed: si, first,
  }];
})))).sort((a, b) => Number(b.first) - Number(a.first));

/** Pattern i over beats 36-39, last in the song so it only changes the colors under it. */
export const patternEffects = (i: number) => {
  const o = OPTIONS[i], k = KINDS[o.kind], m = MAPPINGS[o.mapping], ph = PHASES[o.phase], sp = SPEEDS[o.speed];
  for (const ring of RINGS) beats(FROM, TO, () => cycle(sp.beats, () => elements([ring], () => segment(m.seg, () => {
    for (let n = 0; n < m.count; n++) for (const fx of k.fx(lap(ph.of(ring) + n / m.count, ph.dir(ring)), m.tail, true, ring)) addEffect(fx as never);
  }))));
};

if (require.main === module) {
  const root = path.join(__dirname, "..", "..");
  // The base: aladdin.ts without the pattern.
  const basePath = path.join(root, "ui", "public", "aladdin.no-beats36.sequence.json");
  execFileSync("npx", ["ts-node", "src/export-sequence.ts", "src/songs/aladdin.ts", basePath], { cwd: root, env: { ...process.env, ALADDIN_BEATS36: "none" } });
  const base = JSON.parse(fs.readFileSync(basePath, "utf8")).sequence;
  const withPattern = (i: number) => {
    const anim = new Animation("aladdin", BPM, LENGTH, OFFSET_MS);
    anim.sync(() => patternEffects(i));
    const over = anim.getSequence();
    return Object.fromEntries(Object.entries(base).map(([thing, s]: [string, any]) =>
      [thing, { ...s, effects: [...s.effects, ...(over[thing]?.effects ?? [])] }]));
  };
  const toSec = (beat: number) => OFFSET_MS / 1000 + (beat * 60) / BPM;
  const options = [
    { name: "No pattern", category: "No pattern", tags: [], desc: "the colors of beats 36-39 with nothing on top", sequence: base },
    ...OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: withPattern(i) })),
  ];
  const out = path.join(root, "ui", "public", `${SET}-options.json`);
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LENGTH, audio: "aladdin.wav", from: toSec(PLAY_FROM), to: toSec(PLAY_TO), options }));
  console.log(`Saved ${out}: ${options.length} options, playing ${toSec(PLAY_FROM).toFixed(2)}-${toSec(PLAY_TO).toFixed(2)} s`);
}
