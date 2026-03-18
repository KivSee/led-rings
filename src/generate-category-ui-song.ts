/**
 * Generates an "All<Category>.json" UI song file from all presets in a category.
 * Each preset occupies 30 seconds (at the given BPM), allowing the user to preview
 * every preset in sequence by loading the file into the timeline UI.
 *
 * Usage:
 *   yarn gen-ui-song <category> [bpm]
 *   yarn gen-ui-song party 120
 *   yarn gen-ui-song chill 90
 */

import * as fs from 'fs'
import * as path from 'path'

// ── Types (mirrored from ui/src/App.tsx) ──────────────────────────────────────

interface TimeframeCycleEntry {
  type: 'cycle'
  beatsInCycle: number
}

interface TimeframeEffectEntry {
  id: string
  effectKey: string
  params?: Record<string, number | boolean | object>
  phase?: number
}

interface Timeframe {
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

interface Song {
  name: string
  lengthSeconds: number
  bpm: number
  animationType?: string
}

// ── Preset types (mirrored from ui/src/presets.ts) ────────────────────────────

type FloatFunc = Record<string, unknown>

interface PresetEffectConfig {
  segments: string
  start_time: number
  end_time: number
  repeat_num?: number
  repeat_start?: number
  repeat_end?: number
}

interface PresetEffect {
  effect_config: PresetEffectConfig
  const_color?: { color: { hue: number; sat: number; val: number } }
  brightness?: { mult_factor: FloatFunc }
  hue?: { offset_factor: FloatFunc }
  snake?: { head: FloatFunc; tail_length?: FloatFunc; tailLength?: FloatFunc; cyclic?: boolean }
  [key: string]: unknown
}

interface PresetRingData {
  effects: PresetEffect[]
  duration_ms: number
  num_repeats: number
}

type PresetData = Record<string, PresetRingData>

// ── Helpers ───────────────────────────────────────────────────────────────────

function hsvToHex(h: number, s: number, v: number): string {
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

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps
}

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

function isWindowedFade(effect: PresetEffect): boolean {
  const cfg = effect.effect_config
  if (!cfg || cfg.repeat_num !== 1) return false
  const start = cfg.repeat_start ?? 0
  const end = cfg.repeat_end ?? 1
  return (end - start) < 0.05
}

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
  return Math.round(delta * rings.length * 100) / 100
}

function extractColorHue(ring: PresetRingData, segment: string): number | null {
  const e = ring.effects.find(e => e.const_color != null && (e.effect_config?.segments ?? 'all') === segment)
  return e?.const_color?.color?.hue ?? null
}

function extractBrightnessSinPhase(ring: PresetRingData, segment: string): number | null {
  const e = ring.effects.find(e =>
    e.brightness != null && (e.effect_config?.segments ?? 'all') === segment && !isWindowedFade(e),
  )
  if (!e?.brightness?.mult_factor) return null
  const kind = getFloatFuncKind(e.brightness.mult_factor)
  if (kind !== 'sin') return null
  const v = getFloatFuncValue(e.brightness.mult_factor, 'sin')
  return Number(v.phase ?? 0)
}

function extractSnakePhase(ring: PresetRingData, segment: string): number | null {
  const e = ring.effects.find(e => e.snake != null && (e.effect_config?.segments ?? 'all') === segment)
  if (!e?.snake?.head) return null
  const headKind = getFloatFuncKind(e.snake.head)
  if (headKind === 'comb2') {
    const comb2 = getFloatFuncValue(e.snake.head, 'comb2')
    const f1 = comb2.f1 as FloatFunc | undefined
    if (f1 && getFloatFuncKind(f1) === 'sin') {
      return Number(getFloatFuncValue(f1, 'sin').phase ?? 0)
    }
  }
  if (headKind === 'sin') return Number(getFloatFuncValue(e.snake.head, 'sin').phase ?? 0)
  if (headKind === 'linear') return Number(getFloatFuncValue(e.snake.head, 'linear').start ?? 0)
  return null
}

// ── Reverse mappers (mirrored from ui/src/presets.ts) ─────────────────────────

interface MappedEffect {
  effectKey: string
  params?: Record<string, number | boolean | object>
}

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
    return { effectKey: 'timed_brightness', params: { mult_factor_decrease: { sin: { min, max, phase, repeats } } } }
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
        if (approxEqual(Number(v1.start ?? 0), 0) && approxEqual(Number(v2.end ?? 0), 0))
          return { effectKey: 'fadeInOut', params: { high: Number(v1.end ?? 1) } }
        if (approxEqual(Number(v1.start ?? 1), 1) && approxEqual(Number(v2.end ?? 1), 1))
          return { effectKey: 'fadeOutIn', params: { low: Number(v1.end ?? 0) } }
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
    return { effectKey: 'timed_brightness', params: { mult_factor_decrease: { steps: v } } }
  }
  return { effectKey: 'timed_brightness', params: { mult_factor_decrease: multFactor } }
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
    return { effectKey: 'hueShiftStartToEnd', params: { start: Number(v.start ?? 0), end: Number(v.end ?? 1) } }
  }
  if (kind === 'sin') {
    const v = getFloatFuncValue(offsetFactor, kind)
    return { effectKey: 'hueShiftSin', params: { amount: Number(v.max ?? 0.5) } }
  }
  return { effectKey: 'timed_hue', params: { offset_factor: offsetFactor } }
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
    return { effectKey: 'staticSnake', params: { start: headPos, end: headPos - tailValue } }
  }
  if (headKind === 'linear') {
    const hv = getFloatFuncValue(head, 'linear')
    const start = Number(hv.start ?? 0)
    const end = Number(hv.end ?? 1)
    if (approxEqual(start, 0) && approxEqual(end, 1))
      return { effectKey: 'snake', params: { tailLength: tailValue, cyclic, reverse: false } }
    if (approxEqual(start, 1) && approxEqual(end, 0))
      return { effectKey: 'snake', params: { tailLength: tailValue, cyclic, reverse: true } }
    return { effectKey: 'snakeHeadMove', params: { start, end, tail: tailValue } }
  }
  if (headKind === 'sin') return { effectKey: 'snakeHeadSin', params: { tailLength: tailValue, cyclic } }
  if (headKind === 'steps') {
    const hv = getFloatFuncValue(head, 'steps')
    return { effectKey: 'snakeHeadSteps', params: { steps: Number(hv.num_steps ?? 4), tailLength: tailValue } }
  }
  if (headKind === 'half') {
    return { effectKey: 'snakeFillGrow', params: { reverse: false } }
  }
  if (headKind === 'comb2') return { effectKey: 'snakeSlowFast', params: { tailLength: tailValue } }
  return { effectKey: 'snake', params: { tailLength: tailValue, cyclic } }
}

// ── Core conversion ───────────────────────────────────────────────────────────

function presetToTimeframes(
  data: PresetData,
  displayName: string,
  insertBeat: number,
  durationBeats: number,
  bpm: number,
): Timeframe[] {
  const orderedRings = getOrderedRings(data)
  if (orderedRings.length === 0) return []
  const ring1 = orderedRings[0]
  if (!ring1?.effects?.length) return []

  const segmentGroups = new Map<string, PresetEffect[]>()
  for (const effect of ring1.effects) {
    const seg = effect.effect_config?.segments ?? 'all'
    if (!segmentGroups.has(seg)) segmentGroups.set(seg, [])
    segmentGroups.get(seg)!.push(effect)
  }

  const timeframes: Timeframe[] = []
  const segEntries = [...segmentGroups.entries()]

  for (let segIdx = 0; segIdx < segEntries.length; segIdx++) {
    const [segment, effects] = segEntries[segIdx]

    const colorEffect = effects.find(e => e.const_color)
    let color = '#3b82f6'
    let colorPhase: number | undefined = undefined
    if (colorEffect?.const_color?.color) {
      const { hue, sat, val } = colorEffect.const_color.color
      color = hsvToHex(hue, sat, val)
      if (orderedRings.length > 1) {
        const intensity = detectPhaseIntensity(orderedRings, r => extractColorHue(r, segment))
        if (intensity !== 0) colorPhase = intensity
      }
    }

    const effectEntries: TimeframeEffectEntry[] = []
    let cycles: TimeframeCycleEntry[] | undefined

    for (const effect of effects) {
      if (effect.const_color) continue
      if (isWindowedFade(effect)) continue

      let mapped: MappedEffect | null = null
      let effectPhase: number | undefined = undefined

      if (effect.brightness?.mult_factor) {
        mapped = reverseMapBrightness(effect.brightness.mult_factor)
        if (orderedRings.length > 1 && getFloatFuncKind(effect.brightness.mult_factor) === 'sin') {
          const intensity = detectPhaseIntensity(orderedRings, r => extractBrightnessSinPhase(r, segment))
          if (intensity !== 0) effectPhase = intensity
        }
      } else if (effect.hue?.offset_factor) {
        mapped = reverseMapHue(effect.hue.offset_factor)
      } else if (effect.snake) {
        mapped = reverseMapSnake(effect.snake)
        if (orderedRings.length > 1) {
          const intensity = detectPhaseIntensity(orderedRings, r => extractSnakePhase(r, segment))
          if (intensity !== 0) effectPhase = intensity
        }
      }

      if (mapped) {
        effectEntries.push({
          id: `gen-${segIdx}-${effectEntries.length}`,
          effectKey: mapped.effectKey,
          params: mapped.params,
          ...(effectPhase != null ? { phase: effectPhase } : {}),
        })
      }

      if (!cycles && effect.effect_config?.repeat_num && effect.effect_config.repeat_num > 1) {
        const repeatNum = effect.effect_config.repeat_num
        const msPerCycle = ring1.duration_ms / repeatNum
        const msPerBeat = 60000 / bpm
        const beatsInCycle = Math.round((msPerCycle / msPerBeat) * 100) / 100
        if (beatsInCycle > 0) {
          cycles = [{ type: 'cycle', beatsInCycle }]
        }
      }
    }

    const label = segEntries.length > 1
      ? `${displayName} (${segment})`
      : displayName

    timeframes.push({
      id: `gen-${displayName}-${segIdx}`,
      startTime: insertBeat,
      endTime: insertBeat + durationBeats,
      label,
      color,
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: segment === 'all' ? undefined : segment,
      ...(colorPhase != null ? { phase: colorPhase } : {}),
      cycles,
      effects: effectEntries.length > 0 ? effectEntries : undefined,
    })
  }

  return timeframes
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PRESET_DURATION_SECONDS = 30

const generate = (categoryName: string, bpm: number) => {
  const presetsDir = path.join(__dirname, '..', 'presets', categoryName)

  if (!fs.existsSync(presetsDir)) {
    console.error(`Preset directory not found: ${presetsDir}`)
    console.log('Available categories: party, chill, mystery, psychedelic, background')
    process.exit(1)
  }

  const files = fs.readdirSync(presetsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  if (files.length === 0) {
    console.log(`No preset files found in ${categoryName}`)
    process.exit(1)
  }

  const beatsPerPreset = (PRESET_DURATION_SECONDS * bpm) / 60
  const totalBeats = files.length * beatsPerPreset
  const totalSeconds = files.length * PRESET_DURATION_SECONDS

  const allTimeframes: Timeframe[] = []

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(presetsDir, files[i])
    const displayName = files[i].replace('.json', '').replace(/_/g, ' ')
    const data: PresetData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const insertBeat = i * beatsPerPreset

    const tfs = presetToTimeframes(data, displayName, insertBeat, beatsPerPreset, bpm)
    allTimeframes.push(...tfs)
    console.log(`[${i + 1}/${files.length}] ${displayName}: ${tfs.length} timeframe(s) at beat ${insertBeat}`)
  }

  const categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
  const song: Song = {
    name: `All ${categoryTitle}`,
    lengthSeconds: totalSeconds,
    bpm,
    animationType: 'trigger',
  }

  const payload = { song, timeframes: allTimeframes }

  const outDir = path.join(__dirname, '..', 'ui', 'public', 'category-previews')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `All${categoryTitle}.json`)
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))

  console.log(`\nGenerated ${files.length} presets (${totalBeats} beats / ${totalSeconds}s at ${bpm} BPM)`)
  console.log(`Saved to: ${outPath}`)
}

const categoryArg = process.argv[2]
const bpmArg = Number(process.argv[3]) || 120

if (!categoryArg) {
  console.log('Usage: yarn gen-ui-song <category> [bpm]')
  console.log('Example: yarn gen-ui-song party 120')
  process.exit(1)
}

generate(categoryArg, bpmArg)
