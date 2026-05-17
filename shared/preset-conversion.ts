/**
 * Shared preset-to-timeframe conversion logic.
 * Pure data transformation — no browser or Node APIs.
 * Used by both the UI (ui/src/presets.ts) and the CLI generator (src/generate-category-ui-song.ts).
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type FloatFunc = Record<string, unknown>

export interface PresetEffectConfig {
  segments: string
  start_time: number
  end_time: number
  repeat_num?: number
  repeat_start?: number
  repeat_end?: number
}

export interface PresetEffect {
  effect_config: PresetEffectConfig
  const_color?: { color: { hue: number; sat: number; val: number } }
  rainbow?: { hue_start: FloatFunc; hue_end: FloatFunc }
  brightness?: { mult_factor: FloatFunc }
  hue?: { offset_factor: FloatFunc }
  snake?: { head: FloatFunc; tail_length?: FloatFunc; tailLength?: FloatFunc; cyclic?: boolean }
  [key: string]: unknown
}

export interface PresetRingData {
  effects: PresetEffect[]
  duration_ms: number
  num_repeats: number
}

export type PresetData = Record<string, PresetRingData>

export interface TimeframeCycleEntry {
  type: 'cycle'
  beatsInCycle: number
}

export interface TimeframeEffectEntry {
  id: string
  effectKey: string
  params?: Record<string, number | boolean | object>
  phase?: number
}

export interface ConvertedTimeframe {
  id: string
  startTime: number
  endTime: number
  label: string
  color: string
  hasExplicitColor?: boolean
  rings: number[]
  mapping?: string
  phase?: number
  cycles?: TimeframeCycleEntry[]
  effects?: TimeframeEffectEntry[]
}

interface MappedEffect {
  effectKey: string
  params?: Record<string, number | boolean | object>
}

// ── Color helpers ────────────────────────────────────────────────────────

export function hsvToHex(h: number, s: number, v: number): string {
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
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function extractPresetColor(data: PresetData): string {
  const ring1 = data.ring1 ?? data[Object.keys(data).find(k => k.startsWith('ring')) ?? '']
  if (!ring1?.effects) return '#667eea'
  const cc = ring1.effects.find(e => e.const_color)
  if (!cc?.const_color?.color) return '#667eea'
  const { hue, sat, val } = cc.const_color.color
  return hsvToHex(hue, sat, val)
}

export function extractPresetColors(data: PresetData): string[] {
  const ring1 = data.ring1 ?? data[Object.keys(data).find(k => k.startsWith('ring')) ?? '']
  if (!ring1?.effects) return ['#667eea']
  const colors = ring1.effects
    .filter(e => e.const_color?.color)
    .map(e => {
      const { hue, sat, val } = e.const_color!.color
      return hsvToHex(hue, sat, val)
    })
  return colors.length > 0 ? [...new Set(colors)] : ['#667eea']
}

export function summarizePresetEffects(data: PresetData): string {
  const ring1 = data.ring1 ?? data[Object.keys(data).find(k => k.startsWith('ring')) ?? '']
  if (!ring1?.effects) return ''
  const types = new Set<string>()
  for (const e of ring1.effects) {
    if (e.const_color) types.add('color')
    if (e.brightness) types.add('brightness')
    if (e.hue) types.add('hue')
    if (e.snake) types.add('snake')
  }
  return Array.from(types).join(', ')
}

// ── FloatFunc helpers ──────────────────────────────────────────────────────

function getFloatFuncKind(ff: FloatFunc): string | null {
  if (!ff || typeof ff !== 'object') return null
  for (const key of ['const_value', 'constValue', 'linear', 'sin', 'steps', 'half', 'comb2']) {
    if (key in ff) return key === 'constValue' ? 'const_value' : key
  }
  return null
}

function getFloatFuncValue(ff: FloatFunc, kind: string): Record<string, unknown> {
  const r = ff as Record<string, unknown>
  if (kind === 'const_value') return (r.const_value ?? r.constValue ?? {}) as Record<string, unknown>
  return (r[kind] as Record<string, unknown>) ?? {}
}

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps
}

// ── Phase detection helpers ───────────────────────────────────────────────

function getOrderedRings(data: PresetData): PresetRingData[] {
  const rings: PresetRingData[] = []
  for (let i = 1; i <= 12; i++) {
    if (data[`ring${i}`]) rings.push(data[`ring${i}`])
  }
  return rings
}

function detectPhaseIntensity(
  rings: PresetRingData[],
  extractor: (ring: PresetRingData) => number | null | undefined,
  tolerance = 0.02,
): number {
  if (rings.length < 2) return 0
  const values: number[] = []
  for (const ring of rings) {
    const v = extractor(ring)
    if (v == null) return 0
    values.push(v)
  }
  const delta = values[1] - values[0]
  if (Math.abs(delta) < tolerance) return 0
  for (let i = 2; i < values.length; i++) {
    if (!approxEqual(values[i] - values[i - 1], delta, tolerance)) return 0
  }
  const raw = delta * rings.length
  const rounded = Math.round(raw * 100) / 100
  return rounded
}

function isWindowedFade(effect: PresetEffect): boolean {
  const cfg = effect.effect_config
  if (!cfg || cfg.repeat_num !== 1) return false
  const start = cfg.repeat_start ?? 0
  const end = cfg.repeat_end ?? 1
  return (end - start) < 0.05
}

function findRingEffect(ring: PresetRingData, pred: (e: PresetEffect) => boolean): PresetEffect | undefined {
  return ring.effects.find(pred)
}

/** Extract the numeric value from a const_value FloatFunc. */
function extractConstValue(ff: FloatFunc): number {
  const kind = getFloatFuncKind(ff)
  if (kind === 'const_value') {
    const v = getFloatFuncValue(ff, 'const_value')
    return Number(v.value ?? 0)
  }
  return 0
}

function extractColorHue(ring: PresetRingData, segment: string): number | null {
  const e = findRingEffect(ring, e => e.const_color != null && (e.effect_config?.segments ?? 'all') === segment)
  return e?.const_color?.color?.hue ?? null
}

function extractRainbowHueStart(ring: PresetRingData, segment: string): number | null {
  const e = findRingEffect(ring, e => e.rainbow != null && (e.effect_config?.segments ?? 'all') === segment)
  if (!e?.rainbow?.hue_start) return null
  return extractConstValue(e.rainbow.hue_start)
}

function extractBrightnessSinPhase(ring: PresetRingData, segment: string): number | null {
  const e = findRingEffect(ring, e =>
    e.brightness != null && (e.effect_config?.segments ?? 'all') === segment && !isWindowedFade(e),
  )
  if (!e?.brightness?.mult_factor) return null
  const kind = getFloatFuncKind(e.brightness.mult_factor)
  if (kind !== 'sin') return null
  const v = getFloatFuncValue(e.brightness.mult_factor, 'sin')
  return Number(v.phase ?? 0)
}

function extractSnakePhase(ring: PresetRingData, segment: string): number | null {
  const e = findRingEffect(ring, e => e.snake != null && (e.effect_config?.segments ?? 'all') === segment)
  if (!e?.snake?.head) return null
  const headKind = getFloatFuncKind(e.snake.head)
  if (headKind === 'comb2') {
    const comb2 = getFloatFuncValue(e.snake.head, 'comb2')
    const f1 = comb2.f1 as FloatFunc | undefined
    if (f1 && getFloatFuncKind(f1) === 'sin') {
      return Number(getFloatFuncValue(f1, 'sin').phase ?? 0)
    }
  }
  if (headKind === 'sin') {
    return Number(getFloatFuncValue(e.snake.head, 'sin').phase ?? 0)
  }
  if (headKind === 'linear') {
    return Number(getFloatFuncValue(e.snake.head, 'linear').start ?? 0)
  }
  return null
}

// ── Reverse mappers ────────────────────────────────────────────────────────

function reverseMapBrightness(multFactor: FloatFunc): MappedEffect {
  const kind = getFloatFuncKind(multFactor)
  if (!kind) return { effectKey: 'brightness', params: { value: 1 } }

  if (kind === 'const_value') {
    const v = getFloatFuncValue(multFactor, kind)
    return { effectKey: 'brightness', params: { value: Number(v.value ?? 1) } }
  }

  if (kind === 'linear') {
    const v = getFloatFuncValue(multFactor, kind)
    const start = Number(v.start ?? 0)
    const end = Number(v.end ?? 1)
    if (approxEqual(start, 0) && approxEqual(end, 1)) return { effectKey: 'fadeIn' }
    if (approxEqual(start, 1) && approxEqual(end, 0)) return { effectKey: 'fadeOut' }
    return { effectKey: 'fade', params: { start, end } }
  }

  if (kind === 'sin') {
    const v = getFloatFuncValue(multFactor, kind)
    const min = Number(v.min ?? 0)
    const max = Number(v.max ?? 1)
    const phase = Number(v.phase ?? 0)
    const repeats = Number(v.repeats ?? 1)
    if (approxEqual(max, 1) && approxEqual(repeats, 1)) {
      return { effectKey: 'pulse', params: { low: min, staticPhase: phase } }
    }
    return {
      effectKey: 'timed_brightness',
      params: { mult_factor_decrease: { sin: { min, max, phase, repeats } } },
    }
  }

  if (kind === 'half') {
    const v = getFloatFuncValue(multFactor, kind)
    const f1 = v.f1 as FloatFunc | undefined
    const f2 = v.f2 as FloatFunc | undefined
    if (f1 && f2) {
      const k1 = getFloatFuncKind(f1)
      const k2 = getFloatFuncKind(f2)
      if (k1 === 'linear' && k2 === 'linear') {
        const v1 = getFloatFuncValue(f1, 'linear')
        const v2 = getFloatFuncValue(f2, 'linear')
        if (approxEqual(Number(v1.start ?? 0), 0) && approxEqual(Number(v2.end ?? 0), 0)) {
          return { effectKey: 'fadeInOut', params: { high: Number(v1.end ?? 1) } }
        }
        if (approxEqual(Number(v1.start ?? 1), 1) && approxEqual(Number(v2.end ?? 1), 1)) {
          return { effectKey: 'fadeOutIn', params: { low: Number(v1.end ?? 0) } }
        }
      }
      if (k1 === 'const_value' && k2 === 'const_value') {
        const v1 = getFloatFuncValue(f1, 'const_value')
        const v2 = getFloatFuncValue(f2, 'const_value')
        const lo = Math.min(Number(v1.value ?? 0), Number(v2.value ?? 1))
        return { effectKey: 'blink', params: { low: lo } }
      }
    }
  }

  if (kind === 'steps') {
    const v = getFloatFuncValue(multFactor, kind)
    return {
      effectKey: 'timed_brightness',
      params: { mult_factor_decrease: { steps: v } },
    }
  }

  // Fallback: wrap entire FloatFunc as raw timed_brightness
  return {
    effectKey: 'timed_brightness',
    params: { mult_factor_decrease: multFactor },
  }
}

function reverseMapHue(offsetFactor: FloatFunc): MappedEffect {
  const kind = getFloatFuncKind(offsetFactor)
  if (!kind) return { effectKey: 'staticHueShift', params: { value: 0 } }

  if (kind === 'const_value') {
    const v = getFloatFuncValue(offsetFactor, kind)
    return { effectKey: 'staticHueShift', params: { value: Number(v.value ?? 0) } }
  }

  if (kind === 'linear') {
    const v = getFloatFuncValue(offsetFactor, kind)
    return {
      effectKey: 'hueShiftStartToEnd',
      params: { start: Number(v.start ?? 0), end: Number(v.end ?? 1) },
    }
  }

  if (kind === 'sin') {
    const v = getFloatFuncValue(offsetFactor, kind)
    return { effectKey: 'hueShiftSin', params: { amount: Number(v.max ?? 0.5) } }
  }

  // Fallback to raw timed_hue
  return {
    effectKey: 'timed_hue',
    params: { offset_factor: offsetFactor },
  }
}

function reverseMapSnake(snakeObj: NonNullable<PresetEffect['snake']>): MappedEffect {
  const head = snakeObj.head
  const tail = snakeObj.tail_length ?? snakeObj.tailLength ?? { const_value: { value: 0.5 } }
  const cyclic = snakeObj.cyclic ?? false

  const headKind = getFloatFuncKind(head)
  const tailKind = getFloatFuncKind(tail as FloatFunc)

  let tailValue = 0.5
  if (tailKind === 'const_value') {
    const tv = getFloatFuncValue(tail as FloatFunc, 'const_value')
    tailValue = Number(tv.value ?? 0.5)
  }

  if (headKind === 'const_value') {
    const hv = getFloatFuncValue(head, 'const_value')
    const headPos = Number(hv.value ?? 0)
    return {
      effectKey: 'staticSnake',
      params: { start: headPos, end: headPos - tailValue },
    }
  }

  if (headKind === 'linear') {
    const hv = getFloatFuncValue(head, 'linear')
    const start = Number(hv.start ?? 0)
    const end = Number(hv.end ?? 1)
    if (approxEqual(start, 0) && approxEqual(end, 1)) {
      return {
        effectKey: 'snake',
        params: { tailLength: tailValue, cyclic, reverse: false },
      }
    }
    if (approxEqual(start, 1) && approxEqual(end, 0)) {
      return {
        effectKey: 'snake',
        params: { tailLength: tailValue, cyclic, reverse: true },
      }
    }
    return {
      effectKey: 'snakeHeadMove',
      params: { start, end, tail: tailValue },
    }
  }

  if (headKind === 'sin') {
    return {
      effectKey: 'snakeHeadSin',
      params: { tailLength: tailValue, cyclic },
    }
  }

  if (headKind === 'steps') {
    const hv = getFloatFuncValue(head, 'steps')
    const steps = Number(hv.num_steps ?? 4)
    return {
      effectKey: 'snakeHeadSteps',
      params: { steps, tailLength: tailValue },
    }
  }

  if (headKind === 'half') {
    if (tailKind === 'half') {
      return { effectKey: 'snakeFillGrow', params: { reverse: false } }
    }
    return { effectKey: 'snakeFillGrow', params: { reverse: false } }
  }

  if (headKind === 'comb2') {
    return {
      effectKey: 'snakeSlowFast',
      params: { tailLength: tailValue },
    }
  }

  // Fallback: generic snake with default params
  return {
    effectKey: 'snake',
    params: { tailLength: tailValue, cyclic },
  }
}

// ── Main conversion ────────────────────────────────────────────────────────

export interface PresetToTimeframesOptions {
  data: PresetData
  displayName: string
  insertBeat: number
  durationBeats: number
  bpm: number
  /** Generate a unique ID for each timeframe. Called with (segIdx). */
  generateId: (segIdx: number) => string
  /** Generate a unique ID for each effect entry. Called with (segIdx, effectIdx). */
  generateEffectId: (segIdx: number, effectIdx: number) => string
}

export function presetToTimeframes(opts: PresetToTimeframesOptions): ConvertedTimeframe[] {
  const { data, displayName, insertBeat, durationBeats, bpm, generateId, generateEffectId } = opts

  const orderedRings = getOrderedRings(data)
  if (orderedRings.length === 0) return []

  const ring1 = orderedRings[0]
  if (!ring1?.effects?.length) return []

  // Group effects by segment (from ring1)
  const segmentGroups = new Map<string, PresetEffect[]>()
  for (const effect of ring1.effects) {
    const seg = effect.effect_config?.segments ?? 'all'
    if (!segmentGroups.has(seg)) segmentGroups.set(seg, [])
    segmentGroups.get(seg)!.push(effect)
  }

  const timeframes: ConvertedTimeframe[] = []
  const segEntries = [...segmentGroups.entries()]

  // Check if any segment group in this preset has a color source (const_color or rainbow)
  const anySegmentHasColor = segEntries.some(([_, effects]) => effects.some(e => e.const_color || e.rainbow))

  for (let segIdx = 0; segIdx < segEntries.length; segIdx++) {
    const [segment, effects] = segEntries[segIdx]

    // Extract color from const_color or rainbow effect in this segment group
    const colorEffect = effects.find(e => e.const_color)
    const rainbowEffect = effects.find(e => e.rainbow)
    let color = '#3b82f6' // default blue
    let hasExplicitColor: boolean | undefined = undefined
    let colorPhase: number | undefined = undefined
    if (colorEffect?.const_color?.color) {
      const { hue, sat, val } = colorEffect.const_color.color
      color = hsvToHex(hue, sat, val)
      // Detect per-ring hue progression
      if (orderedRings.length > 1) {
        const intensity = detectPhaseIntensity(orderedRings, r => extractColorHue(r, segment))
        if (intensity !== 0) colorPhase = intensity
      }
    } else if (rainbowEffect?.rainbow) {
      // Rainbow: use hue_start as base color
      const hueStart = extractConstValue(rainbowEffect.rainbow.hue_start)
      color = hsvToHex(hueStart, 1, 1)
      // Detect per-ring rainbow phase progression
      if (orderedRings.length > 1) {
        const intensity = detectPhaseIntensity(orderedRings, r => extractRainbowHueStart(r, segment))
        if (intensity !== 0) colorPhase = intensity
      }
    } else if (anySegmentHasColor) {
      // This segment has no color source but another segment does — mark as "No color"
      // so it inherits color from overlapping timeframes instead of overriding with default blue
      hasExplicitColor = false
    }

    // Build effect entries from non-const_color, non-windowed-fade effects
    const effectEntries: TimeframeEffectEntry[] = []
    let cycles: TimeframeCycleEntry[] | undefined

    // Rainbow → position_hue: translate rainbow hue gradient into a position_hue effect
    if (rainbowEffect?.rainbow) {
      const hueStart = extractConstValue(rainbowEffect.rainbow.hue_start)
      const hueEnd = extractConstValue(rainbowEffect.rainbow.hue_end)
      const hueRange = hueEnd - hueStart
      if (Math.abs(hueRange) > 0.001) {
        effectEntries.push({
          id: generateEffectId(segIdx, effectEntries.length),
          effectKey: 'position_hue',
          params: { offset_factor: { linear: { start: 0, end: hueRange } } },
        })
      }
    }

    for (const effect of effects) {
      if (effect.const_color) continue
      if (effect.rainbow) continue
      if (isWindowedFade(effect)) continue

      let mapped: MappedEffect | null = null
      let effectPhase: number | undefined = undefined

      if (effect.brightness?.mult_factor) {
        mapped = reverseMapBrightness(effect.brightness.mult_factor)
        // Detect per-ring brightness sin phase progression
        if (orderedRings.length > 1 && getFloatFuncKind(effect.brightness.mult_factor) === 'sin') {
          const intensity = detectPhaseIntensity(orderedRings, r => extractBrightnessSinPhase(r, segment))
          if (intensity !== 0) effectPhase = intensity
        }
      } else if (effect.hue?.offset_factor) {
        mapped = reverseMapHue(effect.hue.offset_factor)
      } else if (effect.snake) {
        mapped = reverseMapSnake(effect.snake)
        // Detect per-ring snake phase progression
        if (orderedRings.length > 1) {
          const intensity = detectPhaseIntensity(orderedRings, r => extractSnakePhase(r, segment))
          if (intensity !== 0) effectPhase = intensity
        }
      }

      if (mapped) {
        effectEntries.push({
          id: generateEffectId(segIdx, effectEntries.length),
          effectKey: mapped.effectKey,
          params: mapped.params,
          ...(effectPhase != null ? { phase: effectPhase } : {}),
        })
      }

      // Extract cycle info from repeat_num (use first one found)
      if (!cycles && effect.effect_config?.repeat_num && effect.effect_config.repeat_num > 1) {
        const repeatNum = effect.effect_config.repeat_num
        const presetDurationMs = ring1.duration_ms
        const msPerCycle = presetDurationMs / repeatNum
        const msPerBeat = 60000 / bpm
        const beatsInCycle = Math.round((msPerCycle / msPerBeat) * 100) / 100
        if (beatsInCycle > 0) {
          cycles = [{ type: 'cycle' as const, beatsInCycle }]
        }
      }
    }

    const label = segEntries.length > 1
      ? `${displayName} (${segment})`
      : displayName

    timeframes.push({
      id: generateId(segIdx),
      startTime: insertBeat,
      endTime: insertBeat + durationBeats,
      label,
      color,
      ...(hasExplicitColor != null ? { hasExplicitColor } : {}),
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: segment === 'all' ? undefined : segment,
      ...(colorPhase != null ? { phase: colorPhase } : {}),
      cycles,
      effects: effectEntries.length > 0 ? effectEntries : undefined,
    })
  }

  return timeframes
}
