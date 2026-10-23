import segmentsData from '../../../src/ring-segments/segments.json'

// A port of kivsee-render (the C++ renderer on the ring controllers) to the browser, so a sequence made by a
// song .ts file can be played back here exactly the way a d1 ring draws it. Every frame starts all pixels black,
// then renders the ring's effects in order, each one changing the pixels of its segment in place.

export interface HSV { hue: number; sat: number; val: number }

/** A float function as sent to the renderer (src/effects/functions.ts). */
export type FloatFn = {
  const_value?: { value: number }
  linear?: { start: number; end: number }
  sin?: { min: number; max: number; phase: number; repeats: number }
  steps?: { num_steps: number; diff_per_step: number; first_step_value: number }
  repeat?: { numberOfTimes: number; funcToRepeat: FloatFn }
  half?: { f1: FloatFn; f2: FloatFn }
  comb2?: { f1: FloatFn; amount1: number; f2: FloatFn; amount2: number }
  fixed_window?: { start: number; end: number; cyclic?: boolean; outside_value?: number; func: FloatFn }
  moving_window?: { start: FloatFn; end: FloatFn; inside_value?: number; outside_value?: number; cyclic?: boolean }
}

export interface EffectConfig {
  start_time: number
  end_time: number
  segments?: string
  repeat_num?: number
  repeat_start?: number
  repeat_end?: number
}

/** One effect of a sequence: its config plus one effect key (const_color, snake_brightness, …). */
export type EffectJson = { effect_config: EffectConfig } & Record<string, any>

export interface ThingSequence { effects: EffectJson[]; duration_ms: number; num_repeats: number }
export type Sequence = Record<string, ThingSequence>

export function evalFloat(f: FloatFn | undefined, x: number): number {
  if (!f) return 0
  if (f.const_value) return f.const_value.value ?? 0
  if (f.linear) return (f.linear.start ?? 0) + x * ((f.linear.end ?? 0) - (f.linear.start ?? 0))
  if (f.sin) {
    const { min = 0, max = 0, phase = 0, repeats = 0 } = f.sin
    return ((Math.sin((x * repeats + phase) * 2 * Math.PI) + 1) / 2) * (max - min) + min
  }
  if (f.steps) {
    const { num_steps = 0, diff_per_step = 0, first_step_value = 0 } = f.steps
    return first_step_value + diff_per_step * Math.trunc(x * num_steps)
  }
  if (f.repeat) return evalFloat(f.repeat.funcToRepeat, (x * (f.repeat.numberOfTimes ?? 0)) % 1)
  if (f.half) return x < 0.5 ? evalFloat(f.half.f1, x * 2) : evalFloat(f.half.f2, (x - 0.5) * 2)
  if (f.comb2) return (f.comb2.amount1 ?? 0) * evalFloat(f.comb2.f1, x) + (f.comb2.amount2 ?? 0) * evalFloat(f.comb2.f2, x)
  if (f.fixed_window) {
    const { start = 0, end = 0, cyclic, outside_value = 0, func } = f.fixed_window
    const length = end - start
    if (length <= 0) return outside_value
    let t = x
    if (cyclic) { const fromStart = t - start; t = start + (fromStart - Math.floor(fromStart)) }
    if (t < start || t > end) return outside_value
    return evalFloat(func, (t - start) / length)
  }
  if (f.moving_window) {
    const { inside_value = 0, outside_value = 0, cyclic } = f.moving_window
    const start = evalFloat(f.moving_window.start, x), end = evalFloat(f.moving_window.end, x)
    if (end < start) return outside_value
    let t = x
    if (cyclic) { const fromStart = t - start; t = start + (fromStart - Math.floor(fromStart)) }
    return t >= start && t <= end ? inside_value : outside_value
  }
  return 0
}

// --- segments: the pixels of each segment, in the order the renderer walks them -----------------------------

interface SegPixel { index: number; relPos: number }
const SEGMENTS: Record<string, SegPixel[]> = {}
for (const seg of segmentsData.segments) SEGMENTS[seg.name] = seg.pixels.map(p => ({ index: p.index, relPos: p.relPos }))
export const PIXELS_PER_RING = segmentsData.numberOfPixels

/** Segments the sequence uses that segments.json does not have. A ring rejects the whole animation then. */
export const missingSegments = (seq: Sequence) =>
  [...new Set(Object.values(seq).flatMap(t => t.effects.map(e => e.effect_config.segments || 'all')))].filter(s => !SEGMENTS[s])

// --- effects -------------------------------------------------------------------------------------------------

/** Where a pixel falls on a snake: undefined if outside it, else its snake_index 0 (tail) - 1 (head). */
function snakeIndex(relPos: number, head: number, tailLength: number, cyclic: boolean): number | undefined {
  const tail = head - tailLength
  let idx: number
  if (cyclic && tail < 0) {
    const wrappedTail = tail + 1
    if (relPos >= wrappedTail) idx = (relPos - wrappedTail) / tailLength
    else if (relPos <= head) idx = (1 - wrappedTail + relPos) / tailLength
    else return undefined
  } else {
    if (relPos < tail || relPos > head) return undefined
    idx = tailLength > 0 ? (relPos - tail) / tailLength : 1
  }
  return Math.min(1, Math.max(0, idx))
}

const snakeHead = (cfg: { head: FloatFn; cyclic?: boolean }, t: number) => {
  const h = evalFloat(cfg.head, t)
  return cfg.cyclic ? h - Math.trunc(h) : h
}

type Channel = 'val' | 'sat'
/** mult_factor_increase moves the channel toward 1, mult_factor_decrease multiplies it. */
function applyMult(px: HSV, ch: Channel, cfg: { mult_factor_increase?: FloatFn; mult_factor_decrease?: FloatFn }, x: number) {
  if (cfg.mult_factor_increase) px[ch] = px[ch] + (1 - px[ch]) * evalFloat(cfg.mult_factor_increase, x)
  else px[ch] *= evalFloat(cfg.mult_factor_decrease, x)
}

/** Render one effect at rel_time t on the ring's pixels. */
function renderEffect(e: EffectJson, seg: SegPixel[], leds: HSV[], t: number) {
  if (e.const_color) {
    const { hue = 0, sat = 0, val = 0 } = e.const_color.color ?? {}
    for (const { index } of seg) { const px = leds[index]; px.hue = hue; px.sat = sat; px.val = val }
  } else if (e.rainbow) {
    const start = evalFloat(e.rainbow.hue_start, t), diff = evalFloat(e.rainbow.hue_end, t) - start
    for (const { index, relPos } of seg) { const px = leds[index]; px.hue = start + diff * relPos; px.sat = 1; px.val = 1 }
  } else if (e.brightness) {
    const m = evalFloat(e.brightness.mult_factor, t)
    for (const { index } of seg) leds[index].val *= m
  } else if (e.hue || e.timed_hue) {
    const o = evalFloat((e.hue ?? e.timed_hue).offset_factor, t)
    for (const { index } of seg) leds[index].hue += o
  } else if (e.saturation) {
    const m = evalFloat(e.saturation.mult_factor, t)
    for (const { index } of seg) leds[index].sat *= m
  } else if (e.timed_brightness || e.timed_saturation) {
    const cfg = e.timed_brightness ?? e.timed_saturation
    const ch: Channel = e.timed_brightness ? 'val' : 'sat'
    for (const { index } of seg) applyMult(leds[index], ch, cfg, t)
  } else if (e.position_brightness || e.position_saturation) {
    const cfg = e.position_brightness ?? e.position_saturation
    const ch: Channel = e.position_brightness ? 'val' : 'sat'
    for (const { index, relPos } of seg) applyMult(leds[index], ch, cfg, relPos)
  } else if (e.position_hue) {
    for (const { index, relPos } of seg) leds[index].hue += evalFloat(e.position_hue.offset_factor, relPos)
  } else if (e.snake_brightness || e.snake_saturation || e.snake_hue) {
    const cfg = e.snake_brightness ?? e.snake_saturation ?? e.snake_hue
    const head = snakeHead(cfg, t), tail = evalFloat(cfg.tail_length, t)
    for (const { index, relPos } of seg) {
      const idx = snakeIndex(relPos, head, tail, !!cfg.cyclic)
      if (idx === undefined) continue
      if (e.snake_hue) leds[index].hue += evalFloat(cfg.offset_factor, idx)
      else applyMult(leds[index], e.snake_brightness ? 'val' : 'sat', cfg, idx)
    }
  } else if (e.snake) {
    // The legacy snake: a brightness ramp from its tail to its head, with the pixel just past the head partly lit.
    const head = snakeHead(e.snake, t), tail = evalFloat(e.snake.tail_length, t)
    if (tail === 0) { for (const { index } of seg) leds[index].val = 0; return }
    let next = Infinity, current = -Infinity
    for (const { relPos } of seg) {
      if (relPos > head && relPos < next) next = relPos
      else if (relPos <= head && relPos > current) current = relPos
    }
    for (const { index, relPos } of seg) {
      if (relPos === next) { leds[index].val *= 1 - (next - head) / (next - current); continue }
      const h = e.snake.cyclic && relPos > head ? head + 1 : head
      leds[index].val *= relPos > h || relPos < h - tail ? 0 : (relPos - (h - tail)) / tail
    }
  }
}

/** Render a ring's sequence at `timeMs` (time since the song started) into `leds` (PIXELS_PER_RING pixels). */
export function renderRing(seq: ThingSequence | undefined, timeMs: number, leds: HSV[]) {
  for (const px of leds) { px.hue = 0; px.sat = 0; px.val = 0 }
  if (!seq || seq.duration_ms <= 0 || timeMs < 0) return
  const iteration = Math.floor(timeMs / seq.duration_ms)
  if (seq.num_repeats > 0 && iteration >= seq.num_repeats) return
  const t = timeMs % seq.duration_ms
  for (const e of seq.effects) {
    const relTime = effectRelTime(e.effect_config, t)
    if (relTime === undefined) continue
    const seg = SEGMENTS[e.effect_config.segments || 'all']
    if (seg) renderEffect(e, seg, leds, relTime)
  }
}

/** The effect's rel_time (0-1) at time t, or undefined when it does not render at t. */
export function effectRelTime(c: EffectConfig, t: number): number | undefined {
  if (t < c.start_time || t >= c.end_time) return undefined
  let rel = (t - c.start_time) / (c.end_time - c.start_time)
  const repeats = c.repeat_num ?? 0
  if (repeats > 0) {
    const inCycle = (rel * repeats) % 1
    const start = c.repeat_start ?? 0, end = c.repeat_end ?? 0
    if (inCycle < start || inCycle > end) return undefined
    rel = (inCycle - start) / (end - start)
  }
  return rel
}

/** The effect key of an effect (const_color, snake_brightness, …). */
export const effectKind = (e: EffectJson) => Object.keys(e).find(k => k !== 'effect_config') ?? '?'
