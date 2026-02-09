/**
 * Effect preview: evaluates time- and position-based effects so the playback
 * panel can show how each effect changes the ring pixels as time progresses.
 *
 * Effects (from src/effects):
 * - Coloring: const_color (solid HSV) or rainbow (hue_start → hue_end by position).
 * - Brightness: mult_factor(t) multiplies value (0 = off, 1 = full).
 * - Hue: offset_factor(t) added to hue (0–1 cycle).
 * - Snake: head(t) and tail_length(t); pixels in [head-tail, head] are lit, rest dimmed.
 */

import { Timeframe } from './App'

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

/** Get base color for a pixel from timeframe (rainbow or solid). */
function getBaseColor(
  relPos: number,
  timeframe: Timeframe
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

  const baseHue = hueFromHex(timeframe.color || '#3b82f6')
  if (timeframe.rainbow) {
    const range = timeframe.rainbowRange ?? 1
    const hue = (baseHue + (relPos * range)) % 1
    return { h: hue, s: 1, v: 1 }
  }
  return { h: baseHue, s: 1, v: 1 }
}

/** Brightness mult at time t from timeframe's brightness effect. */
function getBrightnessMult(t: number, timeframe: Timeframe): number {
  const name = timeframe.brightnessEffect
  const p = timeframe.brightnessEffectParams ?? {}

  switch (name) {
    case 'brightness':
      return typeof p.value === 'number' ? p.value : 1
    case 'fadeIn':
      return t
    case 'fadeOut':
      return 1 - t
    case 'fadeInOut': {
      const high = typeof p.high === 'number' ? p.high : 1
      return t < 0.5 ? (t * 2) * high : (1 - (t - 0.5) * 2) * high
    }
    case 'fadeOutIn': {
      const low = typeof p.low === 'number' ? p.low : 0
      return t < 0.5 ? 1 - (t * 2) * (1 - low) : low + ((t - 0.5) * 2) * (1 - low)
    }
    case 'blink': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      return t < 0.5 ? low : 1
    }
    case 'pulse': {
      const low = typeof p.low === 'number' ? p.low : 0.5
      const staticPhase = typeof p.staticPhase === 'number' ? p.staticPhase : 0
      const x = 2 * Math.PI * t + staticPhase
      return low + (1 - low) * 0.5 * (1 + Math.sin(x))
    }
    case 'fade':
      return (typeof p.start === 'number' && typeof p.end === 'number')
        ? p.start + t * (p.end - p.start)
        : 1
    default:
      return 1
  }
}

/** Hue offset at time t from timeframe's hue effect. */
function getHueOffset(t: number, timeframe: Timeframe): number {
  const name = timeframe.hueEffect
  const p = timeframe.hueEffectParams ?? {}

  switch (name) {
    case 'staticHueShift':
      return typeof p.value === 'number' ? p.value : 0
    case 'hueShiftStartToEnd':
      return (typeof p.start === 'number' && typeof p.end === 'number')
        ? p.start + t * (p.end - p.start)
        : 0
    case 'hueShiftSin': {
      const amount = typeof p.amount === 'number' ? p.amount : 0.5
      return amount * 0.5 * (1 + Math.sin(2 * Math.PI * t))
    }
    default:
      return 0
  }
}

/** Snake mask: 1 if pixel at relPos is in the lit tail at time t, else 0 (or fade). */
function getSnakeMask(
  relPos: number,
  t: number,
  numPixelsInRing: number,
  timeframe: Timeframe
): number {
  const name = timeframe.motionEffect
  const p = timeframe.motionEffectParams ?? {}

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
        ? (p.start + t) % 1
        : t
      break
    case 'snake':
      head = p.reverse ? 1 - t : t
      break
    case 'snakeHeadSin':
      head = 0.1 + 0.9 * 0.5 * (1 + Math.sin(2 * Math.PI * t))
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
  return Boolean(timeframe.motionEffect)
}

/**
 * Compute final pixel color for playback preview.
 * relPos: position along ring 0–1, t: normalized time in segment 0–1.
 */
export function getPixelColor(
  relPos: number,
  t: number,
  timeframe: Timeframe
): HSV {
  let { h, s, v } = getBaseColor(relPos, timeframe)

  h = (h + getHueOffset(t, timeframe)) % 1
  if (h < 0) h += 1

  const brightnessMult = getBrightnessMult(t, timeframe)
  const snakeMask = hasMotionEffect(timeframe)
    ? getSnakeMask(relPos, t, 12, timeframe)
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
