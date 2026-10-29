// Snakes for Aladdin's bars 5-8 (beats 16-30), for the gallery (ui/background-gallery.html?set=aladdin_bars5_snake):
// the coloring picked for them (aladdin-bars5-options.ts, option 89: the mirror pairs coming in, purple then gold, in
// rings along rad, fading out in the stop) with a gentle, slow snake over it while the rings are lit in each part. The
// rings are at full brightness, so the snake shades rather than lights: a soft shadow, a slight hue drift or a pale
// shimmer, on a mapping, a lap every 3 or 6 beats, phased across the rings. The first card is the song as it is now.
// Run it (npx ts-node src/songs/aladdin-bars5-snakes.ts) to write ui/public/aladdin_bars5_snake-options.json.
import * as fs from "fs";
import * as path from "path";
import { Animation } from "../animation/animation";
import { beats, cycle } from "../time/time";
import { elements, segment } from "../objects/elements";
import { all } from "../objects/ring-elements";
import { addEffect } from "../effects/effect";
import { height, lap, side } from "../background-options";
import { OPTIONS as COLORINGS, PART1, PART2, PART2_END, REVEALS, STOP, TO, FROM, optionEffects as coloringEffects, type Hue } from "./aladdin-bars5-options";

const SET = "aladdin_bars5_snake";
// As in aladdin.ts.
const BPM = 64.725, LENGTH = 76, OFFSET_MS = 575;
// The coloring picked for the bars (as in aladdin.ts), in desert colors: terracotta in part 1, golden sand in part 2
// (the rings along rad blending between them through orange, never pink or purple).
export const COLORING = 87;
const DESERT: [Hue, Hue] = [{ hue: 0.03, sat: 1 }, { hue: 0.11, sat: 1 }];

type Fn = object;
const K = (value: number): Fn => ({ const_value: { value } });
const sin = (min: number, max: number, phase: number, repeats = 1): Fn => ({ sin: { min, max, phase, repeats } });

// What the snake does to the pixels it passes, softest at its ends.
const KINDS: { name: string; fx: (head: Fn, tail: Fn) => object }[] = [
  { name: "soft shadow", fx: (head, tail_length) => ({ snake_brightness: { head, tail_length, cyclic: true, mult_factor_decrease: sin(0.35, 1, 0.25) } }) },
  { name: "hue drift", fx: (head, tail_length) => ({ snake_hue: { head, tail_length, cyclic: true, offset_factor: sin(0, 0.06, -0.25) } }) }, // toward yellow only: desert colors
  { name: "pale shimmer", fx: (head, tail_length) => ({ snake_saturation: { head, tail_length, cyclic: true, mult_factor_decrease: sin(0.35, 1, 0.25) } }) },
];
// The mappings, with how long the snake is on each.
const MAPPINGS: { name: string; seg: string; tail: number; count: number }[] = [
  { name: "out along rad", seg: "rad", tail: 0.5, count: 1 },
  { name: "round every small ring (centric)", seg: "centric", tail: 0.4, count: 2 },
  { name: "blooming (arc)", seg: "arc", tail: 0.5, count: 1 },
  { name: "round the big ring (ind)", seg: "ind", tail: 0.4, count: 1 },
  { name: "spiral (updown)", seg: "updown", tail: 0.4, count: 2 },
  { name: "through every pixel (all)", seg: "all", tail: 0.25, count: 2 },
  { name: "scattered (rand)", seg: "rand", tail: 0.35, count: 2 },
];
// Phase across the rings, ring 12 first (at the top).
const PHASES: { name: string; of: (r: number) => number; dir: (r: number) => number }[] = [
  { name: "together", of: () => 0, dir: () => 1 },
  { name: "once round", of: r => (r % 12) / 12, dir: () => 1 },
  { name: "mirrored", of: r => 0.5 * (1 - height(r)), dir: r => side(r) },
];
// A lap every 3 or 6 beats: 1 to 2 laps in each 6-beat part.
const LAPS = [3, 6];

export const OPTIONS = KINDS.flatMap((k, ki) => MAPPINGS.flatMap((m, mi) => PHASES.map((ph, pi) => {
  const laps = LAPS[(ki + mi + pi) % LAPS.length];
  return {
    name: `${k.name} ${m.name}, ${ph.name}, a lap every ${laps} beats`,
    category: k.name,
    tags: [m.seg, ph.name],
    desc: `the picked coloring with a ${k.name} ${m.name}, ${ph.name}, a lap every ${laps} beats while the rings are lit.`,
    kind: ki, mapping: mi, phase: pi, laps,
  };
})));

/** Option i: the picked coloring, and the snake over each ring while it is lit in each part. */
export const optionEffects = (i: number) => {
  const o = OPTIONS[i], k = KINDS[o.kind], m = MAPPINGS[o.mapping], ph = PHASES[o.phase];
  coloringEffects(COLORING, DESERT);
  const reveal = REVEALS[COLORINGS[COLORING].reveal];
  all.forEach(ring => elements([ring], () => reveal.parts(ring).forEach(([part, at]) => {
    // The snake runs from the part's start (so it moves on steadily from ring to ring), shown while the ring is lit.
    const [start, end] = part === 0 ? [PART1, STOP] : [PART2, PART2_END];
    beats(start + at, end, () => segment(m.seg, () => cycle(o.laps, () => {
      for (let n = 0; n < m.count; n++) addEffect(k.fx(lap(ph.of(ring) + n / m.count, ph.dir(ring)), K(m.tail)) as never);
    })));
  })));
};

const sequenceOf = (cb: () => void) => {
  const anim = new Animation("aladdin", BPM, LENGTH, OFFSET_MS);
  anim.sync(cb);
  return anim.getSequence();
};

if (require.main === module) {
  const toSec = (beat: number) => OFFSET_MS / 1000 + (beat * 60) / BPM;
  const now = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "ui", "public", "aladdin.sequence.json"), "utf8")).sequence;
  const options = [
    { name: "As it is now", category: "As it is now", tags: [], desc: "the song as it is now: the picked coloring, no snake", sequence: now },
    ...OPTIONS.map((o, i) => ({ name: o.name, category: o.category, tags: o.tags, desc: o.desc, sequence: sequenceOf(() => optionEffects(i)) })),
  ];
  const out = path.join(__dirname, "..", "..", "ui", "public", `${SET}-options.json`);
  fs.writeFileSync(out, JSON.stringify({ loopSeconds: LENGTH, audio: "aladdin.wav", from: toSec(FROM), to: toSec(TO), options }));
  console.log(`Saved ${out}: ${options.length} options, playing ${toSec(FROM).toFixed(2)}-${toSec(TO).toFixed(2)} s`);
}
