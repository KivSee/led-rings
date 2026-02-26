/**
 * Effect preview: evaluates effects so the playback panel can show how each
 * effect changes the ring pixels as time progresses.
 *
 * Legacy brightness/hue/motion effects are converted to their equivalent
 * FloatFunc representations and evaluated with evalFloat(), using the same
 * code path as timed/position/snake effects.
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

// ---------------------------------------------------------------------------
// Legacy → FloatFunc conversion (matches src/effects/brightness.ts, hue.ts, motion.ts)
// ---------------------------------------------------------------------------

/** Convert a legacy brightness effect to its equivalent FloatFunc.
 *  Phase is injected into sin.phase for pulse (the only brightness effect using phase). */
function legacyBrightnessToFloatFunc(entry: TimeframeEffectEntry, perRingPhase: number): FloatFunc | null {
  const p = entry.params ?? {}
  switch (entry.effectKey) {
    case 'brightness':
      return { const_value: { value: typeof p.value === 'number' ? p.value : 1 } }
    case 'fadeIn':
      return { linear: { start: 0, end: 1 } }
    case 'fadeOut':
      return { linear: { start: 1, end: 0 } }
    case 'fadeInOut': {
      const high = typeof p.high === 'number' ? p.high : 1
      return { half: { f1: { linear: { start: 0, end: high } }, f2: { linear: { start: high, end: 0 } } } }
    }
    case 'fadeOutIn': {
      const low = typeof p.low === 'number' ? p.low : 0
      return { half: { f1: { linear: { start: 1, end: low } }, f2: { linear: { start: low, end: 1 } } } }
    }
    case 'blink': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      return { half: { f1: { const_value: { value: low } }, f2: { const_value: { value: 1 } } } }
    }
    case 'pulse': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      const staticPhase = typeof p.staticPhase === 'number' ? p.staticPhase : 0
      return { sin: { min: low, max: 1, phase: staticPhase + perRingPhase, repeats: 1 } }
    }
    case 'fade': {
      const start = typeof p.start === 'number' ? p.start : 0
      const end = typeof p.end === 'number' ? p.end : 1
      return { linear: { start, end } }
    }
    default:
      return null
  }
}

/** Convert a legacy hue effect to its equivalent FloatFunc.
 *  Phase is injected into sin.phase for hueShiftSin. */
function legacyHueToFloatFunc(entry: TimeframeEffectEntry, perRingPhase: number): FloatFunc | null {
  const p = entry.params ?? {}
  switch (entry.effectKey) {
    case 'staticHueShift':
      return { const_value: { value: typeof p.value === 'number' ? p.value : 0 } }
    case 'hueShiftStartToEnd': {
      const start = typeof p.start === 'number' ? p.start : 0
      const end = typeof p.end === 'number' ? p.end : 0.5
      return { linear: { start, end } }
    }
    case 'hueShiftSin': {
      const amount = typeof p.amount === 'number' ? p.amount : 0.5
      return { sin: { min: 0, max: amount, phase: perRingPhase, repeats: 1 } }
    }
    default:
      return null
  }
}

/** Convert a legacy motion effect to head/tailLength FloatFuncs + cyclic flag.
 *  Matches the snake params produced by src/effects/motion.ts. */
function legacyMotionToSnakeParams(
  entry: TimeframeEffectEntry,
  perRingPhase: number
): { head: FloatFunc; tailLength: FloatFunc; cyclic: boolean } | null {
  const p = entry.params ?? {}
  switch (entry.effectKey) {
    case 'snakeHeadMove': {
      const start = typeof p.start === 'number' ? p.start : 0
      const end = typeof p.end === 'number' ? p.end : 1
      const tail = typeof p.tail === 'number' ? p.tail : 0.5
      return {
        head: { linear: { start, end } },
        tailLength: { const_value: { value: tail } },
        cyclic: false,
      }
    }
    case 'staticSnake': {
      const start = typeof p.start === 'number' ? p.start : 0
      const end = typeof p.end === 'number' ? p.end : 0.5
      return {
        head: { const_value: { value: start + perRingPhase } },
        tailLength: { const_value: { value: start - end } },
        cyclic: true,
      }
    }
    case 'snake': {
      const tailLen = typeof p.tailLength === 'number' ? p.tailLength : 0.5
      const rev = p.reverse === true
      return {
        head: { linear: { start: rev ? perRingPhase + 1 : perRingPhase, end: rev ? perRingPhase : perRingPhase + 1 } },
        tailLength: { const_value: { value: tailLen } },
        cyclic: p.cyclic === true,
      }
    }
    case 'snakeHeadSin': {
      const tailLen = typeof p.tailLength === 'number' ? p.tailLength : 0.5
      return {
        head: { sin: { min: 0.1, max: 1, phase: perRingPhase, repeats: 1 } },
        tailLength: { const_value: { value: tailLen } },
        cyclic: p.cyclic === true,
      }
    }
    case 'snakeFillGrow': {
      const rev = p.reverse === true
      const f1: FloatFunc = { linear: { start: 0, end: 1 } }
      const f2: FloatFunc = { const_value: { value: 1 } }
      return {
        head: { half: { f1: rev ? f2 : f1, f2: rev ? f1 : f2 } },
        tailLength: { half: { f1: { const_value: { value: 0.5 } }, f2: { linear: { start: 0.5, end: 3 } } } },
        cyclic: false,
      }
    }
    case 'snakeInOut':
      return {
        head: { sin: { min: 0, max: 1, phase: perRingPhase, repeats: 1 } },
        tailLength: { const_value: { value: 0.5 } },
        cyclic: false,
      }
    case 'snakeSlowFast': {
      const tailLen = typeof p.tailLength === 'number' ? p.tailLength : 0.5
      return {
        head: { comb2: {
          f1: { sin: { min: 0, max: 1, phase: perRingPhase, repeats: 1 } },
          amount1: 1,
          f2: { linear: { start: 0, end: 1 } },
          amount2: 1,
        } },
        tailLength: { const_value: { value: tailLen } },
        cyclic: true,
      }
    }
    case 'snakeTailShrinkGrow':
      return {
        head: { sin: { min: 0, max: 1, phase: perRingPhase, repeats: 1 } },
        tailLength: { half: { f1: { linear: { start: 0.5, end: 1 } }, f2: { linear: { start: 1, end: 0.5 } } } },
        cyclic: true,
      }
    case 'snakeHeadSteps': {
      const steps = typeof p.steps === 'number' ? Math.max(1, p.steps) : 4
      const tailLen = typeof p.tailLength === 'number' ? p.tailLength : 0.5
      return {
        head: { steps: { num_steps: steps, diff_per_step: 1 / steps, first_step_value: perRingPhase } },
        tailLength: { const_value: { value: tailLen } },
        cyclic: true,
      }
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Evaluation functions
// ---------------------------------------------------------------------------

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

/** Evaluate a timed/position FloatFunc brightness entry (increase or decrease).
 *  Matches C++ renderer semantics:
 *  - mult_factor_decrease: val *= factor (simple multiply)
 *  - mult_factor_increase: val = val + (1.0 - val) * factor (interpolate towards 1.0) */
function evalBrightnessMult(mult: number, t: number, par: Record<string, unknown>): number {
  if (par.mult_factor_decrease != null) return mult * evalFloat(t, par.mult_factor_decrease as FloatFunc)
  if (par.mult_factor_increase != null) {
    const factor = evalFloat(t, par.mult_factor_increase as FloatFunc)
    return mult + (1.0 - mult) * factor
  }
  return mult
}

/** Standard snake mask: 1 if pixel at relPos is in the lit region, else fade to 0. */
function computeSnakeMask(relPos: number, head: number, tail: number, cyclic: boolean): number {
  if (cyclic) {
    let d = (head - relPos + 1) % 1
    if (d < 0) d += 1
    if (d > 1) d -= 1
    if (d <= tail) return 1
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

/** Brightness mult from timeframe: legacy + timed + position + snake_brightness. */
function getBrightnessMult(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let mult = 1

  // Legacy brightness → FloatFunc conversion
  const legacy = getTimeframeEffects(timeframe).find(e => BRIGHTNESS_KEYS.has(e.effectKey))
  if (legacy) {
    const func = legacyBrightnessToFloatFunc(legacy, entryPhase(legacy, ringIndex))
    if (func) mult *= evalFloat(t, func)
  }

  // Timed brightness
  const timedB = getTimeframeEffects(timeframe).find(e => TIMED_BRIGHTNESS_KEYS.has(e.effectKey))
  if (timedB?.params) {
    const par = timedB.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedB, ringIndex)) % 1 + 1) % 1
    mult = evalBrightnessMult(mult, tShifted, par)
  }
  // Position brightness
  const posB = getTimeframeEffects(timeframe).find(e => POSITION_BRIGHTNESS_KEYS.has(e.effectKey))
  if (posB?.params) {
    const par = posB.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posB, ringIndex)) % 1 + 1) % 1
    mult = evalBrightnessMult(mult, relPosShifted, par)
  }
  // Snake brightness
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
      mult = evalBrightnessMult(mult, snakeIndex, par)
    }
  }
  return mult
}

/** Hue offset from timeframe: legacy + timed + position + snake_hue. */
function getHueOffset(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let offset = 0

  // Legacy hue → FloatFunc conversion
  const legacy = getTimeframeEffects(timeframe).find(e => HUE_KEYS.has(e.effectKey))
  if (legacy) {
    const func = legacyHueToFloatFunc(legacy, entryPhase(legacy, ringIndex))
    if (func) offset += evalFloat(t, func)
  }

  // Timed hue
  const timedH = getTimeframeEffects(timeframe).find(e => TIMED_HUE_KEYS.has(e.effectKey))
  if (timedH?.params) {
    const par = timedH.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedH, ringIndex)) % 1 + 1) % 1
    if (par.offset_factor != null) offset += evalFloat(tShifted, par.offset_factor as FloatFunc)
  }
  // Position hue
  const posH = getTimeframeEffects(timeframe).find(e => POSITION_HUE_KEYS.has(e.effectKey))
  if (posH?.params) {
    const par = posH.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posH, ringIndex)) % 1 + 1) % 1
    if (par.offset_factor != null) offset += evalFloat(relPosShifted, par.offset_factor as FloatFunc)
  }
  // Snake hue
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

/** Saturation mult from timeframe: timed + position + snake_saturation. */
function getSaturationMult(relPos: number, t: number, timeframe: Timeframe, ringIndex: number = 0): number {
  let mult = 1

  const timedS = getTimeframeEffects(timeframe).find(e => TIMED_SATURATION_KEYS.has(e.effectKey))
  if (timedS?.params) {
    const par = timedS.params as Record<string, unknown>
    const tShifted = ((t + entryPhase(timedS, ringIndex)) % 1 + 1) % 1
    mult = evalBrightnessMult(mult, tShifted, par)
  }
  const posS = getTimeframeEffects(timeframe).find(e => POSITION_SATURATION_KEYS.has(e.effectKey))
  if (posS?.params) {
    const par = posS.params as Record<string, unknown>
    const relPosShifted = ((relPos + entryPhase(posS, ringIndex)) % 1 + 1) % 1
    mult = evalBrightnessMult(mult, relPosShifted, par)
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
      mult = evalBrightnessMult(mult, snakeIndex, par)
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
  if (!entry) return 1
  const params = legacyMotionToSnakeParams(entry, entryPhase(entry, ringIndex))
  if (!params) return 1
  const head = evalFloat(t, params.head)
  const tail = evalFloat(t, params.tailLength)
  return computeSnakeMask(relPos, head, tail, params.cyclic)
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

/**
 * Compose effects from multiple overlapping timeframes for a single pixel.
 * Each timeframe contributes independently: brightness & snake mask multiply,
 * hue offsets add, saturation multiplies.
 * Each entry includes its own relPos resolved from that timeframe's mapping segment.
 */
export function getPixelColorMulti(
  timeframesWithT: Array<{ timeframe: Timeframe; t: number; relPos: number }>,
  ringIndex: number = 0
): HSV {
  if (timeframesWithT.length === 0) return { h: 0, s: 0, v: 0 }

  // Base color from first timeframe
  const first = timeframesWithT[0]
  const colorPhaseIntensity = first.timeframe.phase ?? 0
  const colorPerRingPhase = colorPhaseIntensity > 0 ? ringIndex / 12 * colorPhaseIntensity : 0
  let { h, s, v } = getBaseColor(first.relPos, first.timeframe, colorPerRingPhase)

  for (const { timeframe, t, relPos } of timeframesWithT) {
    h = (h + getHueOffset(relPos, t, timeframe, ringIndex)) % 1
    if (h < 0) h += 1
    s *= getSaturationMult(relPos, t, timeframe, ringIndex)
    v *= getBrightnessMult(relPos, t, timeframe, ringIndex)
    if (hasMotionEffect(timeframe)) {
      v *= getSnakeMask(relPos, t, 12, timeframe, ringIndex)
    }
  }
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
