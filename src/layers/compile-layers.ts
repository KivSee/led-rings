// Turns a song's <song>.layers.json (made in the Song Sync tool, ui/sync.html) into effects on the 12 d1 rings.
// Call addLayers() inside anim.sync(). Per ring, the effects come in layer order: coloring sections, coloring
// overrides, background, motion, transition (docs/layer-options.md). Each lane follows its doc:
// docs/coloring-layer.md, docs/background-layer.md, docs/motion-layer.md, docs/transition-layer.md.
import { addEffect } from "../effects/effect";
import { elements, segment } from "../objects/elements";
import { beats, cycle } from "../time/time";
import {
  customLayout,
  evalFn,
  K,
  layoutById,
  LINEAR,
  mapLeaves,
  type CustomSpec,
  type FloatFn,
  type Layout,
} from "../../shared/layouts";
import segmentsData from "../ring-segments/segments.json";

const BEATS_PER_BAR = 4;
const ALL_RINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const GOLDEN = 0.6180339887;

interface HSV { hue: number; sat: number; val: number; hueEnd?: number; gradientSeg?: string }
interface ColoringLayer { name: string; layout: string; colors: HSV[]; custom?: CustomSpec }
interface BgLayer {
  name: string;
  recipe: "sparkles" | "hueDrift";
  intensity: number;
  period: number;
  density: number;
  mode?: "light" | "dark";
  channel?: "brightness" | "saturation";
  rings: number[];
  breath?: number;
  breathBars?: number;
  breathScatter?: number;
  hueSwing?: number;
  hueShape?: "sin" | "linear" | "rotate";
  hueScatter?: number;
  ringPhases?: number[];
  ringPeriods?: number[];
  ringSwings?: number[];
}
interface MotionParams { period: number; tail: number; delay: number; intensity: number; startOffset?: number }
interface MotionLayer extends MotionParams {
  name: string;
  recipe: "shoot" | "swell";
  segment: string;
  draw: "glow" | "mask";
  headShape?: "linear" | "sin";
  ringPhase?: "none" | "around" | "around2" | "across";
  rings: number[];
  ringParams?: MotionParams[];
}
interface TransLayer {
  name: string;
  direction: "in" | "out";
  style: "fade" | "steps" | "rings" | "build";
  steps?: number;
  order?: "clockwise" | "bottom-up" | "scattered" | "alternate";
  groups?: number;
  level?: number;
  pump?: boolean;
}
interface Section { startBar: number; endBar: number; layer: string }
export interface SongLayers {
  coloring?: { layers: ColoringLayer[]; sections: Section[]; overrides?: Section[] };
  background?: { layers: BgLayer[]; sections: Section[] };
  motion?: { layers: MotionLayer[]; sections: Section[] };
  transition?: { layers: TransLayer[]; sections: Section[] };
}

// Bars are 1-based and endBar is exclusive; bar 1 starts on beat 0.
const beatOfBar = (bar: number) => (bar - 1) * BEATS_PER_BAR;
const sin = (min: number, max: number, phase: number, repeats = 1) => ({ sin: { min, max, phase, repeats } });

/** Adds one effect to ring r on `seg`, over beats start-end, looped every `period` beats when given. */
function put(r: number, seg: string, start: number, end: number, effect: object, period?: number) {
  elements([r], () => beats(start, end, () => segment(seg, () => {
    if (period) cycle(period, () => addEffect(effect));
    else addEffect(effect);
  })));
}

/** Highest relPos in a segment, so a gradient along it ends exactly on hueEnd (arc only reaches 6/7). */
function maxRelPos(seg: string) {
  const s = segmentsData.segments.find(s => s.name === seg);
  return s ? Math.max(...s.pixels.map(p => p.relPos)) : 1;
}

function byName<T extends { name: string }>(layers: T[], name: string, lane: string): T | undefined {
  const layer = layers.find(l => l.name === name);
  if (!layer) console.warn(`${lane}: no layer named "${name}", section skipped`);
  return layer;
}

// --- coloring ------------------------------------------------------------------------------------------------

const layoutOf = (layer: ColoringLayer): Layout | undefined =>
  layer.custom ? customLayout(layer.custom) : layoutById(layer.layout);

/** Hue change h0 -> h1 the short way around, never taking h0 below 0 (the esp32 does not wrap negative hues). */
function hueDelta(h0: number, h1: number) {
  let d = ((((h1 - h0) + 0.5) % 1) + 1) % 1 - 0.5;
  if (h0 + d < 0) d += 1;
  return d;
}

const isZero = (fn: FloatFn, seg: string) => {
  const s = segmentsData.segments.find(s => s.name === seg);
  return !!s && s.pixels.every(p => Math.abs(evalFn(fn, p.relPos)) < 1e-9);
};

function addColoring(layer: ColoringLayer, sec: Section) {
  const layout = layoutOf(layer);
  if (!layout) { console.warn(`coloring "${layer.name}": unknown layout "${layer.layout}", skipped`); return; }
  const start = beatOfBar(sec.startBar), end = beatOfBar(sec.endBar);
  for (const r of ALL_RINGS) {
    const plan = layout.ring(r);
    const c0 = layer.colors[plan.base];
    if (!c0) continue;
    put(r, "all", start, end, { const_color: { color: { hue: c0.hue, sat: c0.sat, val: c0.val } } });
    const c1 = plan.other !== undefined && plan.fn && plan.seg ? layer.colors[plan.other] : undefined;
    if (!c1) {
      // A whole ring in a hue range: the gradient runs along its gradient segment.
      if (c0.hueEnd !== undefined) {
        const seg = c0.gradientSeg ?? "all";
        put(r, seg, start, end, { position_hue: { offset_factor: LINEAR(0, (c0.hueEnd - c0.hue) / maxRelPos(seg)) } });
      }
      continue;
    }
    const fn = plan.fn!, seg = plan.seg!;
    const h0 = c0.hue;
    const baseHue = c0.hueEnd === undefined ? 0 : LINEAR(0, c0.hueEnd - h0);
    const otherHue = c1.hueEnd === undefined ? hueDelta(h0, c1.hue) : LINEAR(c1.hue - h0, c1.hueEnd - h0);
    const hueFn = mapLeaves(fn, baseHue, otherHue);
    if (!isZero(hueFn, seg)) put(r, seg, start, end, { position_hue: { offset_factor: hueFn } });
    for (const [ch, key] of [["sat", "position_saturation"], ["val", "position_brightness"]] as const) {
      const v0 = c0[ch], v1 = c1[ch];
      if (Math.abs(v1 - v0) < 1e-9) continue;
      const factor = v1 < v0
        ? { mult_factor_decrease: mapLeaves(fn, 1, v0 ? v1 / v0 : 1) }
        : { mult_factor_increase: mapLeaves(fn, 0, v0 < 1 ? (v1 - v0) / (1 - v0) : 0) };
      put(r, seg, start, end, { [key]: factor });
    }
  }
}

/** Brightness of the coloring under ring r at bar `bar` (an override wins over its base section). */
function coloringValAt(layers: SongLayers, r: number, bar: number) {
  const c = layers.coloring;
  if (!c) return 0;
  const covers = (s: Section) => s.startBar <= bar && bar < s.endBar;
  const sec = (c.overrides ?? []).find(covers) ?? c.sections.find(covers);
  const layer = sec && c.layers.find(l => l.name === sec.layer);
  const layout = layer && layoutOf(layer);
  return layout ? layer!.colors[layout.ring(r).base]?.val ?? 0 : 0;
}

// --- background ----------------------------------------------------------------------------------------------

function addBackground(layer: BgLayer, sec: Section) {
  const start = beatOfBar(sec.startBar), end = beatOfBar(sec.endBar);
  for (const r of layer.rings) {
    if (layer.recipe === "hueDrift") {
      const period = layer.ringPeriods?.[r - 1] ?? layer.period;
      const swing = layer.ringSwings?.[r - 1] ?? layer.hueSwing ?? 0.1;
      const phase = (layer.ringPhases?.[r - 1] ?? (r * GOLDEN) % 1) * (layer.hueScatter ?? 0);
      const offset = layer.hueShape === "rotate" ? LINEAR(phase, 1 + phase)
        : layer.hueShape === "linear" ? LINEAR(-swing, swing)
        : sin(-swing, swing, phase);
      put(r, "all", start, end, { timed_hue: { offset_factor: offset } }, period);
      continue;
    }
    // sparkles: a cyclic snake on rand whose head runs 0 -> 1 once per period, with a soft sin flash inside it.
    const breath = layer.breath ?? 0;
    const tail = breath
      ? sin(layer.density * (1 - breath), layer.density * (1 + breath),
        -0.25 + ((r * GOLDEN) % 1) * (layer.breathScatter ?? 0), layer.period / (BEATS_PER_BAR * (layer.breathBars ?? 1)))
      : K(layer.density);
    const I = layer.intensity;
    const shape = layer.mode === "dark"
      ? { mult_factor_decrease: sin(1 - I, 1, 0.25) }
      : { mult_factor_increase: sin(0, I, -0.25) };
    const key = layer.channel === "saturation" ? "snake_saturation" : "snake_brightness";
    put(r, "rand", start, end, { [key]: { head: LINEAR(0, 1), tail_length: tail, cyclic: true, ...shape } }, layer.period);
  }
}

// --- motion --------------------------------------------------------------------------------------------------

function motionRingPhase(layer: MotionLayer, r: number) {
  if (layer.ringPhase === "around") return (r - 1) / 12;
  if (layer.ringPhase === "around2") return (2 * (r - 1)) / 12;
  if (layer.ringPhase === "across") return (1 - (Math.sin(((r + 0.5) * Math.PI) / 6) + 1) / 2) * 0.7;
  return 0;
}

function addMotion(layer: MotionLayer, sec: Section) {
  const end = beatOfBar(sec.endBar);
  for (const r of layer.rings) {
    const m = layer.ringParams?.[r - 1] ?? layer;
    const start = beatOfBar(sec.startBar) + (m.startOffset ?? 0);
    const phase = -0.25 + motionRingPhase(layer, r);
    if (layer.recipe === "swell") {
      put(r, "all", start, end, { timed_brightness: { mult_factor_increase: sin(0, m.intensity, phase) } }, m.period);
      continue;
    }
    const snake = {
      head: layer.headShape === "sin" ? sin(0, 1, phase) : LINEAR(-m.delay, 1 + m.tail),
      tail_length: K(m.tail),
      cyclic: false,
    };
    const effect = layer.draw === "mask"
      ? { snake }
      : { snake_brightness: { ...snake, mult_factor_increase: LINEAR(0, m.intensity) } };
    put(r, layer.segment, start, end, effect, m.period);
  }
}

// --- transition ----------------------------------------------------------------------------------------------

function ringOrder(order: TransLayer["order"]) {
  if (order === "clockwise" || order === "alternate") return [...ALL_RINGS];
  if (order === "scattered") return [...ALL_RINGS].sort((a, b) => ((a * GOLDEN) % 1) - ((b * GOLDEN) % 1));
  // bottom-up: by height, the bottom of the clock first (ring r sits at r:30).
  return [...ALL_RINGS].sort((a, b) => Math.cos(((a + 0.5) * Math.PI) / 6) - Math.cos(((b + 0.5) * Math.PI) / 6));
}

function addTransition(layers: SongLayers, layer: TransLayer, sec: Section) {
  const start = beatOfBar(sec.startBar), end = beatOfBar(sec.endBar), len = end - start;
  const into = layer.direction === "in";
  const order = ringOrder(layer.order);
  for (const r of ALL_RINGS) {
    if (layer.style === "fade") {
      put(r, "all", start, end, { timed_brightness: { mult_factor_decrease: into ? LINEAR(0, 1) : LINEAR(1, 0) } });
    } else if (layer.style === "steps") {
      const n = Math.max(2, layer.steps ?? 4);
      const steps = { steps: { num_steps: n, first_step_value: into ? 0 : 1, diff_per_step: (into ? 1 : -1) / (n - 1) } };
      put(r, "all", start, end, { timed_brightness: { mult_factor_decrease: steps } });
    } else if (layer.style === "rings") {
      const k = order.indexOf(r);
      const [from, to] = into ? [start, start + (len * k) / 12] : [start + (len * (k + 1)) / 12, end];
      if (to > from) put(r, "all", from, to, { timed_brightness: { mult_factor_decrease: K(0) } });
    } else {
      // build: one stage per group, plus the pump; brightness levels are absolute, so they depend on the coloring.
      const G = layer.groups ?? 3, level = layer.level ?? 0.3;
      const g = layer.order === "alternate" ? (r - 1) % G : Math.floor((order.indexOf(r) * G) / 12);
      const stages = G + (layer.pump ? 1 : 0), stageLen = len / stages;
      const v = coloringValAt(layers, r, sec.startBar);
      for (let s = 0; s < stages; s++) {
        const factor = layer.pump && s === G ? { mult_factor_increase: K(1) }
          : g > s ? { mult_factor_decrease: K(0) }
          : level >= v ? { mult_factor_increase: K(v < 1 ? (level - v) / (1 - v) : 0) }
          : { mult_factor_decrease: K(level / v) };
        put(r, "all", start + s * stageLen, start + (s + 1) * stageLen, { timed_brightness: factor });
      }
    }
  }
}

// --- all lanes -----------------------------------------------------------------------------------------------

export function addLayers(layers: SongLayers) {
  const c = layers.coloring;
  if (c) {
    for (const sec of [...c.sections, ...(c.overrides ?? [])]) {
      const layer = byName(c.layers, sec.layer, "coloring");
      if (layer) addColoring(layer, sec);
    }
  }
  for (const sec of layers.background?.sections ?? []) {
    const layer = byName(layers.background!.layers, sec.layer, "background");
    if (layer) addBackground(layer, sec);
  }
  for (const sec of layers.motion?.sections ?? []) {
    const layer = byName(layers.motion!.layers, sec.layer, "motion");
    if (layer) addMotion(layer, sec);
  }
  for (const sec of layers.transition?.sections ?? []) {
    const layer = byName(layers.transition!.layers, sec.layer, "transition");
    if (layer) addTransition(layers, layer, sec);
  }
}
