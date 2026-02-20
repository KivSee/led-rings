/**
 * Effect preview: evaluates time- and position-based effects so the playback
 * panel can show how each effect changes the ring pixels as time progresses.
 *
 * Note: Not all effects are currently displayed correctly in the visualization.
 * Position, Timed, and Snake (snake_brightness, snake_hue, snake_saturation) effects
 * are supported here; behaviour may differ from the actual renderer for some
 * FloatFunction combinations or edge cases.
 *
 * Effects (from src/effects):
 * - Coloring: const_color (solid HSV).
 * - Brightness: mult_factor(t) multiplies value (0 = off, 1 = full).
 * - Hue: offset_factor(t) added to hue (0–1 cycle).
 * - Snake: head(t) and tail_length(t); pixels in [head-tail, head] are lit, rest dimmed.
 */

import { Timeframe, TimeframeEffectEntry, getTimeframeEffects } from './App'

/** Compute per-ring phase offset from an effect entry's phase value. */
function entryPhase(entry: TimeframeEffectEntry | undefined, ringIndex: number): number {
  const intensity = entry?.phase ?? 0
  return intensity > 0 ? ringIndex / 12 * intensity : 0
}

const BRIGHTNESS_KEYS = new Set(['brightness', 'fadeIn', 'fadeOut', 'fadeInOut', 'fadeOutIn', 'blink', 'pulse', 'fade'])
const HUE_KEYS = new Set(['staticHueShift', 'hueShiftStartToEnd', 'hueShiftSin'])
const MOTION_KEYS = new Set(['snakeHeadMove', 'staticSnake', 'snake', 'snakeHeadSin', 'snakeFillGrow', 'snakeInOut', 'snakeSlowFast', 'snakeTailShrinkGrow', 'snakeHeadSteps'])
const POSITION_BRIGHTNESS_KEYS = new Set(['position_brightness'])
const POSITION_HUE_KEYS = new Set(['position_hue'])
const POSITION_SATURATION_KEYS = new Set(['position_saturation'])
const SNAKE_BRIGHTNESS_KEYS = new Set(['snake_brightness'])
const SNAKE_HUE_KEYS = new Set(['snake_hue'])
const SNAKE_SATURATION_KEYS = new Set(['snake_saturation'])
const TIMED_BRIGHTNESS_KEYS = new Set(['timed_brightness'])
const TIMED_HUE_KEYS = new Set(['timed_hue'])
const TIMED_SATURATION_KEYS = new Set(['timed_saturation'])

// --- Float function types (mirror src/effects/functions.ts and preset JSON) ---
type ConstValue = { value: number }
type Linear = { start: number; end: number }
type Sin = { min: number; max: number; phase: number; repeats: number }
type Steps = { num_steps: number; diff_per_step: number; first_step_value: number }
type Half = { f1: FloatFunc; f2: FloatFunc }
type Comb2 = { f1: FloatFunc; amount1: number; f2: FloatFunc; amount2: number }

type FloatFunc = {
  const_value?: ConstValue
  constValue?: ConstValue
  linear?: Linear
  sin?: Sin
  steps?: Steps
  half?: Half
  comb2?: Comb2
}

/** Evaluate a float function at normalized time t in [0, 1]. */
export function evalFloat(t: number, f: FloatFunc | undefined): number {
  if (!f) return 0
  if (f.const_value !== undefined) return f.const_value.value
  if (f.constValue !== undefined) return f.constValue.value
  if (f.linear !== undefined) {
    const { start, end } = f.linear
    return start + t * (end - start)
  }
  if (f.sin !== undefined) {
    const { min, max, phase, repeats } = f.sin
    const x = 2 * Math.PI * repeats * t + phase
    return min + (max - min) * 0.5 * (1 + Math.sin(x))
  }
  if (f.steps !== undefined) {
    const { num_steps, diff_per_step, first_step_value } = f.steps
    const step = Math.min(Math.floor(t * num_steps), num_steps - 1)
    return first_step_value + step * diff_per_step
  }
  if (f.half !== undefined) {
    return t < 0.5 ? evalFloat(t * 2, f.half.f1) : evalFloat((t - 0.5) * 2, f.half.f2)
  }
  if (f.comb2 !== undefined) {
    const v1 = evalFloat(t, f.comb2.f1)
    const v2 = evalFloat(t, f.comb2.f2)
    const a1 = f.comb2.amount1
    const a2 = f.comb2.amount2
    const sum = a1 + a2
    return sum === 0 ? 0 : (a1 * v1 + a2 * v2) / sum
  }
  return 0
}

/** HSV in 0–1 range. */
export interface HSV {
  h: number
  s: number
  v: number
}

/** Get base color for a pixel from timeframe. Phase offsets hue per ring. */
function getBaseColor(
  _relPos: number,
  timeframe: Timeframe,
  perRingPhase: number = 0
): HSV {
  const hueFromHex = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    if (max !== min) {
      if (max === r) h = ((g - b) / (max - min)) % 6
      else if (max === g) h = (b - r) / (max - min) + 2
      else h = (r - g) / (max - min) + 4
    }
    h = h / 6
    if (h < 0) h += 1
    return h
  }

  let baseHue = hueFromHex(timeframe.color || '#3b82f6')
  baseHue = (baseHue + perRingPhase) % 1
  if (baseHue < 0) baseHue += 1
  return { h: baseHue, s: 1, v: 1 }
}

/** Apply one FloatFunction-based brightness (both increase and decrease multiply). */
function applyFloatFunctionBrightness(currentMult: number, inputVal: number, _isIncrease: boolean): number {
  return currentMult * inputVal
}

/** Brightness mult from timeframe: legacy (time t) + timed (FloatFunction at t) + position (FloatFunction at relPos). */
function getBrightnessMult(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let mult = 1

  const legacy = getTimeframeEffects(timeframe).find(e => BRIGHTNESS_KEYS.has(e.effectKey))
  const name = legacy?.effectKey
  const p = legacy?.params ?? {}
  const legacyPhase = entryPhase(legacy, ringIndex)
  switch (name) {
    case 'brightness':
      mult = typeof p.value === 'number' ? p.value : 1
      break
    case 'fadeIn':
      mult = t
      break
    case 'fadeOut':
      mult = 1 - t
      break
    case 'fadeInOut': {
      const high = typeof p.high === 'number' ? p.high : 1
      mult = t < 0.5 ? (t * 2) * high : (1 - (t - 0.5) * 2) * high
      break
    }
    case 'fadeOutIn': {
      const low = typeof p.low === 'number' ? p.low : 0
      mult = t < 0.5 ? 1 - (t * 2) * (1 - low) : low + ((t - 0.5) * 2) * (1 - low)
      break
    }
    case 'blink': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      mult = t < 0.5 ? low : 1
      break
    }
    case 'pulse': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      const staticPhase = typeof p.staticPhase === 'number' ? p.staticPhase : 0
      const x = 2 * Math.PI * t + staticPhase + legacyPhase
      mult = low + (1 - low) * 0.5 * (1 + Math.sin(x))
      break
    }
    case 'fade':
      mult = (typeof p.start === 'number' && typeof p.end === 'number')
        ? p.start + t * (p.end - p.start)
        : 1
      break
    default:
      break
  }

  const timedB = getTimeframeEffects(timeframe).find(e => TIMED_BRIGHTNESS_KEYS.has(e.effectKey))
  if (timedB?.params) {
    const par = timedB.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedB, ringIndex)) % 1 + 1) % 1
    if (par.mult_factor_increase != null) mult = applyFloatFunctionBrightness(mult, evalFloat(tShifted, par.mult_factor_increase as FloatFunc), true)
    else if (par.mult_factor_decrease != null) mult = applyFloatFunctionBrightness(mult, evalFloat(tShifted, par.mult_factor_decrease as FloatFunc), false)
  }
  const posB = getTimeframeEffects(timeframe).find(e => POSITION_BRIGHTNESS_KEYS.has(e.effectKey))
  if (posB?.params) {
    const par = posB.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posB, ringIndex)) % 1 + 1) % 1
    if (par.mult_factor_increase != null) mult = applyFloatFunctionBrightness(mult, evalFloat(relPosShifted, par.mult_factor_increase as FloatFunc), true)
    else if (par.mult_factor_decrease != null) mult = applyFloatFunctionBrightness(mult, evalFloat(relPosShifted, par.mult_factor_decrease as FloatFunc), false)
  }
  const snakeB = getTimeframeEffects(timeframe).find(e => SNAKE_BRIGHTNESS_KEYS.has(e.effectKey))
  if (snakeB?.params) {
    const par = snakeB.params as Record<string, unknown>
    const snakeBPhase = entryPhase(snakeB, ringIndex)
    const head = evalFloat(t, par.head as FloatFunc) + snakeBPhase
    const tailLen = evalFloat(t, (par.tail_length ?? par.tailLength) as FloatFunc)
    const cyclic = par.cyclic === true
    const currHead = cyclic ? head - Math.floor(head) : head
    const currTail = currHead - tailLen
    let snakeIndex = -1
    if (cyclic && currTail < 0) {
      const wrappedTail = currTail + 1
      if (relPos >= wrappedTail) snakeIndex = tailLen > 0 ? (relPos - wrappedTail) / tailLen : 1
      else if (relPos <= currHead) snakeIndex = tailLen > 0 ? ((1 - wrappedTail) + relPos) / tailLen : 1
    } else if (relPos >= currTail && relPos <= currHead) {
      snakeIndex = tailLen > 0 ? (relPos - currTail) / tailLen : 1
    }
    if (snakeIndex >= 0 && snakeIndex <= 1) {
      if (par.mult_factor_increase != null) mult = applyFloatFunctionBrightness(mult, evalFloat(snakeIndex, par.mult_factor_increase as FloatFunc), true)
      else if (par.mult_factor_decrease != null) mult = applyFloatFunctionBrightness(mult, evalFloat(snakeIndex, par.mult_factor_decrease as FloatFunc), false)
    }
  }
  return mult
}

/** Hue offset from timeframe: legacy (time t) + timed (FloatFunction at t) + position (FloatFunction at relPos). */
function getHueOffset(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let offset = 0

  const legacy = getTimeframeEffects(timeframe).find(e => HUE_KEYS.has(e.effectKey))
  const name = legacy?.effectKey
  const p = legacy?.params ?? {}
  const legacyPhase = entryPhase(legacy, ringIndex)
  switch (name) {
    case 'staticHueShift':
      offset = typeof p.value === 'number' ? p.value : 0
      break
    case 'hueShiftStartToEnd':
      offset = (typeof p.start === 'number' && typeof p.end === 'number')
        ? p.start + t * (p.end - p.start)
        : 0
      break
    case 'hueShiftSin': {
      const amount = typeof p.amount === 'number' ? p.amount : 0.5
      offset = amount * 0.5 * (1 + Math.sin(2 * Math.PI * t + legacyPhase))
      break
    }
    default:
      break
  }

  const timedH = getTimeframeEffects(timeframe).find(e => TIMED_HUE_KEYS.has(e.effectKey))
  if (timedH?.params) {
    const par = timedH.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedH, ringIndex)) % 1 + 1) % 1
    if (par.offset_factor != null) offset += evalFloat(tShifted, par.offset_factor as FloatFunc)
  }
  const posH = getTimeframeEffects(timeframe).find(e => POSITION_HUE_KEYS.has(e.effectKey))
  if (posH?.params) {
    const par = posH.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posH, ringIndex)) % 1 + 1) % 1
    if (par.offset_factor != null) offset += evalFloat(relPosShifted, par.offset_factor as FloatFunc)
  }
  const snakeH = getTimeframeEffects(timeframe).find(e => SNAKE_HUE_KEYS.has(e.effectKey))
  if (snakeH?.params) {
    const par = snakeH.params as Record<string, unknown>
    const snakeHPhase = entryPhase(snakeH, ringIndex)
    const head = evalFloat(t, par.head as FloatFunc) + snakeHPhase
    const tailLen = evalFloat(t, (par.tail_length ?? par.tailLength) as FloatFunc)
    const cyclic = par.cyclic === true
    const currHead = cyclic ? head - Math.floor(head) : head
    const currTail = currHead - tailLen
    let snakeIndex = -1
    if (cyclic && currTail < 0) {
      const wrappedTail = currTail + 1
      if (relPos >= wrappedTail) snakeIndex = tailLen > 0 ? (relPos - wrappedTail) / tailLen : 1
      else if (relPos <= currHead) snakeIndex = tailLen > 0 ? ((1 - wrappedTail) + relPos) / tailLen : 1
    } else if (relPos >= currTail && relPos <= currHead) {
      snakeIndex = tailLen > 0 ? (relPos - currTail) / tailLen : 1
    }
    if (snakeIndex >= 0 && snakeIndex <= 1 && par.offset_factor != null) offset += evalFloat(snakeIndex, par.offset_factor as FloatFunc)
  }
  return offset
}

/** Saturation mult from timeframe: timed (FloatFunction at t) + position (FloatFunction at relPos). Same increase/decrease as brightness. */
function getSaturationMult(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let mult = 1
  const apply = (current: number, inputVal: number, _isIncrease: boolean) =>
    current * inputVal

  const timedS = getTimeframeEffects(timeframe).find(e => TIMED_SATURATION_KEYS.has(e.effectKey))
  if (timedS?.params) {
    const par = timedS.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedS, ringIndex)) % 1 + 1) % 1
    if (par.mult_factor_increase != null) mult = apply(mult, evalFloat(tShifted, par.mult_factor_increase as FloatFunc), true)
    else if (par.mult_factor_decrease != null) mult = apply(mult, evalFloat(tShifted, par.mult_factor_decrease as FloatFunc), false)
  }
  const posS = getTimeframeEffects(timeframe).find(e => POSITION_SATURATION_KEYS.has(e.effectKey))
  if (posS?.params) {
    const par = posS.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posS, ringIndex)) % 1 + 1) % 1
    if (par.mult_factor_increase != null) mult = apply(mult, evalFloat(relPosShifted, par.mult_factor_increase as FloatFunc), true)
    else if (par.mult_factor_decrease != null) mult = apply(mult, evalFloat(relPosShifted, par.mult_factor_decrease as FloatFunc), false)
  }
  const snakeS = getTimeframeEffects(timeframe).find(e => SNAKE_SATURATION_KEYS.has(e.effectKey))
  if (snakeS?.params) {
    const par = snakeS.params as Record<string, unknown>
    const snakeSPhase = entryPhase(snakeS, ringIndex)
    const head = evalFloat(t, par.head as FloatFunc) + snakeSPhase
    const tailLen = evalFloat(t, (par.tail_length ?? par.tailLength) as FloatFunc)
    const cyclic = par.cyclic === true
    const currHead = cyclic ? head - Math.floor(head) : head
    const currTail = currHead - tailLen
    let snakeIndex = -1
    if (cyclic && currTail < 0) {
      const wrappedTail = currTail + 1
      if (relPos >= wrappedTail) snakeIndex = tailLen > 0 ? (relPos - wrappedTail) / tailLen : 1
      else if (relPos <= currHead) snakeIndex = tailLen > 0 ? ((1 - wrappedTail) + relPos) / tailLen : 1
    } else if (relPos >= currTail && relPos <= currHead) {
      snakeIndex = tailLen > 0 ? (relPos - currTail) / tailLen : 1
    }
    if (snakeIndex >= 0 && snakeIndex <= 1) {
      if (par.mult_factor_increase != null) mult = apply(mult, evalFloat(snakeIndex, par.mult_factor_increase as FloatFunc), true)
      else if (par.mult_factor_decrease != null) mult = apply(mult, evalFloat(snakeIndex, par.mult_factor_decrease as FloatFunc), false)
    }
  }
  return mult
}

/** Snake mask: 1 if pixel at relPos is in the lit tail at time t, else 0 (or fade). */
function getSnakeMask(
  relPos: number,
  t: number,
  _numPixelsInRing: number,
  timeframe: Timeframe,
  ringIndex: number = 0
): number {
  const entry = getTimeframeEffects(timeframe).find(e => MOTION_KEYS.has(e.effectKey))
  const name = entry?.effectKey
  const p = entry?.params ?? {}
  const perRingPhase = entryPhase(entry, ringIndex)

  const tailLength = (): number => {
    if (name === 'snake' || name === 'snakeHeadSin' || name === 'snakeSlowFast' || name === 'snakeHeadSteps')
      return typeof p.tailLength === 'number' ? p.tailLength : 0.5
    if (name === 'snakeHeadMove') return typeof p.tail === 'number' ? p.tail : 0.5
    return 0.5
  }

  let head: number
  const cyclic = name === 'snake' || name === 'staticSnake' || name === 'snakeHeadSin' || name === 'snakeSlowFast' || name === 'snakeTailShrinkGrow' || name === 'snakeHeadSteps'
    ? (p.cyclic === true)
    : false

  switch (name) {
    case 'snakeHeadMove':
      head = (typeof p.start === 'number' && typeof p.end === 'number')
        ? p.start + t * (p.end - p.start)
        : t
      break
    case 'staticSnake':
      head = (typeof p.start === 'number' && typeof p.end === 'number')
        ? (p.start + perRingPhase + t) % 1
        : perRingPhase + t
      break
    case 'snake':
      head = p.reverse ? perRingPhase + 1 - t : perRingPhase + t
      break
    case 'snakeHeadSin':
      head = 0.1 + 0.9 * 0.5 * (1 + Math.sin(2 * Math.PI * t + perRingPhase))
      break
    case 'snakeFillGrow': {
      const reverse = p.reverse === true
      if (reverse) {
        if (t < 0.5) head = 1
        else head = (t - 0.5) * 2
      } else {
        if (t < 0.5) head = t * 2
        else head = 1
      }
      break
    }
    case 'snakeInOut':
      head = 0.5 * (1 + Math.sin(2 * Math.PI * t))
      break
    case 'snakeSlowFast': {
      const sinPart = 0.5 * (1 + Math.sin(2 * Math.PI * t))
      head = (sinPart + t) / 2
      break
    }
    case 'snakeTailShrinkGrow': {
      const h = 0.5 * (1 + Math.sin(2 * Math.PI * t))
      const tail = t < 0.5 ? 0.5 + t : 1.5 - t
      head = h
      const dist = cyclic ? (relPos - head + 2) % 1 : relPos - head
      const tailNorm = Math.max(0, 1 - Math.abs(dist) / Math.max(0.01, tail))
      return Math.min(1, Math.max(0, tailNorm))
    }
    case 'snakeHeadSteps': {
      const steps = typeof p.steps === 'number' ? Math.max(1, p.steps) : 4
      head = Math.floor(t * steps) / steps
      break
    }
    default:
      return 1
  }

  const tail = tailLength()
  if (cyclic) {
    // backward distance from head to relPos along ring
    let d = (head - relPos + 1) % 1
    if (d < 0) d += 1
    if (d > 1) d -= 1
    const inTail = d <= tail
    if (inTail) return 1
    if (tail < 1e-6) return 0
    const dist = Math.min(d, (relPos - head + 1) % 1)
    return Math.max(0, 1 - (dist - tail) / 0.08)
  } else {
    if (relPos <= head && relPos >= head - tail) return 1
    if (relPos > head) return 0
    const dist = head - tail - relPos
    return dist <= 0 ? 1 : Math.max(0, 1 - dist / 0.08)
  }
}

/** Whether the timeframe has any motion (snake) effect. */
export function hasMotionEffect(timeframe: Timeframe): boolean {
  return getTimeframeEffects(timeframe).some(e => MOTION_KEYS.has(e.effectKey))
}

/**
 * Compute final pixel color for playback preview.
 * relPos: position along ring 0–1, t: normalized time in segment 0–1.
 * ringIndex: 0-based ring index (0–11), used with timeframe.phase to compute per-ring phase offset.
 */
export function getPixelColor(
  relPos: number,
  t: number,
  timeframe: Timeframe,
  ringIndex: number = 0
): HSV {
  // Color phase from timeframe level (offsets base hue per ring)
  const colorPhaseIntensity = timeframe.phase ?? 0
  const colorPerRingPhase = colorPhaseIntensity > 0 ? ringIndex / 12 * colorPhaseIntensity : 0

  let { h, s, v } = getBaseColor(relPos, timeframe, colorPerRingPhase)

  // Each effect function reads phase from its own effect entry
  h = (h + getHueOffset(relPos, t, timeframe, ringIndex)) % 1
  if (h < 0) h += 1

  s = s * getSaturationMult(relPos, t, timeframe, ringIndex)

  const brightnessMult = getBrightnessMult(relPos, t, timeframe, ringIndex)
  const snakeMask = hasMotionEffect(timeframe)
    ? getSnakeMask(relPos, t, 12, timeframe, ringIndex)
    : 1

  v = v * brightnessMult * snakeMask
  return { h, s, v }
}

/** Convert HSV (0–1) to rgb() string. */
export function hsvToRgbString(h: number, s: number, v: number): string {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = v
  } else {
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - s * f)
    const t = v * (1 - s * (1 - f))
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break
      case 1: r = q; g = v; b = p; break
      case 2: r = p; g = v; b = t; break
      case 3: r = p; g = q; b = v; break
      case 4: r = t; g = p; b = v; break
      default: r = v; g = p; b = q; break
    }
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}
