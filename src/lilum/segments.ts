// Push the Lilum object's segment definitions to led-object-service.
// Lilum thing has 27 animation pixels in 3 concentric rings of 9. Data line
// starts at the outer ring (verified empirically with yarn lilum-diag):
//   outer  = indices 0..8
//   middle = indices 9..17
//   inner  = indices 18..26
// Pixel 0 of the physical strip is a status LED and is NOT part of these
// indices (the firmware already strips it before exposing the buffer).
//
// Besides the lilum-only segments (outer/middle/inner), we define every
// segment name the ring object has (all/centric/ind/arc/updown/rad/b1/b2/rand and
// the single small-ring segments "0".."11"), so a pendant can mirror a ring's
// animation (see Animation.mirrorToLilum). A name missing here makes the
// pendant reject the whole sequence ("segment name not found in store").
// The definitions follow the ring's segments.json in what they do on the
// object (direction of travel, which part lights first), using the pendant's
// physical layout below rather than its raw index order.

import axios from "axios";
import { LEDS_OBJECT_SERVICE_IP, LEDS_OBJECT_SERVICE_PORT } from "../sys-config/sys-config";

// Pendants with identical hardware/segments, named to mirror their ring
// (lilumN mirrors ring N). A pendant without a pushed segment map fails to
// decode its sequence with "segment name not found in store", so push the map
// for every ring number the UI allows mirroring (1..12, see ui/src/App.tsx).
const MAX_RING = 12;
const THING_NAMES = Array.from({ length: MAX_RING }, (_, i) => `lilum${i + 1}`);
const NUM_RINGS = 3;
const PIXELS_PER_RING = 9;
const NUM_PIXELS = NUM_RINGS * PIXELS_PER_RING; // 27

interface Pixel { index: number; relPos: number; }
interface Segment { name: string; pixels: Pixel[]; }

// Index i belongs to ring floor(i / PIXELS_PER_RING) (0=outer,1=middle,2=inner)
// at within-ring position i % PIXELS_PER_RING.
const ringOf = (i: number) => Math.floor(i / PIXELS_PER_RING);
const posInRing = (i: number) => i % PIXELS_PER_RING;

// ---------------------------------------------------------------------------
// Physical layout (inferred from the firmware's 7-column table, SINELON_VCOLS
// in Lilum-pendant-ESP32C3 lib/led_engine/led_engine.cpp, then mirrored to
// match what the real pendant does): each ring has 9 pixels 40° apart, and
// index order runs clockwise, like the ring object's pixels
// (ui/src/components/RingVisualizationCanvas.tsx).
//
// Angles: degrees, counter-clockwise, 0° = 3 o'clock, pendant hanging normally
// (outer pixel 4 and inner pixel 22 at the bottom, middle pixel 9 at the top).
// If top and bottom turn out swapped on the real pendant, set this to 180.
// ---------------------------------------------------------------------------
const PENDANT_ROTATION_DEG = 0;
const RING_RADIUS = [1, 2 / 3, 1 / 3]; // outer, middle, inner

const angleOf = (i: number) => {
    const k = posInRing(i);
    const base = ringOf(i) === 1 ? 90 - 40 * k : 270 - 40 * (k - 4);
    return (((base + PENDANT_ROTATION_DEG) % 360) + 360) % 360;
};
const xOf = (i: number) => RING_RADIUS[ringOf(i)] * Math.cos((angleOf(i) * Math.PI) / 180);
const yOf = (i: number) => RING_RADIUS[ringOf(i)] * Math.sin((angleOf(i) * Math.PI) / 180);

// Clockwise step within the pixel's ring from its first pixel (index order).
const cwStep = (i: number) => posInRing(i);

const round2 = (v: number) => Math.round(v * 100) / 100;

const segmentFrom = (name: string, relPosOf: (i: number) => number): Segment => {
    const pixels: Pixel[] = [];
    for (let i = 0; i < NUM_PIXELS; i++) pixels.push({ index: i, relPos: relPosOf(i) });
    return { name, pixels };
};

const ringSegment = (name: string, first: number, last: number): Segment => {
    const span = last - first;
    const pixels: Pixel[] = [];
    for (let i = first; i <= last; i++) {
        pixels.push({ index: i, relPos: span === 0 ? 0 : (i - first) / span });
    }
    return { name, pixels };
};

// all: 0..1 clockwise round the outer ring, then the middle, then the inner,
// like the ring object (clockwise round each small ring in turn). Checked on
// the real pendant.
const allSegment = () =>
    segmentFrom("all", (i) => (ringOf(i) * PIXELS_PER_RING + cwStep(i)) / (NUM_PIXELS - 1));

// centric: 0..(n-1)/n clockwise round each ring, same pattern in all three
// (checked on the real pendant against the rings).
const centricSegment = () =>
    segmentFrom("centric", (i) => cwStep(i) / PIXELS_PER_RING);

// The ring object's 12 small rings, laid onto the pendant: small ring s owns the
// 30° sector centred SMALL_RING_0_DEG - 30*s (clockwise round the pendant), so
// all three pendant rings light by sector the way the small rings do round the
// big circle (checked on the real pendant). Small ring 0 sits at 8 o'clock;
// change SMALL_RING_0_DEG to start elsewhere.
const SMALL_RINGS = 12;
const SMALL_RING_0_DEG = 210; // 8 o'clock
const smallRingOf = (i: number) => {
    const frac = ((((SMALL_RING_0_DEG - angleOf(i)) % 360) + 360) % 360) / 360;
    return Math.round(frac * SMALL_RINGS) % SMALL_RINGS;
};

// ind: on the ring object, one value per small ring, starting at physical
// small ring IND_FIRST_SMALL_RING and increasing clockwise in steps of 1/11
// (src/ring-segments/segments.json). Same here, by sector.
const IND_FIRST_SMALL_RING = 3;
const indSegment = () =>
    segmentFrom("ind", (i) => {
        const pos = (smallRingOf(i) - IND_FIRST_SMALL_RING + SMALL_RINGS) % SMALL_RINGS;
        return round2(pos / (SMALL_RINGS - 1));
    });

// rad: on the ring object, a straight gradient across the whole ring, 0 on the
// side facing the installation's centre (between small rings 2 and 3) and 1 on
// the outer side (between 8 and 9). Same here, across the pendant, towards the
// sector midway between small rings 2 and 3.
const RAD_INNER_DEG = SMALL_RING_0_DEG - 2.5 * (360 / SMALL_RINGS); // 10:30
const radSegment = () => {
    const a = (RAD_INNER_DEG * Math.PI) / 180;
    const ds = Array.from({ length: NUM_PIXELS }, (_, i) => xOf(i) * Math.cos(a) + yOf(i) * Math.sin(a));
    const inner = Math.max(...ds), outer = Math.min(...ds);
    return segmentFrom("rad", (i) => round2((inner - ds[i]) / (inner - outer)));
};

// arc: on the ring object it runs from each small ring's side facing the big
// circle's centre (0) to its outer side (6/7). Here: inner ring 0, middle
// 3/7, outer 6/7, same range.
const ARC_BY_RING = [6 / 7, 3 / 7, 0]; // outer, middle, inner
const arcSegment = () => segmentFrom("arc", (i) => ARC_BY_RING[ringOf(i)]);

// updown: top (0) to bottom (1) of the pendant by physical height.
const updownSegment = () => {
    const ys = Array.from({ length: NUM_PIXELS }, (_, i) => yOf(i));
    const top = Math.max(...ys), bottom = Math.min(...ys);
    return segmentFrom("updown", (i) => round2((top - ys[i]) / (top - bottom)));
};

// "0".."11": the ring object's single small-ring segments. Segment s is
// physical small ring (s + 3) % 12 (the small ring at ind position s); it maps
// to lilum ring s % 3 (0 = outer, 1 = middle, 2 = inner), which is the same as
// (s + 3) % 3, same direction as centric (on the ring object it is exactly
// centric restricted to one small ring).
const smallRingSegment = (s: number): Segment => {
    const ring = s % NUM_RINGS;
    const pixels: Pixel[] = [];
    for (let i = ring * PIXELS_PER_RING; i < (ring + 1) * PIXELS_PER_RING; i++) {
        pixels.push({ index: i, relPos: cwStep(i) / PIXELS_PER_RING });
    }
    return { name: String(s), pixels };
};

// b1 / b2: two interleaved buckets (every other pixel), all relPos 0. Used as
// static masks; b1 = even indices, b2 = odd indices.
const bucketSegment = (name: string, parity: number): Segment => {
    const pixels: Pixel[] = [];
    for (let i = 0; i < NUM_PIXELS; i++) if (i % 2 === parity) pixels.push({ index: i, relPos: 0 });
    return { name, pixels };
};

// rand: deterministic shuffle of relPos values so the pattern is reproducible
// across syncs. Mulberry32 PRNG seeded with a constant.
const randSegment = (): Segment => {
    let s = 0x9e3779b9;
    const rng = () => {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pixels: Pixel[] = [];
    for (let i = 0; i < NUM_PIXELS; i++) pixels.push({ index: i, relPos: Math.round(rng() * 100) / 100 });
    return { name: "rand", pixels };
};

const payload = {
    numberOfPixels: NUM_PIXELS,
    segments: [
        allSegment(),
        ringSegment("outer",  0,  8),
        ringSegment("middle", 9, 17),
        ringSegment("inner", 18, 26),
        centricSegment(),
        indSegment(),
        arcSegment(),
        updownSegment(),
        radSegment(),
        bucketSegment("b1", 0),
        bucketSegment("b2", 1),
        randSegment(),
        ...Array.from({ length: SMALL_RINGS }, (_, s) => smallRingSegment(s)),
    ],
};

(async () => {
    for (const thing of THING_NAMES) {
        const url = `http://${LEDS_OBJECT_SERVICE_IP}:${LEDS_OBJECT_SERVICE_PORT}/thing/${thing}`;
        try {
            const res = await axios.put(url, payload, { timeout: 5000 });
            console.log(`Lilum segments synced -> ${url}, status: ${res.status}`);
        } catch (err) {
            console.error(`Error syncing segments for ${thing}:`, err);
            process.exit(1);
        }
    }
})();
