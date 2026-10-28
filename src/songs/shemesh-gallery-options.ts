// Options for parts of shemesh (PARTS: chorus 3 and party 5): colorful, rainbow animations playing with the music,
// grouped in categories, each at a slow, medium and fast speed and in 8 variations, to compare side by side in the
// gallery (ui/gallery.html) and pick one for each 4-bar block of the part, for shemesh.ts.
// Each option is built with the song DSL on its own Animation, with shemesh's beats, over the whole part, at a speed,
// a hit timing and a variation, when the gallery asks for it: the Vite dev server runs this file with --serve and
// sends it requests (ui/vite.config.ts, /api/gallery). In chorus 3 every full option ends with the chorus' beat and
// bar accents, as in the song.
// Usage: npx ts-node src/songs/shemesh-gallery-options.ts (prints the parts and options; --serve for the gallery)
import * as fs from "fs";
import * as path from "path";
import { Animation } from "../animation/animation";
import { beats, cycle, cycleBeats } from "../time/time";
import { constColor } from "../effects/coloring";
import { addEffect } from "../effects/effect";
import { elements, segment } from "../objects/elements";
import { all } from "../objects/ring-elements";

const song = JSON.parse(fs.readFileSync(path.join(__dirname, "shemesh.json"), "utf8")).song;

// The parts of the song with a gallery: the beats they span, the audio played around them, and their 4-bar blocks,
// each of which can take a different option (a shorter last one).
interface Part { key: string; title: string; file: string; start: number; end: number; playFrom: number; accents: boolean; style: string }
const PARTS: Part[] = [
  { key: "chorus3", title: "Chorus 3, bars 143-157", file: "shemesh-chorus3-options", start: 568, end: 628, playFrom: 564, accents: true, style: "full" },
  { key: "party5", title: "Party 5, bars 158-176", file: "shemesh-party5-options", start: 628, end: 704, playFrom: 624, accents: false, style: "darker" },
  { key: "verse2", title: "Verse 2, bars 93-100", file: "shemesh-verse2-options", start: 368, end: 400, playFrom: 364, accents: false, style: "coloring" },
  { key: "flow", title: "Verse 2 flow, beats 390-400", file: "shemesh-flow-options", start: 390, end: 400, playFrom: 386, accents: false, style: "flow" },
];
const blocksOf = (p: Part): [number, number][] => {
  const blocks: [number, number][] = [];
  for (let b = p.start; b < p.end; b += 16) blocks.push([b, Math.min(b + 16, p.end)]);
  return blocks;
};
// The part being built: its start and end beats (moved by the hit timing's offset) and length; and the part's own
// start and end, for what stays on the beat (the accents).
let S = 0, E = 0, BEATS = 0, PART_S = 0, PART_E = 0;

const K = (value: number) => ({ const_value: { value } });
const L = (start: number, end: number) => ({ linear: { start, end } });
const sin = (min: number, max: number, phase: number, repeats = 1) => ({ sin: { min, max, phase, repeats } });
// The variation being built (VARIATIONS, below): which way things turn (dir), where they start (start), how far
// apart the rings are phased (spread, a multiple of a twelfth per ring), the colors (hue, a shift round the circle),
// and where the pattern sits on the big ring (rot rings clockwise, then mirrored left and right).
let VAR = { dir: 1, start: 0, spread: 1, hue: 0, rot: 0, mirror: false };
const steps = (num_steps: number, diff_per_step: number, first_step_value: number) =>
  ({ steps: { num_steps, diff_per_step: diff_per_step * VAR.dir, first_step_value } });
const half = (f1: object, f2: object) => ({ half: { f1, f2 } });
const on = K(1), off = K(0);

/** A snake on the segment in use, raising brightness from 0 at its tail to `peak` at its head. */
const lit = (head: object, tail: number | object, cyclic = true, peak = 1) => addEffect({
  snake_brightness: { head, tail_length: typeof tail === "number" ? K(tail) : tail, cyclic, mult_factor_increase: L(0, peak) },
});
/** The same, evenly lit along the snake. */
const litFlat = (head: object, tail: number | object, cyclic = true, v = 1) => addEffect({
  snake_brightness: { head, tail_length: typeof tail === "number" ? K(tail) : tail, cyclic, mult_factor_increase: K(v) },
});
/** A head going `laps` times round the segment per cycle, from `at` (backwards with dir -1). */
const lap = (at: number, dir = 1, laps = 1) => (dir * VAR.dir > 0 ? L(at, at + laps) : L(at + laps, at));
const lift = (f: object) => addEffect({ timed_brightness: { mult_factor_increase: f } });
const dim = (f: object) => addEffect({ timed_brightness: { mult_factor_decrease: f } });
const mask = (f: object) => addEffect({ position_brightness: { mult_factor_decrease: f } });
/** Ring r's share of the circle, for phasing things round the big ring clockwise. */
const at = (r: number) => (VAR.spread * (r - 1)) / 12 + VAR.start;
/** A hue shifted by the variation. */
const vh = (h: number) => (((h + VAR.hue) % 1) + 1) % 1;
/** Ring r's color: (r - 1) / 12 round the hue circle, shifted by the variation. */
const hueOf = (r: number) => vh((r - 1) / 12);
/** The physical ring that plays ring r's part in the variation: rotated, then mirrored. */
const place = (r: number) => {
  const rot = ((r - 1 + VAR.rot) % 12) + 1;
  return VAR.mirror ? ((11 - rot + 12) % 12) || 12 : rot;
};

/** Run cb for every ring in `rings` over the bars, with the ring number and its index. */
const each = (rings: number[], cb: (r: number, i: number) => void) =>
  rings.forEach((r, i) => elements([place(r)], () => beats(S, E, () => cb(r, i))));
/** The rainbow: ring r starts (r - 1) / 12 round the hue circle (so the big ring is a rainbow), `spread` circles
 *  more along `seg`, and the hues turn `turn` of the circle over the bars. Brightness `val` (0: dark until lit). */
// A hue every rainbow takes instead (galleryRange's `hue`), with only a little variation along the segment; null for
// the rainbows.
let HUE_OVERRIDE: number | null = null;
const rainbow = (r: number, seg?: string, spread = 1, turn = 0.25, val = 0) => {
  if (HUE_OVERRIDE !== null) {
    constColor({ hue: HUE_OVERRIDE, sat: 1, val });
    if (seg) segment(seg, () => addEffect({ position_hue: { offset_factor: sin(-0.02, 0.02, 0, 3) } }));
    return;
  }
  constColor({ hue: hueOf(r), sat: 1, val });
  if (seg) segment(seg, () => addEffect({ position_hue: { offset_factor: spread === 1 ? L(0, 1) : { repeat: { numberOfTimes: spread, funcToRepeat: L(0, 1) } } } }));
  if (turn) addEffect({ timed_hue: { offset_factor: L(0, turn) } });
};
const ODD = all.filter(r => r % 2), EVEN = all.filter(r => r % 2 === 0);
const SQUARES = [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]];
const TRIANGLES = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];
// On ind (relPos k/11 for small ring k at clock position k): the inner side and the outer side of a big ring.
const INNER = half(half(on, off), half(off, on)), OUTER = half(half(off, on), half(on, off));

/** An option; `part` for one made for one part only (how it is in the song now); its style, "full" (the default)
 *  or "darker" (mostly dark, sparse pixels), or "any" for the song as it is now. */
interface Option { name: string; category: string; desc: string; part?: string; style?: string; build: () => void }

// The speed the options are built at: every cycle is SPEED times as long (2 slow, 1 medium, 0.5 fast), and so are
// the few things counted over the whole part (ticks, color jumps, flows). The beat-locked parts stay on the beat
// grid: halved, they fall on half beats; doubled, on every other beat.
let SPEED = 1;
// The hit timing (HITS, below): the beat-level hits (cycles of a beat or less, events of a beat or less in a cycle,
// ticks and per-beat jumps) are HIT times as far apart (0.5 twice a beat, 2 every two beats), and the whole option
// starts OFF beats late (0.5 on the off-beats).
let HIT = 1, OFF = 0;
const cyc = (n: number, cb: Function) => cycle(n * SPEED * (n <= 1 ? HIT : 1), cb);
const cycB = (n: number, from: number, to: number, cb: Function) => {
  const k = SPEED * (to - from <= 1 ? HIT : 1);
  return cycleBeats(n * k, from * k, to * k, cb);
};
/** A cycle of per-beat jumps (n of them, steps on every beat): follows the hit timing. */
const cycHit = (n: number, cb: Function) => cycle(n * SPEED * HIT, cb);
/** Steps on every beat over the whole part (ticks). */
const TICKS = () => BEATS / SPEED / HIT;
const OPTIONS: Option[] = [
  {
    name: "Spiral comets",
    category: "Spirals and comets (all)",
    desc: "A comet on all (through every small ring in order) per ring, a lap every 2 bars, each ring a twelfth behind the one before: a spiral turning round the big ring.",
    build: () => each(all, r => { rainbow(r, "all"); segment("all", () => cyc(8, () => lit(lap(at(r)), 0.35))); }),
  },
  {
    name: "Chasing wave",
    category: "Small rings in turn (ind)",
    desc: "Every ring spins a snake round its small rings (ind), and a brightness wave goes round the big ring once a bar.",
    build: () => each(all, r => {
      rainbow(r, "ind");
      segment("ind", () => cyc(2, () => lit(lap(0), 0.5)));
      cyc(4, () => dim(sin(0.1, 1, -at(r))));
    }),
  },
  {
    name: "Beat bloom",
    category: "Out from the center (rad)",
    desc: "On every beat a ring of light blooms out from the inner side to the outer side (rad), rainbow along rad.",
    build: () => each(all, r => { rainbow(r, "rad", 0.5); segment("rad", () => cyc(1, () => lit(L(0, 1.4), 0.4, false))); }),
  },
  {
    name: "In and out",
    category: "Out from the center (rad)",
    desc: "The odd rings bloom out on beats 1 and 3, the even rings fall in on beats 2 and 4 (rad).",
    build: () => each(all, r => {
      rainbow(r, "rad", 0.5);
      segment("rad", () => r % 2
        ? cycB(2, 0, 1, () => lit(L(0, 1.4), 0.4, false))
        : cycB(2, 1, 2, () => addEffect({ snake_brightness: { head: L(1.4, 0), tail_length: K(0.4), cyclic: false, mult_factor_increase: L(1, 0) } })));
    }),
  },
  {
    name: "Gears",
    category: "Spinning small rings (centric)",
    desc: "Two snakes spinning in every small ring (centric), a lap a bar, the odd rings clockwise and the even rings back, like meshing gears.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(4, () => [0, 0.5].forEach(a => lit(lap(a, r % 2 ? 1 : -1), 0.3))));
    }),
  },
  {
    name: "Ticking gears",
    category: "Spinning small rings (centric)",
    desc: "The gears, but ticking: the snakes jump a quarter round on every beat, the odd and even rings opposite ways.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      const d = r % 2 ? 0.25 : -0.25;
      segment("centric", () => cycHit(4, () => [0, 0.5].forEach(a => litFlat(steps(4, d, a + 0.25), 0.25))));
    }),
  },
  {
    name: "Waterfall",
    category: "Breathing and falling (arc, updown)",
    desc: "Light falls through every ring in the same direction in space (updown), every 2 beats, rainbow along the fall.",
    build: () => each(all, r => { rainbow(r, "updown"); segment("updown", () => cyc(2, () => lit(L(1.3, 0), 0.4, false, 1))); }),
  },
  {
    name: "Confetti beats",
    category: "Confetti and dots (rand, b1, b2)",
    desc: "On every beat a new scatter of colored confetti (rand) flashes on and fades over the beat.",
    build: () => each(all, r => {
      rainbow(r, "rand", 6);
      segment("rand", () => cycHit(4, () => litFlat(steps(4, 0.37, at(r)), 0.3)));
      cyc(1, () => dim(L(1, 0.15)));
    }),
  },
  {
    name: "Rainbow wheel pump",
    category: "Mixed and full",
    desc: "Every ring fully lit, the big ring a rainbow that turns once over the chorus, pumping on every beat.",
    build: () => each(all, r => { rainbow(r, "ind", 0.3, 1, 1); cyc(1, () => dim(L(1, 0.3))); }),
  },
  {
    name: "Clock spiral",
    category: "Small rings in turn (ind)",
    desc: "A clock hand of 3 small rings (ind) in every ring, ticking one small ring per beat, each ring a twelfth ahead: a spiral that ticks round.",
    build: () => each(all, r => { rainbow(r, "ind"); segment("ind", () => litFlat(steps(TICKS(), 1 / 12, at(r) + 0.25), 0.25)); }),
  },
  {
    name: "Kaleidoscope",
    category: "Breathing and falling (arc, updown)",
    desc: "Every small ring breathes out from pixel 0 round both sides and back (arc) every 2 beats, the rings in 4 groups a quarter apart.",
    build: () => each(all, r => {
      rainbow(r, "arc");
      segment("arc", () => cyc(2, () => lit(sin(0, 1.1, -((r - 1) % 4) / 4 - 0.25), 0.4, false)));
    }),
  },
  {
    name: "Twinkle field",
    category: "Confetti and dots (rand, b1, b2)",
    desc: "A dim rainbow everywhere, with bright twinkles running through it on rand.",
    build: () => each(all, r => {
      rainbow(r, "rand", 6, 0.25, 0.2);
      segment("rand", () => {
        cyc(4, () => lit(lap(at(r)), 0.15));
        cyc(6, () => lit(lap(0.5, -1), 0.1));
      });
    }),
  },
  {
    name: "Ripple rays",
    category: "Out from the center (rad)",
    desc: "A ray goes out and back along rad once a bar, each ring a twelfth later, so the rays ripple round the big ring.",
    build: () => each(all, r => { rainbow(r, "rad", 0.6); segment("rad", () => cyc(4, () => lit(sin(-0.1, 1.2, -at(r) - 0.25), 0.3, false))); }),
  },
  {
    name: "Wobble spinners",
    category: "Spinning small rings (centric)",
    desc: "A snake spinning in every small ring (centric), a lap a bar, rocking back and forth on every beat.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(4, () => lit({ comb2: { f1: lap(0), amount1: 1, f2: sin(-0.15, 0.15, 0, 4), amount2: 1 } }, 0.4)));
    }),
  },
  {
    name: "Square strobes",
    category: "Big rings in turn",
    desc: "Slow dim spinners everywhere; the 3 squares of rings (every third) flash in turn, one per beat, so the flash runs across the bars.",
    build: () => SQUARES.forEach((rings, g) => each(rings, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(8, () => lit(lap(0), 0.4, true, 0.35)));
      cycB(3, g, g + 1, () => lift(L(1, 0)));
    })),
  },
  {
    name: "Rainbow river",
    category: "Confetti and dots (rand, b1, b2)",
    desc: "Every ring fully lit with the rainbow along all, flowing round once every 2 bars; the dots (b1) and the rest (b2) dip in turn on the beats.",
    build: () => each(all, r => {
      rainbow(r, "all", 1, BEATS / 8 / SPEED, 1);
      segment("b1", () => cycB(2, 0, 1, () => dim(L(0.2, 1))));
      segment("b2", () => cycB(2, 1, 2, () => dim(L(0.2, 1))));
    }),
  },
  {
    name: "Fill and spill",
    category: "Small rings in turn (ind)",
    desc: "Every bar each ring fills up round its small rings (ind) and empties again, the odd rings forward and the even rings back.",
    build: () => each(all, r => {
      rainbow(r, "ind");
      const d = r % 2 ? 1 : -1;
      // The odd rings fill from the first small ring and empty from it; the even rings the same from the last one.
      segment("ind", () => cyc(4, () => addEffect({
        snake_brightness: d > 0
          ? { head: half(L(0, 1.01), K(1.01)), tail_length: half(L(0, 1.02), L(1.02, 0)), cyclic: false, mult_factor_increase: K(1) }
          : { head: half(K(1.01), L(1.01, -0.01)), tail_length: half(L(0, 1.02), L(1.02, 0)), cyclic: false, mult_factor_increase: K(1) },
      })));
    }),
  },
  {
    name: "Double helix",
    category: "Spirals and comets (all)",
    desc: "Two long comets on all half a lap apart, the odd rings turning one way and the even the other, each ring a twelfth behind.",
    build: () => each(all, r => {
      rainbow(r, "all", 2);
      segment("all", () => cyc(8, () => [0, 0.5].forEach(a => lit(lap(at(r) + a, r % 2 ? 1 : -1), 0.25))));
    }),
  },
  {
    name: "Fireworks",
    category: "Out from the center (rad)",
    desc: "On every beat a triangle of rings bursts out along rad, white at the head, leaving sparkles; the triangles take turns round the big ring.",
    build: () => TRIANGLES.forEach((rings, g) => each(rings, r => {
      rainbow(r, "rad", 0.5);
      segment("rad", () => cycB(4, g, g + 1, () => {
        lit(L(0, 1.5), 0.6, false);
        addEffect({ snake_saturation: { head: L(0, 1.5), tail_length: K(0.15), cyclic: false, mult_factor_decrease: L(1, 0) } });
      }));
      segment("rand", () => cycB(4, (g + 1) % 4, (g + 1) % 4 + 1, () => lit(L(0, 1), 0.3, true, 0.5)));
    })),
  },
  {
    name: "Counter-pinwheels",
    category: "Small rings in turn (ind)",
    desc: "Every ring fully lit, showing one half of its small rings (ind) and then the other on the beats, neighbouring rings opposite, the colors turning.",
    build: () => each(all, r => {
      rainbow(r, "ind", 1, 1, 1);
      const [a, b] = r % 2 ? [half(on, off), half(off, on)] : [half(off, on), half(on, off)];
      segment("ind", () => { cycB(2, 0, 1, () => mask(a)); cycB(2, 1, 2, () => mask(b)); });
    }),
  },
  {
    name: "Breathing comets",
    category: "Spinning small rings (centric)",
    desc: "A comet round every small ring (centric) once a bar, its tail stretching and shrinking on every beat.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(4, () => lit(lap(at(r)), sin(0.05, 0.7, -0.25, 4))));
    }),
  },
  {
    name: "Inside out",
    category: "Small rings in turn (ind)",
    desc: "Every ring fully lit; the inner side of every big ring on beats 1 and 3, the outer side on 2 and 4.",
    build: () => each(all, r => {
      rainbow(r, "ind", 1, 0.5, 1);
      segment("ind", () => { cycB(2, 0, 1, () => mask(INNER)); cycB(2, 1, 2, () => mask(OUTER)); });
    }),
  },
  {
    name: "Ring by ring",
    category: "Big rings in turn",
    desc: "A ring lights up on every beat, going round clockwise (3 bars round), fading out over 3 beats; spinners inside.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(1, () => lit(lap(0), 0.5)));
      cyc(12, () => dim({ fixed_window: { start: at(r), end: at(r) + 0.25, cyclic: true, outside_value: 0, func: L(1, 0) } }));
    }),
  },
  {
    name: "Opposite pairs",
    category: "Big rings in turn",
    desc: "Opposite rings flash together, the pairs stepping round one per beat, breathing arcs inside.",
    build: () => each(all, r => {
      rainbow(r, "arc");
      segment("arc", () => cyc(2, () => lit(sin(0.2, 1.1, -0.25), 0.5, false)));
      cyc(6, () => dim({ fixed_window: { start: ((r - 1) % 6) / 6, end: ((r - 1) % 6) / 6 + 0.34, cyclic: true, outside_value: 0.08, func: L(1, 0.1) } }));
    }),
  },
  {
    name: "Spectrum ripple",
    category: "Out from the center (rad)",
    desc: "Every ring fully lit with a rainbow from its inner side to its outer side (rad); on every beat a dark ripple runs outward.",
    build: () => each(all, r => {
      rainbow(r, "rad", 1, 0.5, 1);
      segment("rad", () => cyc(1, () => addEffect({ snake_brightness: { head: L(0, 1.3), tail_length: K(0.3), cyclic: false, mult_factor_decrease: K(0.05) } })));
    }),
  },
  {
    name: "Disco dots",
    category: "Confetti and dots (rand, b1, b2)",
    desc: "The dots (b1) in the ring's color and the rest (b2) in the opposite color, taking turns on the beats.",
    build: () => each(all, r => {
      rainbow(r, undefined, 1, 1, 1);
      segment("b2", () => addEffect({ position_hue: { offset_factor: K(0.5) } }));
      segment("b1", () => { cycB(2, 0, 1, () => dim(L(1, 0.1))); cycB(2, 1, 2, () => dim(K(0.1))); });
      segment("b2", () => { cycB(2, 1, 2, () => dim(L(1, 0.1))); cycB(2, 0, 1, () => dim(K(0.1))); });
    }),
  },
  {
    name: "Rotating half",
    category: "Big rings in turn",
    desc: "Half of the big ring lit, turning round once every 3 bars, the lit rings spinning snakes in their small rings.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(2, () => [0, 0.5].forEach(a => lit(lap(a), 0.4))));
      cyc(12, () => dim(sin(0, 1, -at(r))));
    }),
  },
  {
    name: "Color jumps",
    category: "Spinning small rings (centric)",
    desc: "Three snakes in every small ring (centric), a lap every 2 beats; every bar all the colors jump a third round the rainbow.",
    build: () => each(all, r => {
      constColor({ hue: hueOf(r), sat: 1, val: 0 });
      segment("centric", () => addEffect({ position_hue: { offset_factor: L(0, 0.3) } }));
      addEffect({ timed_hue: { offset_factor: steps(BEATS / 4 / SPEED, 1 / 3, 0) } });
      segment("centric", () => cyc(2, () => [0, 1 / 3, 2 / 3].forEach(a => lit(lap(a), 0.2))));
    }),
  },
  {
    name: "Zigzag",
    category: "Small rings in turn (ind)",
    desc: "Every ring fully lit, alternating inner and outer side on the beats, neighbouring rings opposite, so the band zigzags.",
    build: () => each(all, r => {
      rainbow(r, "ind", 1, 0.5, 1);
      const [a, b] = r % 2 ? [INNER, OUTER] : [OUTER, INNER];
      segment("ind", () => { cycB(2, 0, 1, () => mask(a)); cycB(2, 1, 2, () => mask(b)); });
    }),
  },
  {
    name: "Ecstatic mix",
    category: "Mixed and full",
    desc: "Spinners in every small ring, a bloom out along rad on every bar, and sparkles on rand, all at once.",
    build: () => each(all, r => {
      rainbow(r, "centric", 1, 0.5);
      segment("centric", () => cyc(2, () => lit(lap(at(r)), 0.3, true, 0.8)));
      segment("rad", () => cyc(4, () => cycB(4, 0, 1, () => lit(L(0, 1.4), 0.5, false))));
      segment("rand", () => cyc(4, () => lit(lap(0.5, -1), 0.12)));
    }),
  },
  {
    name: "Stepping rays",
    category: "Out from the center (rad)",
    desc: "A ray climbs out along rad a step per beat over the bar, the odd and even rings two beats apart.",
    build: () => each(all, r => {
      rainbow(r, "rad", 0.6);
      segment("rad", () => cycHit(4, () => litFlat(steps(4, 0.3, r % 2 ? 0.3 : 0.9), 0.3, true)));
    }),
  },
  {
    name: "Halves call and answer",
    category: "Big rings in turn",
    desc: "The right half of the big ring plays a bar of spinners, then the left half answers the next bar.",
    build: () => [[12, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]].forEach((rings, g) => each(rings, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(1, () => [0, 0.5].forEach(a => lit(lap(a, g ? -1 : 1), 0.35))));
      cycB(8, (1 - g) * 4, (1 - g) * 4 + 4, () => dim(K(0.08)));
    })),
  },
];

// ---- More options, in families: each family takes one idea through organized variations. ----

const RIGHT = [12, 1, 2, 3, 4, 5];
/** Where ring r sits on the big ring: x from left (-1) to right (1), y from bottom (-1) to top (1). */
const ringX = (r: number) => Math.sin(((r + 0.5) * Math.PI) / 6), ringY = (r: number) => Math.cos(((r + 0.5) * Math.PI) / 6);
const dirName = (d: number) => (d > 0 ? "clockwise" : "back");

// Big ring beat patterns: which rings light up on each beat of an n-beat cycle; a lit ring flashes and decays over its
// beat, the others stay dim. Each with three things inside the rings.
const GATE_DIM = 0.08;
const BEAT_PATTERNS: { name: string; desc: string; n: number; on: (r: number, k: number) => boolean }[] = [
  { name: "Three-ring chase", desc: "3 neighbouring rings lit, the group stepping a ring clockwise on every beat", n: 12, on: (r, k) => (k - (r - 1) + 12) % 12 < 3 },
  { name: "Left-right ping-pong", desc: "a band of rings swinging from the left side to the right and back every 2 bars", n: 8, on: (r, k) => Math.abs(ringX(r) + Math.cos((Math.PI * k) / 4)) < 0.5 },
  { name: "Top-bottom ping-pong", desc: "a band of rings swinging from the top to the bottom and back every 2 bars", n: 8, on: (r, k) => Math.abs(ringY(r) - Math.cos((Math.PI * k) / 4)) < 0.5 },
  { name: "Opposite pairs turn", desc: "an opposite pair of rings lit, the next pair on every beat", n: 6, on: (r, k) => (r - 1) % 6 === k },
  { name: "Squares turn", desc: "every third ring lit, the next square on every beat", n: 3, on: (r, k) => (r - 1) % 3 === k },
  { name: "Triangles turn", desc: "every fourth ring lit, the next triangle on every beat", n: 4, on: (r, k) => (r - 1) % 4 === k },
  { name: "Halves swap", desc: "the right half for 2 beats, then the left half", n: 4, on: (r, k) => (k < 2) === RIGHT.includes(r) },
  { name: "Odd-even swap", desc: "the odd rings on beats 1 and 3, the even rings on 2 and 4", n: 2, on: (r, k) => r % 2 === (k === 0 ? 1 : 0) },
];
const SMOOTH_PATTERNS: { name: string; desc: string; gate: (r: number) => void }[] = [
  { name: "Wave clockwise", desc: "a soft brightness wave going round the big ring clockwise once a bar", gate: r => cyc(4, () => dim(sin(0.05, 1, -at(r)))) },
  { name: "Wave back", desc: "a soft brightness wave going round the big ring counter-clockwise once a bar", gate: r => cyc(4, () => dim(sin(0.05, 1, at(r)))) },
];
const INSIDES: { name: string; desc: string; build: (r: number) => void }[] = [
  { name: "spinners", desc: "two snakes spinning in every small ring", build: r => { rainbow(r, "centric"); segment("centric", () => cyc(2, () => [0, 0.5].forEach(a => lit(lap(a), 0.3)))); } },
  { name: "blooms", desc: "a bloom out along rad on every beat", build: r => { rainbow(r, "rad", 0.5); segment("rad", () => cyc(1, () => lit(L(0, 1.4), 0.4, false))); } },
  { name: "glow", desc: "the whole ring lit, a rainbow round its small rings", build: r => rainbow(r, "ind", 1, 0.5, 1) },
];
for (const inside of INSIDES) {
  for (const p of BEAT_PATTERNS) OPTIONS.push({
    name: `${p.name}, ${inside.name}`, category: "Big ring beat patterns", desc: `${p.desc}; inside, ${inside.desc}.`,
    build: () => each(all, r => {
      inside.build(r);
      for (let k = 0; k < p.n; k++) cycB(p.n, k, k + 1, () => dim(p.on(r, k) ? L(1, 0.35) : K(GATE_DIM)));
    }),
  });
  for (const p of SMOOTH_PATTERNS) OPTIONS.push({
    name: `${p.name}, ${inside.name}`, category: "Big ring beat patterns", desc: `${p.desc}; inside, ${inside.desc}.`,
    build: () => each(all, r => { inside.build(r); p.gate(r); }),
  });
}

// Spinners in the small rings (centric): how many, and which way each ring turns.
const SPIN_MODES: { name: string; desc: string; dir: (r: number) => number; phase: (r: number) => number }[] = [
  { name: "all together", desc: "every ring the same", dir: () => 1, phase: () => 0 },
  { name: "odd-even", desc: "the odd rings clockwise, the even rings back", dir: r => (r % 2 ? 1 : -1), phase: () => 0 },
  { name: "halves", desc: "the right half clockwise, the left half back, mirrored", dir: r => (RIGHT.includes(r) ? 1 : -1), phase: () => 0 },
  { name: "spiral", desc: "every ring a twelfth of a lap ahead of the one before", dir: () => 1, phase: r => at(r) },
];
for (const n of [1, 3, 4]) for (const m of SPIN_MODES) OPTIONS.push({
  name: `Spinners ×${n}, ${m.name}`, category: "Spinning small rings (centric)",
  desc: `${n} snake${n > 1 ? "s" : ""} spinning in every small ring, a lap every 2 beats; ${m.desc}.`,
  build: () => each(all, r => {
    rainbow(r, "centric");
    segment("centric", () => cyc(2, () => { for (let j = 0; j < n; j++) lit(lap(m.phase(r) + j / n, m.dir(r)), 0.6 / n + 0.05); }));
  }),
});

// Out from the center (rad).
const bloom = () => lit(L(0, 1.4), 0.4, false);
const fallIn = () => addEffect({ snake_brightness: { head: L(1.4, 0), tail_length: K(0.4), cyclic: false, mult_factor_increase: L(1, 0) } });
const corePulse = () => addEffect({ snake_brightness: { head: sin(0.1, 1.01, -0.25), tail_length: sin(0.11, 1.02, -0.25), cyclic: false, mult_factor_increase: K(1) } });
const rimPulse = () => addEffect({ snake_brightness: { head: K(1.01), tail_length: sin(0.1, 1.02, -0.25), cyclic: false, mult_factor_increase: K(1) } });
const RAD_OPTIONS: { name: string; desc: string; build: (r: number) => void }[] = [
  { name: "Off-beat bloom", desc: "a bloom out along rad on every off-beat", build: () => cycB(1, 0.5, 1, bloom) },
  { name: "Fall in", desc: "light falling in from the outer side to the inner side on every beat", build: () => cyc(1, fallIn) },
  { name: "Double bloom", desc: "two rings of light blooming out together on every beat", build: () => cyc(1, () => { bloom(); lit(L(-0.5, 0.9), 0.3, false); }) },
  { name: "Square blooms", desc: "the squares (every third ring) bloom in turn, one per beat", build: r => cycB(3, (r - 1) % 3, (r - 1) % 3 + 1, bloom) },
  { name: "Half blooms", desc: "the right half blooms on beats 1 and 3, the left half on 2 and 4", build: r => cycB(2, RIGHT.includes(r) ? 0 : 1, RIGHT.includes(r) ? 1 : 2, bloom) },
  { name: "Triangle blooms", desc: "the triangles (every fourth ring) bloom in turn, one per beat", build: r => cycB(4, (r - 1) % 4, (r - 1) % 4 + 1, bloom) },
  { name: "Ping-pong rays", desc: "a ray going out and back along rad once a bar, every ring together", build: () => cyc(4, () => lit(sin(-0.1, 1.2, -0.25), 0.3, false)) },
  { name: "Crossing rays", desc: "a ray going out and back once a bar, the odd and even rings opposite", build: r => cyc(4, () => lit(sin(-0.1, 1.2, r % 2 ? -0.25 : 0.25), 0.3, false)) },
  { name: "Core pulse", desc: "every ring filling out from its inner side and back on every beat", build: () => cyc(1, corePulse) },
  { name: "Core pulse odd-even", desc: "the core pulse, the odd rings on beats 1 and 3 and the even on 2 and 4", build: r => cycB(2, r % 2 ? 0 : 1, r % 2 ? 1 : 2, corePulse) },
  { name: "Rim pulse", desc: "every ring filling in from its outer side and back on every beat", build: () => cyc(1, rimPulse) },
  { name: "Core and rim", desc: "the odd rings pulse from the core, the even rings from the rim, on every beat", build: r => cyc(1, r % 2 ? corePulse : rimPulse) },
];
for (const o of RAD_OPTIONS) OPTIONS.push({
  name: o.name, category: "Out from the center (rad)", desc: `${o.desc[0].toUpperCase()}${o.desc.slice(1)}.`,
  build: () => each(all, r => { rainbow(r, "rad", 0.5); segment("rad", () => o.build(r)); }),
});

// Small rings in turn (ind).
const IND_OPTIONS: { name: string; desc: string; build: (r: number) => void }[] = [
  { name: "Comets together", desc: "a comet round the small rings once a bar, every ring the same", build: () => cyc(4, () => lit(lap(0), 0.4)) },
  { name: "Comets spiral", desc: "a comet round the small rings once a bar, every ring a twelfth ahead", build: r => cyc(4, () => lit(lap(at(r)), 0.4)) },
  { name: "Comets odd-even", desc: "a comet round the small rings every 2 beats, the odd rings clockwise and the even back", build: r => cyc(2, () => lit(lap(0, r % 2 ? 1 : -1), 0.4)) },
  { name: "Twin comets odd-even", desc: "two comets half a lap apart every 2 beats, the odd rings clockwise and the even back", build: r => cyc(2, () => [0, 0.5].forEach(a => lit(lap(a, r % 2 ? 1 : -1), 0.3))) },
  { name: "Ticks together", desc: "3 small rings lit, stepping one small ring on every beat, every ring the same", build: () => litFlat(steps(TICKS(), 1 / 12, 0.25), 0.25) },
  { name: "Fast ticks spiral", desc: "3 small rings stepping on every half beat, every ring a twelfth ahead", build: r => litFlat(steps(2 * TICKS(), 1 / 12, at(r) + 0.25), 0.25) },
  { name: "Ticks odd-even", desc: "3 small rings stepping on every beat, the odd rings clockwise and the even back", build: r => litFlat(steps(TICKS(), r % 2 ? 1 / 12 : -1 / 12, 0.25), 0.25) },
  { name: "Third turns", desc: "a third of every ring lit, jumping a third round on every beat", build: () => cycHit(3, () => litFlat(steps(3, 1 / 3, 1 / 3), 0.33)) },
  { name: "Single small ring", desc: "one small ring lit, stepping on every beat, every ring a twelfth ahead", build: r => litFlat(steps(TICKS(), 1 / 12, at(r) + 0.09), 0.09) },
  { name: "Half spin", desc: "half of every ring lit, the half turning once a bar, every ring the same", build: () => cyc(4, () => litFlat(lap(0), 0.5)) },
  { name: "Half spin odd-even", desc: "half of every ring lit, turning once a bar, the odd rings clockwise and the even back", build: r => cyc(4, () => litFlat(lap(0, r % 2 ? 1 : -1), 0.5)) },
  { name: "Quarter spin spiral", desc: "a quarter of every ring lit, turning every 2 beats, every ring a twelfth ahead", build: r => cyc(2, () => litFlat(lap(at(r)), 0.25)) },
];
for (const o of IND_OPTIONS) OPTIONS.push({
  name: o.name, category: "Small rings in turn (ind)", desc: `${o.desc[0].toUpperCase()}${o.desc.slice(1)}.`,
  build: () => each(all, r => { rainbow(r, "ind"); segment("ind", () => o.build(r)); }),
});

// Comets along all (through every small ring in order): how many, which way, how long.
for (const n of [1, 2, 3]) for (const alt of [false, true]) for (const [tailName, tail] of [["short", 0.12], ["long", 0.4]] as [string, number][]) OPTIONS.push({
  name: `All-path comets ×${n}, ${alt ? "odd-even" : "together"}, ${tailName}`, category: "Spirals and comets (all)",
  desc: `${n} ${tailName} comet${n > 1 ? "s" : ""} along all, a lap every 2 bars, each ring a twelfth behind the one before; ${alt ? "the odd rings one way and the even the other" : "every ring the same way"}.`,
  build: () => each(all, r => {
    rainbow(r, "all", 2);
    segment("all", () => cyc(8, () => { for (let j = 0; j < n; j++) lit(lap(at(r) + j / n, alt && r % 2 === 0 ? -1 : 1), tail / n + 0.05); }));
  }),
});

// Breathing (arc) and falling (updown).
const ARC_UPDOWN: { name: string; seg: string; desc: string; build: (r: number) => void }[] = [
  { name: "Arc breath", seg: "arc", desc: "every small ring breathing out from pixel 0 round both sides and back on every beat", build: () => cyc(1, () => lit(sin(0, 1.1, -0.25), 0.4, false)) },
  { name: "Arc breath odd-even", seg: "arc", desc: "the breath every 2 beats, the odd and even rings half a breath apart", build: r => cyc(2, () => lit(sin(0, 1.1, r % 2 ? -0.25 : 0.25), 0.4, false)) },
  { name: "Arc breath wave", seg: "arc", desc: "a breath once a bar, each ring a twelfth later, so the breathing goes round", build: r => cyc(4, () => lit(sin(0, 1.1, -at(r) - 0.25), 0.4, false)) },
  { name: "Arc sweep", seg: "arc", desc: "on every beat the light sweeps from pixel 0 down both sides of every small ring", build: () => cyc(1, () => lit(L(0, 1.3), 0.35, false)) },
  { name: "Arc sweep back", seg: "arc", desc: "on every beat the light sweeps back up both sides to pixel 0", build: () => cyc(1, () => lit(L(1.3, 0), 0.35, false)) },
  { name: "Arc sweep odd-even", seg: "arc", desc: "the odd rings sweep down on beats 1 and 3, the even rings on 2 and 4", build: r => cycB(2, r % 2 ? 0 : 1, r % 2 ? 1 : 2, () => lit(L(0, 1.3), 0.35, false)) },
  { name: "Rise", seg: "updown", desc: "light rising through every ring the same way in space on every beat", build: () => cyc(1, () => lit(L(-0.3, 1), 0.4, false)) },
  { name: "Fall per beat", seg: "updown", desc: "light falling through every ring the same way in space on every beat", build: () => cyc(1, () => lit(L(1.3, 0), 0.4, false)) },
  { name: "Rise and fall odd-even", seg: "updown", desc: "the odd rings rise while the even rings fall, every 2 beats", build: r => cyc(2, () => lit(r % 2 ? L(-0.3, 1) : L(1.3, 0), 0.4, false)) },
  { name: "Bounce", seg: "updown", desc: "a band bouncing up and down through every ring once a bar", build: () => cyc(4, () => lit(sin(0, 1.2, -0.25), 0.35, false)) },
  { name: "Bounce wave", seg: "updown", desc: "the bounce, each ring a twelfth later, so it waves round the big ring", build: r => cyc(4, () => lit(sin(0, 1.2, -at(r) - 0.25), 0.35, false)) },
  { name: "Fall by halves", seg: "updown", desc: "the right half falls on beats 1 and 3, the left half on 2 and 4", build: r => cycB(2, RIGHT.includes(r) ? 0 : 1, RIGHT.includes(r) ? 1 : 2, () => lit(L(1.3, 0), 0.4, false)) },
];
for (const o of ARC_UPDOWN) OPTIONS.push({
  name: o.name, category: "Breathing and falling (arc, updown)", desc: `${o.desc[0].toUpperCase()}${o.desc.slice(1)}.`,
  build: () => each(all, r => { rainbow(r, o.seg); segment(o.seg, () => o.build(r)); }),
});

// Confetti and dots.
for (const [densName, dens] of [["sparse", 0.1], ["medium", 0.25], ["dense", 0.5]] as [string, number][]) {
  OPTIONS.push({
    name: `Confetti crawl, ${densName}`, category: "Confetti and dots (rand, b1, b2)",
    desc: `${Math.round(dens * 100)}% of the pixels lit as colored confetti on rand, crawling round once a bar, each ring from its own point.`,
    build: () => each(all, r => { rainbow(r, "rand", 6); segment("rand", () => cyc(4, () => lit(lap(at(r)), dens))); }),
  });
  OPTIONS.push({
    name: `Confetti flash, ${densName}`, category: "Confetti and dots (rand, b1, b2)",
    desc: `On every beat a new ${Math.round(dens * 100)}% of the pixels flash on as colored confetti and fade over the beat.`,
    build: () => each(all, r => {
      rainbow(r, "rand", 6);
      segment("rand", () => cycHit(4, () => litFlat(steps(4, 0.37, at(r)), dens)));
      cyc(1, () => dim(L(1, 0.15)));
    }),
  });
}
const DOTS: { name: string; desc: string; build: (r: number) => void }[] = [
  { name: "Dots flip", desc: "the dots (b1) and the rest (b2) in opposite colors, swapping colors every bar", build: () => {
    segment("b1", () => cyc(8, () => addEffect({ timed_hue: { offset_factor: steps(2, 0.5, 0) } })));
    segment("b2", () => cyc(8, () => addEffect({ timed_hue: { offset_factor: steps(2, 0.5, 0.5) } })));
  } },
  { name: "Dots blink", desc: "only the dots (b1) lit, blinking on every beat", build: () => { segment("b2", () => dim(K(0))); segment("b1", () => cyc(1, () => dim(L(1, 0.1)))); } },
  { name: "Dots on glow", desc: "a dim glow (b2) with the dots (b1) flashing bright on every beat", build: () => { segment("b2", () => dim(K(0.2))); segment("b1", () => cyc(1, () => dim(L(1, 0.3)))); } },
  { name: "Dots flow", desc: "only the dots (b1) lit, the rainbow flowing fast round them", build: () => {
    segment("b2", () => dim(K(0)));
    segment("b1", () => cyc(4, () => addEffect({ timed_hue: { offset_factor: L(0, 1) } })));
  } },
];
for (const o of DOTS) OPTIONS.push({
  name: o.name, category: "Confetti and dots (rand, b1, b2)", desc: `${o.desc[0].toUpperCase()}${o.desc.slice(1)}.`,
  build: () => each(all, r => { rainbow(r, "all", 1, 0.5, 1); o.build(r); }),
});
for (const [glowName, glow] of [["dark", 0.1], ["bright", 0.35]] as [string, number][]) OPTIONS.push({
  name: `Twinkles on ${glowName} rainbow`, category: "Confetti and dots (rand, b1, b2)",
  desc: `A rainbow glowing at ${Math.round(glow * 100)}% everywhere, with fast bright twinkles on rand, a lap every 2 beats.`,
  build: () => each(all, r => { rainbow(r, "rand", 6, 0.25, glow); segment("rand", () => cyc(2, () => [0, 0.5].forEach(a => lit(lap(at(r) + a), 0.06)))); }),
});

// Color schemes, all on the same motion: two snakes spinning in every small ring (centric), a lap every 2 beats.
const spin2 = () => segment("centric", () => cyc(2, () => [0, 0.5].forEach(a => lit(lap(a), 0.3))));
const COLORS: { name: string; desc: string; color: (r: number) => void }[] = [
  { name: "Rainbow in every ring", desc: "every ring the whole rainbow round its small rings, the same on all rings", color: () => { constColor({ hue: vh(0), sat: 1, val: 0 }); segment("centric", () => addEffect({ position_hue: { offset_factor: L(0, 1) } })); addEffect({ timed_hue: { offset_factor: L(0, 0.5) } }); } },
  { name: "Complementary halves", desc: "the right half one color and the left half the opposite, both turning", color: r => { constColor({ hue: vh(RIGHT.includes(r) ? 0.55 : 0.05), sat: 1, val: 0 }); addEffect({ timed_hue: { offset_factor: L(0, 0.5) } }); } },
  { name: "Warm rainbow", desc: "reds, oranges and yellows round the big ring", color: r => { constColor({ hue: vh(0.97 + 0.18 * Math.abs(6 - (r - 1)) / 6), sat: 1, val: 0 }); segment("centric", () => addEffect({ position_hue: { offset_factor: L(0, 0.05) } })); } },
  { name: "Cool rainbow", desc: "greens, blues and purples round the big ring", color: r => { constColor({ hue: vh(0.4 + 0.45 * Math.abs(6 - (r - 1)) / 6), sat: 1, val: 0 }); segment("centric", () => addEffect({ position_hue: { offset_factor: L(0, 0.05) } })); } },
  { name: "Color jump every beat", desc: "the rainbow round the big ring, every color jumping a quarter round on every beat", color: r => { constColor({ hue: hueOf(r), sat: 1, val: 0 }); addEffect({ timed_hue: { offset_factor: steps(TICKS(), 0.25, 0) } }); } },
  { name: "Fast color flow", desc: "the rainbow round the big ring, flowing round fast (a turn a bar)", color: r => rainbow(r, "centric", 1, BEATS / 4 / SPEED) },
  { name: "Pastel rainbow", desc: "the rainbow round the big ring, pale", color: r => { constColor({ hue: hueOf(r), sat: 0.6, val: 0 }); segment("centric", () => addEffect({ position_hue: { offset_factor: L(0, 0.3) } })); addEffect({ timed_hue: { offset_factor: L(0, 0.25) } }); } },
  { name: "Two-tone pixels", desc: "the dots (b1) in the opposite color to the rest of the ring, round the rainbow", color: r => { rainbow(r, "centric", 1, 0.25); segment("b1", () => addEffect({ position_hue: { offset_factor: K(0.5) } })); } },
];
for (const o of COLORS) OPTIONS.push({
  name: o.name, category: "Color schemes", desc: `${o.desc[0].toUpperCase()}${o.desc.slice(1)}; two snakes spinning in every small ring.`,
  build: () => each(all, r => { o.color(r); spin2(); }),
});

// Chorus 3 as it is in the song now (shemesh.ts), each of its 4 blocks as an option over the whole chorus, so it
// can be used for any block and varied like the others.
const songConfetti = () => segment("rand", () => cyc(4, () => lit(lap(0), 0.15, true, 0.4)));
const SONG_NOW = "In the song now";
OPTIONS.push(
  {
    name: "Song now: wave", category: SONG_NOW, part: "chorus3",
    desc: "Block 1 now: 2 snakes in every small ring (centric) half a lap apart, a lap every 2 bars, and a wave going round the big ring once a bar throwing them forward and stretching their tails.",
    build: () => each(all, r => {
      rainbow(r, "centric");
      segment("centric", () => cyc(8, () => [0, 0.5].forEach(a => {
        const wave = (min: number, max: number) => sin(min, max, -at(r), 2);
        addEffect({ snake_brightness: {
          head: { comb2: { f1: lap(a), amount1: 1, f2: wave(-0.3, 0.3), amount2: 1 } }, tail_length: wave(0.15, 0.5), cyclic: false,
          mult_factor_increase: L(0, 1),
        } });
      })));
    }),
  },
  {
    name: "Song now: clock hands", category: SONG_NOW, part: "chorus3",
    desc: "Block 2 now: rings 1, 4, 7, 10 are clock hands of 3 small rings (ind) ticking on every beat, a quarter round from each other; the other rings breathe on arc every 2 bars, in pairs a quarter apart, with dim confetti.",
    build: () => {
      each([1, 4, 7, 10], (r, i) => { rainbow(r, "ind"); segment("ind", () => lit(steps(TICKS(), 1 / 12, i / 4 + VAR.start), 0.25)); });
      [[2, 3], [5, 6], [8, 9], [11, 12]].forEach((rings, j) => each(rings, r => {
        rainbow(r, "ind");
        segment("arc", () => cyc(8, () => lit(sin(0, 1, -j / 4 * VAR.spread - 0.25), 0.5, false)));
        songConfetti();
      }));
    },
  },
  {
    name: "Song now: counter spirals", category: SONG_NOW, part: "chorus3",
    desc: "Block 3 now: a snake along all in every ring, a lap every 2 bars, each ring a twelfth behind, the odd rings forward and the even back, so two spirals turn against each other; dim confetti.",
    build: () => each(all, r => {
      rainbow(r, "all");
      segment("all", () => cyc(8, () => lit(lap(at(r), r % 2 ? 1 : -1), 0.5)));
      songConfetti();
    }),
  },
  {
    name: "Song now: triangle rays", category: SONG_NOW, part: "chorus3",
    desc: "Block 4 now: the triangles shoot a ray along rad, one triangle per beat, turning round the big ring; under them 3 snakes evenly round every ring (all), a lap every 2 bars.",
    build: () => each(all, r => {
      rainbow(r, "rad");
      const g = (r - 1) % 4;
      segment("rad", () => cycB(4, g, g + 2, () => lit(L(0, 1.4), 0.4, false)));
      segment("all", () => cyc(8, () => [0, 1, 2].forEach(k => lit(lap(k / 3 + VAR.start), 0.12))));
    }),
  },
);

// Party 5 as it is in the song now: dim colorful sparkles on rand on every ring all through, and every bar a group of
// rings lit bright by 2 snakes each (growing in over the bar's first beat, fading out over the next bar's first beat),
// the groups stepping round, smaller every 4 bars.
const P5_GROUPS: number[][][] = [
  [ODD, EVEN],
  [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]],
  [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]],
  [[1, 7], [2, 8], [3, 9], [4, 10]],
  [[12], [4], [8]],
];
OPTIONS.push({
  name: "Song now: sparkles and bright groups", category: SONG_NOW, part: "party5",
  desc: "Party 5 now: dim colorful sparkles on every ring, and every bar a group of rings lit bright by snakes on rand, the group stepping round and getting smaller every 4 bars: halves, squares, triangles, opposite pairs, single rings.",
  build: () => {
    each(all, r => {
      constColor({ hue: hueOf(r), sat: 1, val: 0 });
      segment("rand", () => addEffect({ position_hue: { offset_factor: { repeat: { numberOfTimes: 8, funcToRepeat: L(0, 1) } } } }));
      cyc(16, () => addEffect({ timed_hue: { offset_factor: L(0, 1) } }));
      segment("rand", () => [[4, 1], [8, -1]].forEach(([n, d]) => cyc(n, () => addEffect({
        snake_brightness: { head: lap(r / 12 + VAR.start, d), tail_length: K(0.2), cyclic: true, mult_factor_increase: sin(0, 0.3, -0.25) },
      }))));
    });
    for (let j = 0, start = S; start < E; j++, start += 4) {
      const groups = P5_GROUPS[Math.min(Math.floor(j / 4), P5_GROUPS.length - 1)];
      each(groups[j % 4 % groups.length], r => segment("rand", () => [0, 1].forEach(i => {
        const a = (r * 0.37 + i * 0.29 + 0.37 * j + VAR.start) % 1, d = ((r + i) % 2 ? 1 : -1) * VAR.dir;
        const laps = [0.5, 1, 0.75][(r + i) % 3], tail = [0.1, 0.14, 0.08][(r + 2 * i) % 3];
        const headAt = (x: number) => a + d * laps * x / 4;
        const piece = (x0: number, x1: number, l0: number, l1: number, peak = 1) => {
          if (start + x1 > E) return;
          beats(start + x0, start + x1, () => addEffect({
            snake_brightness: { head: L(headAt(x0), headAt(x1)), tail_length: L(l0, l1), cyclic: true, mult_factor_increase: L(0, peak) },
          }));
        };
        piece(0, 1, 0, tail);
        piece(1, 4, tail, tail);
        for (let k = 0; k < 4; k++) piece(4 + k / 4, 4 + (k + 1) / 4, tail * (1 - k / 4), tail * (1 - (k + 1) / 4), 1 - (k + 0.5) / 4);
      })));
    }
  },
});

// ---- The darker style: mostly dark scenes with sparse pixels here and there, mostly snakes on rand. ----

const DARK = "darker";
/** Push an option in the darker style. */
const dark = (o: Omit<Option, "style">) => OPTIONS.push({ ...o, style: DARK });
const cap = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;
/** A soft twinkle along a snake: dark at both ends, `peak` in the middle. */
const twinkle = (head: object, tail: number, peak = 1) =>
  addEffect({ snake_brightness: { head, tail_length: K(tail), cyclic: true, mult_factor_increase: sin(0, peak, -0.25) } });
// The darker options follow the hits too (the Hit picker): what they light jumps to new pixels on every hit, and
// flashes up on it.
/** Steps on every hit over a cycle of n beats (n * SPEED beats long, as cyc(n)), each `size` further on. */
const hitJumps = (n: number, size = 0.37) => steps((n * SPEED) / HIT, size, 0);
/** A head that keeps moving as `head` does and also jumps `size` on every hit (in a cycle of n beats). */
const jumpy = (head: object, n: number, size = 0.37) => ({ comb2: { f1: head, amount1: 1, f2: hitJumps(n, size), amount2: 1 } });
/** On every hit what is lit flashes to full, sinking to `low` before the next. */
const pop = (low = 0.45) => cyc(1, () => dim(L(1, low)));
/** Keep only a share `keep` of the pixels (on rand) lit, the kept share jumping to new pixels on every hit: a dark
 *  snake over the rest. */
const sparseMask = (keep: number, r: number) => segment("rand", () => cyc(4, () => addEffect({
  snake_brightness: { head: jumpy(K(at(r)), 4, 0.31), tail_length: K(1 - keep), cyclic: true, mult_factor_decrease: K(0) },
})));

// Starfields: a few snakes on rand with very short tails, so single pixels twinkle here and there.
for (const n of [1, 2, 4]) for (const [tailName, tail] of [["tiny", 0.03], ["small", 0.06]] as [string, number][]) for (const jump of [false, true]) dark({
  name: `Starfield ×${n}, ${tailName}${jump ? ", on the beat" : ""}`, category: "Dark: starfields (rand)",
  desc: `${n} twinkle snake${n > 1 ? "s" : ""} on rand, each lighting ${Math.round(tail * 100)}% of the pixels, ${jump ? "jumping to new pixels on every hit" : "crawling round once a bar and jumping on every hit"}, flashing up on the hit; each ring from its own point.`,
  build: () => each(all, r => {
    rainbow(r, "rand", 6);
    segment("rand", () => (jump ? cycHit : cyc)(4, () => { for (let j = 0; j < n; j++) twinkle(jump ? steps(4, 0.37, at(r) + j / n) : jumpy(lap(at(r) + j / n, j % 2 ? -1 : 1), 4), tail); }));
    pop();
  }),
});

// Beat sparkles: on a beat a new sparse scatter flashes on and fades out over the beat.
const SPARKLE_GROUPS: { name: string; desc: string; n: number; on: (r: number, k: number) => boolean }[] = [
  { name: "every ring", desc: "on every ring", n: 1, on: () => true },
  { name: "odd-even", desc: "the odd rings on beats 1 and 3, the even on 2 and 4", n: 2, on: (r, k) => r % 2 === (k === 0 ? 1 : 0) },
  { name: "triangles", desc: "one triangle of rings per beat, turning round", n: 4, on: (r, k) => (r - 1) % 4 === k },
];
for (const [densName, dens] of [["few", 0.04], ["some", 0.08], ["more", 0.15]] as [string, number][]) for (const grp of SPARKLE_GROUPS) dark({
  name: `Beat sparkles, ${densName}, ${grp.name}`, category: "Dark: beat sparkles",
  desc: `On the beat ${Math.round(dens * 100)}% of the pixels (rand) flash on and fade over the beat, new ones every time; ${grp.desc}.`,
  build: () => each(all, r => {
    rainbow(r, "rand", 6);
    segment("rand", () => cycHit(4, () => litFlat(steps(4, 0.37, at(r)), dens)));
    for (let k = 0; k < grp.n; k++) cycB(grp.n, k, k + 1, () => dim(grp.on(r, k) ? L(1, 0) : K(0)));
  }),
});

// Sparkling groups: one group of rings sparkles at a time (twinkles on rand), stepping round every bar; the rest dark.
const DARK_GROUPS: { name: string; groups: number[][] }[] = [
  { name: "halves", groups: [RIGHT, all.filter(r => !RIGHT.includes(r))] },
  { name: "squares", groups: SQUARES },
  { name: "triangles", groups: TRIANGLES },
  { name: "opposite pairs", groups: [[1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 12]] },
  { name: "single ring", groups: all.map(r => [r]) },
];
for (const dg of DARK_GROUPS) dark({
  name: `Sparkling ${dg.name}`, category: "Dark: sparkling groups",
  desc: `Only one group of rings (${dg.name}) sparkles at a time, twinkles on rand jumping and flashing on every hit, the next group every bar, going round; the rest stays dark.`,
  build: () => dg.groups.forEach((rings, gi) => each(rings, r => {
    rainbow(r, "rand", 6);
    segment("rand", () => cyc(2, () => [0, 0.5].forEach(a => twinkle(jumpy(lap(at(r) + a), 2), 0.08))));
    pop();
    const n = dg.groups.length;
    for (let k = 0; k < n; k++) if (k !== gi) cycB(4 * n, 4 * k, 4 * k + 4, () => dim(K(0)));
  })),
});

// Thin comets: single-pixel comets in the small rings (centric).
for (const n of [1, 2]) for (const m of SPIN_MODES.slice(0, 3)) dark({
  name: `Thin comets ×${n}, ${m.name}`, category: "Dark: thin comets",
  desc: `${n} tiny comet${n > 1 ? "s" : ""} (a pixel or two) going round every small ring once a bar, kicking a pixel forward and flashing on every hit; ${m.desc}.`,
  build: () => each(all, r => {
    rainbow(r, "centric");
    segment("centric", () => cyc(4, () => { for (let j = 0; j < n; j++) lit(jumpy(lap(m.phase(r) + j / n, m.dir(r)), 4, m.dir(r) / 12), 0.12); }));
    pop();
  }),
});

// Sparse motion: the full motions, but only a share of the pixels (a moving mask on rand) can light.
const SPARSE_MOTIONS: { name: string; seg: string; desc: string; build: (r: number) => void }[] = [
  { name: "blooms", seg: "rad", desc: "a bloom out along rad on every beat", build: () => cyc(1, () => lit(L(0, 1.4), 0.5, false)) },
  { name: "spinners", seg: "centric", desc: "two snakes spinning in every small ring", build: () => cyc(2, () => [0, 0.5].forEach(a => lit(lap(a), 0.4))) },
  { name: "comets", seg: "ind", desc: "a comet round the small rings every 2 beats", build: r => cyc(2, () => lit(lap(at(r)), 0.5)) },
  { name: "rain", seg: "updown", desc: "light falling through every ring on every beat, from the top on the hit", build: () => cyc(1, () => lit(L(1.02, -0.4), 0.5, false)) },
  { name: "spirals", seg: "all", desc: "a long comet along all, a lap every 2 bars, each ring a twelfth behind", build: r => cyc(8, () => lit(lap(at(r)), 0.5)) },
  { name: "breaths", seg: "arc", desc: "every small ring breathing out round both sides and back on every beat", build: () => cyc(1, () => lit(sin(0, 1.1, -0.25), 0.5, false)) },
];
for (const mo of SPARSE_MOTIONS) for (const [keepName, keep] of [["15%", 0.15], ["30%", 0.3]] as [string, number][]) dark({
  name: `Sparse ${mo.name}, ${keepName}`, category: "Dark: sparse motion",
  desc: `${cap(mo.desc)}, but only ${keepName} of the pixels can light (a share of rand jumping to new pixels on every hit), so it shows as scattered dots, flashing up on the hit.`,
  build: () => each(all, r => { rainbow(r, mo.seg); segment(mo.seg, () => mo.build(r)); sparseMask(keep, r); pop(); }),
});

// Fireflies and glow.
dark({
  name: "Fireflies", category: "Dark: fireflies and glow",
  desc: "A few soft dots on rand, a lap every 2 bars, two per ring going opposite ways, hopping to new pixels and glowing up a little on every hit.",
  build: () => each(all, r => {
    rainbow(r, "rand", 6);
    segment("rand", () => cyc(8, () => [1, -1].forEach((d, j) => twinkle(jumpy(lap(at(r) + j / 2, d), 8), 0.05, 0.7))));
    pop(0.6);
  }),
});
dark({
  name: "Fireflies with bar flashes", category: "Dark: fireflies and glow",
  desc: "The fireflies (hopping on every hit), and on every bar's downbeat a new 10% of the pixels flash on and fade over the beat.",
  build: () => each(all, r => {
    rainbow(r, "rand", 6);
    segment("rand", () => {
      cyc(8, () => [1, -1].forEach((d, j) => twinkle(jumpy(lap(at(r) + j / 2, d), 8), 0.05, 0.7)));
      cycB(16, 0, 1, () => addEffect({ snake_brightness: { head: steps(1, 0, at(r) + 0.5), tail_length: K(0.1), cyclic: true, mult_factor_increase: L(1, 0) } }));
      cycB(16, 4, 5, () => addEffect({ snake_brightness: { head: steps(1, 0, at(r) + 0.2), tail_length: K(0.1), cyclic: true, mult_factor_increase: L(1, 0) } }));
      cycB(16, 8, 9, () => addEffect({ snake_brightness: { head: steps(1, 0, at(r) + 0.8), tail_length: K(0.1), cyclic: true, mult_factor_increase: L(1, 0) } }));
      cycB(16, 12, 13, () => addEffect({ snake_brightness: { head: steps(1, 0, at(r) + 0.35), tail_length: K(0.1), cyclic: true, mult_factor_increase: L(1, 0) } }));
    });
  }),
});
for (const [glowName, glow] of [["faint", 0.04], ["low", 0.1]] as [string, number][]) dark({
  name: `Twinkles on a ${glowName} glow`, category: "Dark: fireflies and glow",
  desc: `A rainbow glowing at only ${Math.round(glow * 100)}%, with bright single-pixel twinkles on rand jumping to new pixels on every hit, everything pulsing on the hit.`,
  build: () => each(all, r => {
    rainbow(r, "rand", 6, 0.25, glow);
    segment("rand", () => cyc(2, () => [0, 0.33, 0.67].forEach(a => twinkle(jumpy(lap(at(r) + a), 2), 0.03))));
    pop();
  }),
});

// ---- The coloring style: warm, sunny colorings, every ring lit, still or with only a slow hue change. ----
// A coloring layer: no motion and nothing on the beat, except the versions stepping a tiny bit warmer on every beat.
// Variations shift their hues only a little (COLOR_VAR_HUE of the usual), so they stay warm.

const COLORING = "coloring";
const COLOR_VAL = 0.85, COLOR_VAR_HUE = 0.15;
/** A warm hue, shifted a little by the variation. */
const wh = (h: number) => (((h + VAR.hue * COLOR_VAR_HUE) % 1) + 1) % 1;
/** Ring r's base color. */
const warm = (hue: number, sat = 1, val = COLOR_VAL) => constColor({ hue: wh(hue), sat, val });
/** Shift the hue along a segment by f (a function of relPos). */
const hueAlong = (seg: string, f: object) => segment(seg, () => addEffect({ position_hue: { offset_factor: f } }));
/** Height of ring r on the big ring, 0 at the bottom to 1 at the top. */
const height = (r: number) => (ringY(r) + 1) / 2;
const COLORINGS: { name: string; desc: string; build: (r: number) => void }[] = [
  { name: "Sunrise rings", desc: "red-orange at the bottom of the big ring rising to yellow at the top", build: r => warm(0.01 + 0.13 * height(r)) },
  { name: "Sunset rings", desc: "yellow at the bottom of the big ring sinking to red at the top", build: r => warm(0.14 - 0.13 * height(r)) },
  { name: "Left to right", desc: "deep orange on the left of the big ring to gold on the right", build: r => warm(0.03 + 0.1 * (ringX(r) + 1) / 2) },
  { name: "Amber and gold round", desc: "amber and gold taking turns twice round the big ring, smoothly", build: r => warm(0.08 + 0.04 * Math.sin(2 * Math.PI * 2 * at(r))) },
  { name: "Sun core", desc: "every ring yellow at its inner side and red at its rim (rad)", build: () => { warm(0.13); hueAlong("rad", L(0, -0.12)); } },
  { name: "Ember core", desc: "every ring red at its inner side and gold at its rim (rad)", build: () => { warm(0.01); hueAlong("rad", L(0, 0.12)); } },
  { name: "Petals", desc: "every small ring orange at pixel 0 turning gold round both sides (arc)", build: () => { warm(0.04); hueAlong("arc", L(0, 0.1)); } },
  { name: "Warm wheel", desc: "red to yellow round the small rings of every ring (ind)", build: () => { warm(0); hueAlong("ind", L(0, 0.15)); } },
  { name: "Honey swirls", desc: "every small ring a swirl from orange to gold (centric), each ring a little further on", build: r => { warm(0.03 + 0.02 * at(r)); hueAlong("centric", L(0, 0.12)); } },
  { name: "Lit from below", desc: "a vertical gradient through every ring, red to gold (updown)", build: () => { warm(0.02); hueAlong("updown", L(0, 0.12)); } },
  { name: "Gold dots on orange", desc: "orange rings with gold dots (b1)", build: () => { warm(0.05); segment("b1", () => addEffect({ position_hue: { offset_factor: K(0.08) } })); } },
  { name: "Amber and coral rings", desc: "the odd rings amber, the even rings a soft coral", build: r => (r % 2 ? warm(0.08) : warm(0.98, 0.75)) },
  { name: "Sun and shade", desc: "the top half of the big ring yellow, the bottom half red-orange", build: r => warm(TOP.includes(r) ? 0.13 : 0.03) },
  { name: "Gold inside, red outside", desc: "the inner side of every ring gold, the outer side red (ind)", build: () => {
    warm(0.02);
    segment("ind", () => addEffect({ position_hue: { offset_factor: { comb2: { f1: INNER, amount1: 0.11, f2: K(0), amount2: 0 } } } }));
  } },
  { name: "Honey glitter", desc: "honey colors scattered pixel by pixel (rand), some paler", build: () => {
    warm(0.08);
    hueAlong("rand", sin(-0.05, 0.05, 0, 7));
    segment("rand", () => addEffect({ position_saturation: { mult_factor_decrease: sin(0.6, 1, 0, 5) } }));
  } },
  { name: "Peach", desc: "a pale peach, a little uneven pixel by pixel (rand)", build: () => { warm(0.05, 0.55); hueAlong("rand", sin(-0.02, 0.02, 0, 6)); } },
  { name: "Butter and apricot", desc: "pale butter on the odd rings, pale apricot on the even", build: r => warm(r % 2 ? 0.12 : 0.06, 0.6) },
  { name: "Rose gold", desc: "pinkish at the inner side of every ring to soft gold at its rim (rad)", build: () => { warm(0.97, 0.7); hueAlong("rad", L(0, 0.13)); } },
  { name: "Desert sand", desc: "pale sand, darker and lighter grains pixel by pixel (rand)", build: () => {
    warm(0.09, 0.5);
    segment("rand", () => addEffect({ position_brightness: { mult_factor_decrease: sin(0.65, 1, 0, 9) } }));
  } },
  { name: "Fire", desc: "red, orange and yellow scattered pixel by pixel (rand), uneven brightness", build: () => {
    warm(0.04);
    hueAlong("rand", sin(-0.04, 0.06, 0, 8));
    segment("rand", () => addEffect({ position_brightness: { mult_factor_decrease: sin(0.6, 1, 0.2, 11) } }));
  } },
];
// How the coloring changes over the part: not at all, a slow drift of the hues a little warmer and back, or a tiny
// step warmer on every beat (from a little cooler than the coloring to a little warmer).
const COLOR_MOTIONS: { name: string; category: string; desc: string; build: (r: number) => void }[] = [
  { name: "still", category: "Coloring: still", desc: "Still", build: () => undefined },
  { name: "slow drift", category: "Coloring: slow drift", desc: "The hues drift slowly a little warmer and back over the part", build: () => addEffect({ timed_hue: { offset_factor: sin(-0.025, 0.025, 0) } }) },
  { name: "steps on beats", category: "Coloring: steps on beats", desc: "The hues step a tiny bit warmer on every beat", build: () => addEffect({ timed_hue: { offset_factor: steps(TICKS(), 0.003, -0.04) } }) },
  // Moving, on every beat (or hit), keeping the coloring's hues: a little warmer or paler or darker where something passes.
  { name: "sway", category: "Coloring moving: sway", desc: "On every beat the whole coloring sways a little warmer and back", build: () =>
    cyc(1, () => addEffect({ timed_hue: { offset_factor: sin(-0.03, 0.03, 0) } })) },
  { name: "shimmer round", category: "Coloring moving: shimmer round", desc: "A soft brightness wave goes round the big ring on every beat", build: r =>
    cyc(1, () => dim(sin(0.65, 1, -at(r)))) },
  { name: "warm band", category: "Coloring moving: warm band", desc: "A slightly warmer band spins round every small ring (centric) on every beat", build: () =>
    segment("centric", () => cyc(1, () => addEffect({
      snake_hue: { head: lap(0), tail_length: K(0.5), cyclic: true, offset_factor: sin(0, -0.05, -0.25) },
    }))) },
  { name: "pale wave", category: "Coloring moving: pale wave", desc: "A paler band rolls out from the inner side to the rim of every ring (rad) on every beat", build: () =>
    segment("rad", () => cyc(1, () => addEffect({
      snake_saturation: { head: L(0, 1.4), tail_length: K(0.4), cyclic: false, mult_factor_decrease: sin(1, 0.55, -0.25) },
    }))) },
  { name: "sparkle shimmer", category: "Coloring moving: sparkle shimmer", desc: "A soft shadow drifts through the pixels in random order (rand), round on every beat", build: r =>
    segment("rand", () => cyc(1, () => addEffect({
      snake_brightness: { head: lap(at(r)), tail_length: K(0.3), cyclic: true, mult_factor_decrease: sin(1, 0.55, -0.25) },
    }))) },
];
for (const m of COLOR_MOTIONS) for (const c of COLORINGS) {
  if (m.name === "steps on beats" && !["Sunrise rings", "Sun core", "Ember core", "Petals", "Honey swirls", "Gold dots on orange", "Rose gold", "Fire"].includes(c.name)) continue;
  OPTIONS.push({
    name: `${c.name}${m.name === "still" ? "" : `, ${m.name}`}`, category: m.category, style: COLORING,
    desc: `${cap(c.desc)}. ${m.desc}.`,
    build: () => each(all, r => { c.build(r); m.build(r); }),
  });
}

// ---- The flow style: light flowing across the scene, on top of verse 2's coloring (Petals, slow drift), for its
// "light is flowing" (beats 390-400). ----

const FLOW = "flow";
/** Verse 2's coloring under the flows: every small ring orange at pixel 0 turning gold round both sides (arc),
 *  drifting slowly warmer and back. */
const flowBase = () => { warm(0.04); hueAlong("arc", L(0, 0.1)); addEffect({ timed_hue: { offset_factor: sin(-0.025, 0.025, 0) } }); };
/** How far across the installation small ring i of ring r is (0 left - 1 right), as the simulators place it: the
 *  ring's center 500 out from the middle at (r + 0.5) * 30 degrees, the small ring 100 from it at its local clock
 *  position (i + 9):30, turned with the ring. */
const smallAcross = (r: number, i: number) => {
  const A = ((r + 0.5) * Math.PI) / 6, Ai = A + Math.PI + ((((i + 9) % 12) + 0.5) * Math.PI) / 6;
  return (500 * Math.sin(A) + 100 * Math.sin(Ai) + 600) / 1200;
};
const FLOW_WAVE = 1.25;
/** Bands travelling left to right through the installation, `bands` across it at a time, one passing every FLOW_WAVE
 *  beats; every small ring timed by its own place across. `fx` adds a small ring's effect for a sin over time. */
const bandsAcross = (r: number, bands: number, fx: (wave: (min: number, max: number) => object) => void) =>
  cyc(FLOW_WAVE, () => { for (let i = 0; i < 12; i++) segment(String(i), () => fx((min, max) => sin(min, max, -bands * smallAcross(r, i)))); });
const bandBright = (wave: (min: number, max: number) => object) => dim(wave(0.35, 1));
const bandHue = (wave: (min: number, max: number) => object) => addEffect({ timed_hue: { offset_factor: wave(-0.07, 0.05) } });
const bandPale = (wave: (min: number, max: number) => object) => addEffect({ timed_saturation: { mult_factor_decrease: wave(0.25, 1) } });
/** Light draining to the right over the part (toward the door): the left rings dimming, the right ones lifting. */
const toTheDoor = (r: number) => {
  const x = (ringX(r) + 1) / 2;
  dim(L(1, 0.15 + 0.85 * x));
  lift(L(0, 0.5 * x * x * x));
};
const flowOpt = (name: string, category: string, desc: string, fx: (r: number) => void) =>
  OPTIONS.push({ name, category, style: FLOW, desc, build: () => each(all, r => { flowBase(); fx(r); }) });

for (const [chName, ch, what] of [["light", bandBright, "brighter, darker between them"], ["warmth", bandHue, "redder and back to gold"], ["pale", bandPale, "paler, almost white"]] as [string, typeof bandBright, string][])
  for (const bands of [1, 2, 3]) flowOpt(`Bands across, ${chName}, ×${bands}`, "Flow: bands across",
    `${bands} band${bands > 1 ? "s" : ""} at a time travelling left to right through the whole installation, small ring by small ring, ${what}.`,
    r => bandsAcross(r, bands, ch));
flowOpt("Bands across, light and pale", "Flow: bands across", "2 bands at a time travelling left to right, brighter and paler where they pass.",
  r => bandsAcross(r, 2, w => { bandBright(w); bandPale(w); }));
flowOpt("Bands across, light and warmth", "Flow: bands across", "2 bands at a time travelling left to right, brighter and redder where they pass.",
  r => bandsAcross(r, 2, w => { bandBright(w); bandHue(w); }));
for (const [dirName, d] of [["clockwise", 1], ["counter-clockwise", -1]] as [string, number][]) flowOpt(`Stream round, ${dirName}`, "Flow: streams and comets",
  `A bright, pale stream running round the small rings (ind) of every ring, each ring a twelfth on, so it flows on from ring to ring round the big ring ${dirName}, a lap every 2 beats.`,
  r => segment("ind", () => cyc(2, () => {
    addEffect({ snake_brightness: { head: lap(at(r), d), tail_length: K(0.5), cyclic: true, mult_factor_increase: L(0, 0.7) } });
    addEffect({ snake_saturation: { head: lap(at(r), d), tail_length: K(0.5), cyclic: true, mult_factor_decrease: L(1, 0.5) } });
  })));
for (const n of [2, 3]) for (const [lookName, pale] of [["bright", 0.8], ["pale", 0.35]] as [string, number][]) flowOpt(`Comets along all ×${n}, ${lookName}`, "Flow: streams and comets",
  `${n} comets running along all through every ring's small rings, a lap every 1.25 beats, lighting the colors ${lookName === "bright" ? "brighter" : "paler"} where they pass.`,
  () => segment("all", () => cyc(FLOW_WAVE, () => { for (let j = 0; j < n; j++) {
    addEffect({ snake_brightness: { head: lap(j / n), tail_length: K(0.25), cyclic: true, mult_factor_increase: L(0, 0.7) } });
    addEffect({ snake_saturation: { head: lap(j / n), tail_length: K(0.25), cyclic: true, mult_factor_decrease: L(1, pale) } });
  } })));
for (const [rateName, n] of [["every beat", 1], ["every half beat", 0.5]] as [string, number][]) flowOpt(`Rain, ${rateName}`, "Flow: rain, currents, ripples",
  `Bright drops falling through every ring the same way in space (updown), ${rateName}, the rest a little shaded.`,
  () => { dim(K(0.6)); segment("updown", () => cyc(n, () => lit(L(1.25, -0.3), 0.35, false, 0.9))); });
for (const [modeName, dirOf] of [["together", () => 1], ["odd-even", (r: number) => (r % 2 ? 1 : -1)]] as [string, (r: number) => number][]) flowOpt(`Currents, ${modeName}`, "Flow: rain, currents, ripples",
  `A dark current sweeping round every small ring (centric) on every beat, leaving the light to stream behind it; ${modeName === "together" ? "every ring the same way" : "the odd rings one way, the even the other"}.`,
  r => segment("centric", () => cyc(1, () => addEffect({
    snake_brightness: { head: lap(0, dirOf(r)), tail_length: K(0.5), cyclic: true, mult_factor_decrease: sin(1, 0.25, -0.25) },
  }))));
flowOpt("Ripples out", "Flow: rain, currents, ripples", "Rings of light rippling out from every ring's inner side past its rim (rad), every half beat.",
  () => segment("rad", () => cyc(0.5, () => lit(L(0, 1.4), 0.3, false, 0.6))));
flowOpt("Ripples in", "Flow: rain, currents, ripples", "Rings of light rippling in from every ring's rim to its inner side (rad), every half beat.",
  () => segment("rad", () => cyc(0.5, () => addEffect({ snake_brightness: { head: L(1.4, 0), tail_length: K(0.3), cyclic: false, mult_factor_increase: L(0.6, 0) } }))));
flowOpt("Glitter streams", "Flow: glitter", "Pale glints streaming through the pixels in random order (rand), 3 per ring, a lap every beat.",
  r => segment("rand", () => cyc(1, () => [0, 1 / 3, 2 / 3].forEach(a => addEffect({
    snake_saturation: { head: lap(at(r) + a), tail_length: K(0.05), cyclic: true, mult_factor_decrease: sin(1, 0.15, -0.25) },
  })))));
flowOpt("Warm sparkles", "Flow: glitter", "Pixels flickering redder and back in random order (rand), round every beat.",
  r => segment("rand", () => cyc(1, () => addEffect({ snake_hue: { head: lap(at(r)), tail_length: K(0.25), cyclic: true, offset_factor: sin(0, -0.08, -0.25) } }))));
flowOpt("Light dust", "Flow: glitter", "Bright specks of light streaming through the pixels (rand), 4 per ring, a lap every beat, on a slightly shaded scene.",
  r => { dim(K(0.7)); segment("rand", () => cyc(1, () => [0, 0.25, 0.5, 0.75].forEach(a => twinkle(lap(at(r) + a), 0.04)))); });
flowOpt("Spiral flow, light", "Flow: spirals", "A long bright comet along all in every ring, each ring a twelfth behind, a lap every 2 beats: light spiraling round the big ring.",
  r => segment("all", () => cyc(2, () => lit(lap(at(r)), 0.5, true, 0.7))));
flowOpt("Spiral flow, shade", "Flow: spirals", "A long soft shadow along all in every ring, each ring a twelfth behind, a lap every 2 beats, so the light spirals between the shadows.",
  r => segment("all", () => cyc(2, () => addEffect({ snake_brightness: { head: lap(at(r)), tail_length: K(0.5), cyclic: true, mult_factor_decrease: sin(1, 0.3, -0.25) } }))));
flowOpt("Whole-ring waves", "Flow: spirals", "Whole rings brightening in a wave from left to right, one every 1.25 beats (the first flow).",
  r => cyc(FLOW_WAVE, () => dim(sin(0.45, 1, -(ringX(r) + 1) / 2))));
flowOpt("To the door, light bands", "Flow: to the door", "2 light bands travelling left to right, and the light draining to the right over the part: the left dimming, the right lifting.",
  r => { bandsAcross(r, 2, bandBright); toTheDoor(r); });
flowOpt("To the door, warm bands", "Flow: to the door", "2 warmth bands travelling left to right, with the light draining to the right over the part.",
  r => { bandsAcross(r, 2, bandHue); toTheDoor(r); });
flowOpt("To the door, comets", "Flow: to the door", "2 bright comets along all in every ring, with the light draining to the right over the part.",
  r => { segment("all", () => cyc(FLOW_WAVE, () => [0, 0.5].forEach(a => lit(lap(a), 0.25, true, 0.7)))); toTheDoor(r); });

// ---- Role overlays: on top of the mix picked for a part, effects that show the roles of its bars. ----
// The bars of a part have roles, A or B, in a pattern repeating every 4 bars from the part's start (ROLE_PATTERNS,
// "AAAB": 3 bars of A, then a bar of B). An overlay highlights them: a group of rings chosen by the role lit up at
// the start of the bar, a sweep turning one way or the other, other colors or white during B. Overlays stay on the
// beat (the part's own bars), whatever the hit timing of the options under them.

type Role = "A" | "B";
const ROLE_PATTERNS = ["AAAB", "AABB", "ABAB", "ABBB"];
interface Overlay { name: string; desc: string; build: (roleOf: (bar: number) => Role) => void }
const OVERLAYS: Overlay[] = [];
const OVERLAY_LIFT = 0.4;
/** Run cb for every bar of the part being built: its index, start and end beats, and role. */
const forBars = (roleOf: (bar: number) => Role, cb: (j: number, from: number, to: number, role: Role) => void) => {
  for (let j = 0, from = PART_S; from < PART_E; j++, from += 4) cb(j, from, Math.min(from + 4, PART_E), roleOf(j));
};
/** Light `rings` up by `amount`, fading out over `beats` beats from `from`. */
const liftAt = (rings: number[], from: number, length: number, amount = OVERLAY_LIFT) =>
  elements(rings, () => beats(from, from + length, () => lift(L(amount, 0))));
const TOP = [9, 10, 11, 12, 1, 2], BOTTOM = [3, 4, 5, 6, 7, 8], LEFT = [6, 7, 8, 9, 10, 11], X = [1, 4, 7, 10];
const ROLE_GROUPS: { name: string; A: number[]; B: number[] }[] = [
  { name: "odd / even", A: ODD, B: EVEN },
  { name: "right / left", A: RIGHT, B: LEFT },
  { name: "top / bottom", A: TOP, B: BOTTOM },
  { name: "square / the rest", A: X, B: all.filter(r => !X.includes(r)) },
];
for (const grp of ROLE_GROUPS) {
  OVERLAYS.push({
    name: `Role start lift, ${grp.name}`,
    desc: `On the first 2 beats of every bar, the rings of its role light up and fade: A the ${grp.name.split(" / ")[0]} rings, B the ${grp.name.split(" / ")[1]}.`,
    build: roleOf => forBars(roleOf, (_, from, to, role) => liftAt(role === "A" ? grp.A : grp.B, from, Math.min(2, to - from))),
  });
  OVERLAYS.push({
    name: `Role glow, ${grp.name}`,
    desc: `All through every bar the rings of its role glow, brightest at the start: A the ${grp.name.split(" / ")[0]} rings, B the ${grp.name.split(" / ")[1]}.`,
    build: roleOf => forBars(roleOf, (_, from, to, role) =>
      elements(role === "A" ? grp.A : grp.B, () => beats(from, to, () => lift(L(0.35, 0.08))))),
  });
}
for (const grp of ROLE_GROUPS.slice(0, 2)) OVERLAYS.push({
  name: `Role change lift, ${grp.name}`,
  desc: `Only where the role changes (and at the start), the new role's rings light up over 2 beats: A the ${grp.name.split(" / ")[0]} rings, B the ${grp.name.split(" / ")[1]}.`,
  build: roleOf => forBars(roleOf, (j, from, to, role) => {
    if (j === 0 || roleOf(j - 1) !== role) liftAt(role === "A" ? grp.A : grp.B, from, Math.min(2, to - from), 0.5);
  }),
});
OVERLAYS.push({
  name: "Sweep by role",
  desc: "A band of light goes round the big ring once every bar, clockwise in A bars and counter-clockwise in B bars.",
  build: roleOf => forBars(roleOf, (_, from, to, role) => all.forEach(r => elements([r], () => beats(from, to, () => {
    const x = role === "A" ? (r - 1) / 12 : ((13 - r) % 12) / 12;
    lift({ fixed_window: { start: x, end: x + 0.2, cyclic: true, outside_value: 0, func: sin(0, 0.4, -0.25) } });
  })))),
});
OVERLAYS.push({
  name: "Colors by role",
  desc: "B bars take the opposite colors (the hue half way round) and light up a little on their first 2 beats; A bars as they are.",
  build: roleOf => forBars(roleOf, (_, from, to, role) => {
    if (role !== "B") return;
    elements(all, () => beats(from, to, () => addEffect({ timed_hue: { offset_factor: K(0.5) } })));
    liftAt(all, from, Math.min(2, to - from), 0.25);
  }),
});
OVERLAYS.push({
  name: "White B",
  desc: "B bars start white: on their first 2 beats every ring lights up pale and the color comes back as it fades.",
  build: roleOf => forBars(roleOf, (_, from, to, role) => {
    if (role !== "B") return;
    elements(all, () => beats(from, from + Math.min(2, to - from), () => {
      addEffect({ timed_saturation: { mult_factor_decrease: L(0.15, 1) } });
      lift(L(0.45, 0));
    }));
  }),
});
OVERLAYS.push({
  name: "Spinner by role",
  desc: "A thin extra comet in every small ring (centric), a lap a bar, clockwise in A bars and back in B bars.",
  build: roleOf => forBars(roleOf, (_, from, to, role) => elements(all, () => beats(from, to, () => segment("centric", () =>
    addEffect({ snake_brightness: { head: role === "A" ? L(0, 1) : L(1, 0), tail_length: K(0.15), cyclic: true, mult_factor_increase: L(0, 0.6) } }))))),
});
OVERLAYS.push({
  name: "Inner / outer by role",
  desc: "On the first 2 beats of every bar one side of every big ring lights up: the inner side in A bars, the outer side in B bars.",
  build: roleOf => forBars(roleOf, (_, from, to, role) => elements(all, () => segment("ind", () => {
    const side = role === "A" ? INNER : OUTER;
    const scaled = (v: number) => ({ comb2: { f1: side, amount1: v, f2: K(0), amount2: 0 } });
    beats(from, from + 1, () => addEffect({ position_brightness: { mult_factor_increase: scaled(0.4) } }));
    if (to - from > 1) beats(from + 1, from + 2, () => addEffect({ position_brightness: { mult_factor_increase: scaled(0.15) } }));
  }))),
});
OVERLAYS.push({
  name: "Burst at role change",
  desc: "Where the role changes, a burst of white sparkles on every ring (rand) for 2 beats, jumping every half beat.",
  build: roleOf => forBars(roleOf, (j, from, to, role) => {
    if (j > 0 && roleOf(j - 1) === role) return;
    elements(all, () => beats(from, from + Math.min(2, to - from), () => segment("rand", () => cycle(2, () => {
      addEffect({ snake_brightness: { head: { steps: { num_steps: 4, diff_per_step: 0.37, first_step_value: 0.1 } }, tail_length: K(0.12), cyclic: true, mult_factor_increase: K(0.9) } });
      addEffect({ snake_saturation: { head: { steps: { num_steps: 4, diff_per_step: 0.37, first_step_value: 0.1 } }, tail_length: K(0.12), cyclic: true, mult_factor_decrease: K(0) } });
    }))));
  }),
});

// Fades: a role's group lit up at the start of its bar (as the role glow), fading out in different ways.
const FADES: { name: string; desc: string; build: (rings: number[], from: number, to: number) => void }[] = [
  { name: "fast fade", desc: "flashes up and fades out within the first beat", build: (rings, from) => liftAt(rings, from, 1, 0.55) },
  { name: "beat steps", desc: "lit up and stepping down a notch on every beat of the bar", build: (rings, from, to) => {
    for (let k = 0; k < to - from; k++) elements(rings, () => beats(from + k, from + k + 1, () => lift(K([0.5, 0.3, 0.15, 0.05][k] ?? 0))));
  } },
  { name: "beat echoes", desc: "flashing on every beat of the bar, each flash fainter, like an echo", build: (rings, from, to) => {
    for (let k = 0; k < to - from; k++) liftAt(rings, from + k, 1, 0.55 * Math.pow(0.5, k));
  } },
  { name: "snake retreat", desc: "lit all round, the light then retreating round the small rings (ind) over the bar", build: (rings, from, to) =>
    elements(rings, () => beats(from, to, () => segment("ind", () => addEffect({
      snake_brightness: { head: K(1.01), tail_length: L(1.02, 0), cyclic: false, mult_factor_increase: K(0.45) },
    })))) },
  { name: "snakes spin out", desc: "two snakes spinning in every small ring (centric), long at the start and shrinking away over the bar", build: (rings, from, to) =>
    elements(rings, () => beats(from, to, () => segment("centric", () => [0, 0.5].forEach(a => addEffect({
      snake_brightness: { head: L(a, a + 1), tail_length: L(0.5, 0), cyclic: true, mult_factor_increase: L(0, 0.7) },
    }))))) },
  { name: "comets", desc: "bright comets racing round every small ring (centric) for the first 2 beats, a lap a beat", build: (rings, from, to) =>
    elements(rings, () => beats(from, from + Math.min(2, to - from), () => segment("centric", () => cycle(1, () => [0, 0.5].forEach(a =>
      addEffect({ snake_brightness: { head: L(a, a + 1), tail_length: K(0.3), cyclic: true, mult_factor_increase: L(0, 0.8) } })))))) },
  { name: "dissolve", desc: "lit up, then dissolving pixel by pixel in random order (rand) over the bar", build: (rings, from, to) =>
    elements(rings, () => beats(from, to, () => segment("rand", () => addEffect({
      snake_brightness: { head: K(1.01), tail_length: L(1.02, 0), cyclic: false, mult_factor_increase: K(0.45) },
    })))) },
  { name: "collapse to the core", desc: "lit up, then drawn in from the outer side to the inner side (rad) over the bar", build: (rings, from, to) =>
    elements(rings, () => beats(from, to, () => segment("rad", () => addEffect({
      snake_brightness: { head: L(1.01, 0), tail_length: L(1.02, 0.01), cyclic: false, mult_factor_increase: K(0.45) },
    })))) },
  { name: "ripple out", desc: "a ring of light rippling out from the inner side past the outer side (rad) over the first 2 beats", build: (rings, from, to) =>
    elements(rings, () => beats(from, from + Math.min(2, to - from), () => segment("rad", () => addEffect({
      snake_brightness: { head: L(0, 1.5), tail_length: K(0.5), cyclic: false, mult_factor_increase: L(0, 0.7) },
    })))) },
  { name: "sparkle tail", desc: "a flash on the first beat leaving sparkles (rand) that jump on every beat and fade out over the bar", build: (rings, from, to) => {
    liftAt(rings, from, 1, 0.5);
    for (let k = 0; k < to - from; k++) elements(rings, () => beats(from + k, from + k + 1, () => segment("rand", () =>
      twinkle({ const_value: { value: (0.13 + 0.37 * k) % 1 } }, 0.12, 0.8 * Math.pow(0.6, k)))));
  } },
];
for (const grp of [ROLE_GROUPS[3], ROLE_GROUPS[0]]) for (const f of FADES) OVERLAYS.push({
  name: `Fade: ${f.name}, ${grp.name}`,
  desc: `At the start of every bar the rings of its role (A the ${grp.name.split(" / ")[0]} rings, B the ${grp.name.split(" / ")[1]}): ${f.desc}.`,
  build: roleOf => forBars(roleOf, (_, from, to, role) => f.build(role === "A" ? grp.A : grp.B, from, to)),
});

// Chorus 3's accents, on top of every option in the chorus: a small lift on every beat and a flash on every bar's
// downbeat.
const CHORUS3_BEAT = 0.15, CHORUS3_BAR = 0.5;
let ACCENTS = true;
const accents = () => elements(all, () => beats(PART_S, PART_E, () => {
  cycleBeats(1, 0, 0.5, () => addEffect({ timed_brightness: { mult_factor_increase: L(CHORUS3_BEAT, 0) } }));
  cycleBeats(4, 0, 1, () => addEffect({ timed_brightness: { mult_factor_increase: L(CHORUS3_BAR, 0) } }));
}));

// The variations of every option: the same animation, turned, moved, mirrored or phased a little differently, each
// with its own colors too, so they differ even where an option has nothing to turn or phase.
const VARIATIONS: { name: string; v: Partial<typeof VAR> }[] = [
  { name: "original", v: {} },
  { name: "turning back, colors a little on", v: { dir: -1, hue: 0.08 } },
  { name: "rotated, colors a quarter round", v: { rot: 3, hue: 0.25 } },
  { name: "mirrored, colors a little back", v: { mirror: true, hue: -0.08 } },
  { name: "phase the other way, colors a sixth round", v: { spread: -1, hue: 0.17 } },
  { name: "from the opposite point, colors half round", v: { start: 0.5, hue: 0.5 } },
  { name: "double twist, colors a sixth back", v: { spread: 2, hue: -0.17 } },
  { name: "turning back, mirrored, colors a third round", v: { dir: -1, mirror: true, hue: 0.33 } },
];
const SPEEDS: [string, number][] = [["slow", 2], ["medium", 1], ["fast", 0.5]];
// When the beat-level hits fall.
const HITS: { name: string; hit: number; off: number }[] = [
  { name: "beat", hit: 1, off: 0 },
  { name: "offbeat", hit: 1, off: 0.5 },
  { name: "twice a beat", hit: 0.5, off: 0 },
  { name: "two beats", hit: 2, off: 0 },
];
const BASE_VAR = { ...VAR };
const optionsOf = (part: Part) => OPTIONS.filter(o => !o.part || o.part === part.key);
const partOf = (key: string) => PARTS.find(p => p.key === key) ?? PARTS[0];
const styleOf = (o: Option) => o.style ?? (o.category === SONG_NOW ? "any" : "full");

/** What the gallery shows for a part: its beats and blocks, the pickers, and its options (without sequences). */
export function meta(partKey: string) {
  const part = partOf(partKey), options = optionsOf(part);
  return {
    song: "shemesh", part: part.key, title: part.title, audio: song.audioFilePath, beats: song.beatTimestampsMs as number[],
    startBeat: part.start, endBeat: part.end, playFrom: part.playFrom, playTo: part.end, blocks: blocksOf(part),
    // What the part is in the song now, for the blocks without a candidate.
    current: "shemesh.sequence.json",
    // The parts with a gallery, to switch between them.
    parts: PARTS.map(({ key, title }) => ({ key, title })),
    speeds: SPEEDS.map(([name]) => name), hits: HITS.map(h => h.name), variations: VARIATIONS.map(v => v.name),
    // The styles to pick from, and the one the part opens with.
    styles: ["full", "darker", COLORING, FLOW], style: part.style,
    // The categories in the order the gallery shows them: the song as it is now first.
    categories: [SONG_NOW, ...new Set(options.map(o => o.category).filter(c => c !== SONG_NOW))],
    options: options.map(o => ({ name: o.name, category: o.category, desc: o.desc, style: styleOf(o) })),
    // The role overlays, and the role patterns to pick from.
    overlays: OVERLAYS.map(o => ({ name: o.name, desc: o.desc })), roles: ROLE_PATTERNS,
  };
}

/** The sequences of the part's options `indices`, at a speed, hit timing and variation (by name, or index for the
 *  variation). Full options get the part's accents; the darker ones not, they would light them up. */
export function build(partKey: string, indices: number[], speed: string, hit: string, variation: number) {
  const part = partOf(partKey), options = optionsOf(part);
  const h = HITS.find(x => x.name === hit) ?? HITS[0];
  SPEED = SPEEDS.find(([name]) => name === speed)?.[1] ?? 1;
  HIT = h.hit; OFF = h.off;
  PART_S = part.start; PART_E = part.end;
  S = part.start + OFF; E = part.end + OFF; BEATS = E - S;
  ACCENTS = part.accents;
  VAR = { ...BASE_VAR, ...(VARIATIONS[variation]?.v ?? {}) };
  const out = indices.map(i => {
    const o = options[i];
    if (!o) return null;
    const anim = new Animation("shemesh", song.bpm, song.lengthSeconds, 0, song.beatTimestampsMs);
    anim.sync(() => { o.build(); if (ACCENTS && styleOf(o) !== DARK) accents(); });
    return anim.getSequence();
  });
  VAR = { ...BASE_VAR };
  return out;
}

/** An option picked in the gallery for a block: by name, with its variation (index), speed and hit timing. */
export interface MixPick { option: string; variation?: number; speed: string; hit: string }

/**
 * Add the options picked for a part's blocks (by block index) to the song being built, each over its own block (from
 * the block's first hit, so half a beat late on the off-beat). Call it inside the song's sync, after what plays under
 * the blocks: every option starts from its own colors on every ring, so it covers what came before. No accents; the
 * song adds its own. With `tail`, the last block runs on that many beats past the part (for a fade-out).
 */
export function galleryMix(partKey: string, picks: Record<number, MixPick>, opts: { tail?: number } = {}) {
  const part = partOf(partKey), options = optionsOf(part), blocks = blocksOf(part);
  Object.entries(picks).sort(([a], [b]) => Number(a) - Number(b)).forEach(([k, pick]) => {
    const o = options.find(x => x.name === pick.option);
    if (!o) throw new Error(`galleryMix: no option "${pick.option}" in ${part.title}`);
    const [from, blockEnd] = blocks[Number(k)];
    // The last block runs on `tail` beats past the part, for the song to fade it out.
    const to = blockEnd === part.end ? blockEnd + (opts.tail ?? 0) : blockEnd;
    const h = HITS.find(x => x.name === pick.hit) ?? HITS[0];
    SPEED = SPEEDS.find(([name]) => name === pick.speed)?.[1] ?? 1;
    HIT = h.hit; OFF = h.off;
    S = from + OFF; E = to + OFF; BEATS = E - S;
    VAR = { ...BASE_VAR, ...(VARIATIONS[pick.variation ?? 0]?.v ?? {}) };
    o.build();
  });
  VAR = { ...BASE_VAR };
}

/** Add one option picked for a part over any beats `from` - `to` (not a whole block), e.g. to change its speed for a
 *  few beats: call it after what plays under it, as galleryMix. With `hue`, its rainbow colors all take that hue. */
export function galleryRange(partKey: string, pick: MixPick, from: number, to: number, opts: { hue?: number } = {}) {
  const o = optionsOf(partOf(partKey)).find(x => x.name === pick.option);
  if (!o) throw new Error(`galleryRange: no option "${pick.option}"`);
  const h = HITS.find(x => x.name === pick.hit) ?? HITS[0];
  SPEED = SPEEDS.find(([name]) => name === pick.speed)?.[1] ?? 1;
  HIT = h.hit; OFF = h.off;
  S = from + OFF; E = to + OFF; BEATS = E - S;
  VAR = { ...BASE_VAR, ...(VARIATIONS[pick.variation ?? 0]?.v ?? {}) };
  HUE_OVERRIDE = opts.hue ?? null;
  o.build();
  HUE_OVERRIDE = null;
  VAR = { ...BASE_VAR };
}

/** The role overlays picked for a part: for each block (by index) the overlays used together in it, by name, or
 *  `options` for every block; with their role pattern ("AAAB": the roles of every 4 bars, from the part's start). */
export interface OverlayPick { blocks?: Record<number, string[]>; options?: string[]; roles: string }

/** Add role overlays to the song being built, each over its blocks; call it after the part's mix. */
export function galleryOverlay(partKey: string, pick: OverlayPick) {
  const part = partOf(partKey), blocks = blocksOf(part);
  const roleAt = (bar: number): Role => (pick.roles[bar % pick.roles.length] === "B" ? "B" : "A");
  VAR = { ...BASE_VAR };
  blocks.forEach(([from, to], k) => {
    const names = [...(pick.options ?? []), ...(pick.blocks?.[k] ?? [])];
    for (const name of new Set(names)) {
      const o = OVERLAYS.find(x => x.name === name);
      if (!o) throw new Error(`galleryOverlay: no overlay "${name}"`);
      // The block's bars, with the roles of their place in the part.
      PART_S = from; PART_E = to;
      const firstBar = (from - part.start) / 4;
      o.build(j => roleAt(firstBar + j));
    }
  });
  PART_S = part.start; PART_E = part.end;
}

/** The part's mix (picks by block) with the overlays used per block (`used`, overlay indices by block) and then each
 *  of the overlays `indices` over the whole part on top (-1 for none), at a role pattern. */
export function buildOverlays(partKey: string, picks: Record<number, MixPick>, indices: number[], roles: string, used: Record<number, number[]> = {}) {
  const nameOf = (k: number) => OVERLAYS[k]?.name;
  const usedNames = Object.fromEntries(Object.entries(used).map(([k, list]) => [k, list.map(nameOf).filter(Boolean) as string[]]));
  return indices.map(i => {
    if (i !== -1 && !OVERLAYS[i]) return null;
    const anim = new Animation("shemesh", song.bpm, song.lengthSeconds, 0, song.beatTimestampsMs);
    anim.sync(() => {
      galleryMix(partKey, picks);
      galleryOverlay(partKey, { blocks: usedNames, roles });
      // The card's own overlay over the whole part, but not again in the blocks that already use it.
      if (i !== -1) {
        const blocksWithout = Object.fromEntries(blocksOf(partOf(partKey)).map((_, k) =>
          [k, (used[k] ?? []).includes(i) ? [] : [OVERLAYS[i].name]]));
        galleryOverlay(partKey, { blocks: blocksWithout, roles });
      }
    });
    return anim.getSequence();
  });
}

if (require.main === module) {
  if (process.argv.includes("--serve")) {
    // One JSON request per line on stdin, { id, op: "meta" | "build", ... }; one JSON answer per line on stdout.
    const rl = require("readline").createInterface({ input: process.stdin });
    rl.on("line", (line: string) => {
      let id;
      try {
        const req = JSON.parse(line);
        id = req.id;
        const result = req.op === "meta" ? meta(req.part)
          : req.op === "overlay" ? buildOverlays(req.part, req.mix ?? {}, req.indices, req.roles ?? ROLE_PATTERNS[0], req.used ?? {})
          : build(req.part, req.indices, req.speed, req.hit, req.variation ?? 0);
        process.stdout.write(JSON.stringify({ id, result }) + "\n");
      } catch (e) {
        process.stdout.write(JSON.stringify({ id, error: String(e) }) + "\n");
      }
    });
  } else {
    for (const part of PARTS) {
      const m = meta(part.key), t = Date.now();
      build(part.key, m.options.map((_, i) => i), "medium", "beat", 0);
      console.log(`${part.title}: ${m.options.length} options × ${SPEEDS.length} speeds × ${HITS.length} hit timings × ${VARIATIONS.length} variations (all built in ${Date.now() - t} ms at one setting)`);
    }
  }
}
