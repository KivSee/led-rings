/**
 * Generates TypeScript source that mirrors the Timeline Manager UI (song + timeframes).
 * Output matches the pattern used in src/buttons.ts, src/index.ts, src/agent.ts.
 */

export interface Song {
  name: string
  lengthBeats: number
  bpm: number
  startOffsetMs?: number
}

export interface Timeframe {
  id: string
  startTime: number
  endTime: number
  label: string
  color: string
  rings: number[]
  mapping?: string
  rainbow?: boolean
  rainbowRange?: number
  brightnessEffect?: string
  brightnessEffectParams?: Record<string, number | boolean>
  hueEffect?: string
  hueEffectParams?: Record<string, number | boolean>
  motionEffect?: string
  motionEffectParams?: Record<string, number | boolean>
}

const RINGS_ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const RINGS_EVEN = [2, 4, 6, 8, 10, 12]
const RINGS_ODD = [1, 3, 5, 7, 9, 11]
const RINGS_LEFT = [1, 2, 3, 4, 5, 6]
const RINGS_RIGHT = [7, 8, 9, 10, 11, 12]
const RINGS_CENTER = [4, 5, 6, 7, 8, 9]

function sameRings(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}

function ringsToElementsArg(rings: number[]): string {
  if (sameRings(rings, RINGS_ALL)) return 'all'
  if (sameRings(rings, RINGS_EVEN)) return 'even'
  if (sameRings(rings, RINGS_ODD)) return 'odd'
  if (sameRings(rings, RINGS_LEFT)) return 'left'
  if (sameRings(rings, RINGS_RIGHT)) return 'right'
  if (sameRings(rings, RINGS_CENTER)) return 'center'
  return `[${rings.sort((a, b) => a - b).join(', ')}]`
}

const UI_MAPPING_TO_SEGMENT: Record<string, string> = {
  all: 'segment_all',
  arc: 'segment_arc',
  ind: 'segment_ind',
  b1: 'segment_b1',
  b2: 'segment_b2',
  centric: 'segment_centric',
  updown: 'segment_updown',
  rand: 'segment_rand',
}

function mappingToSegment(mapping: string | undefined): string {
  const key = (mapping || 'all').toLowerCase()
  return UI_MAPPING_TO_SEGMENT[key] ?? 'segment_all'
}

/** Hex #rrggbb → { h, s, v } in 0–1 (hue matches TS convention) */
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  h = h / 6
  if (h < 0) h += 1
  return { h, s, v }
}

function formatParamValue(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toFixed(4)))
}

function formatEffectParams(params: Record<string, number | boolean> | undefined, schema?: { key: string }[]): string {
  if (!params || Object.keys(params).length === 0) return ''
  const keys = schema ? schema.map((s) => s.key) : Object.keys(params)
  const parts = keys
    .filter((k) => params[k] !== undefined)
    .map((k) => `${k}: ${formatParamValue(params[k]!)}`)
  if (parts.length === 0) return ''
  return `{ ${parts.join(', ')} }`
}

function emitColor(tf: Timeframe): string[] {
  const lines: string[] = []
  if (tf.rainbow) {
    const { h } = hexToHsv(tf.color)
    const range = tf.rainbowRange ?? 1
    lines.push(`rainbow({ startHue: ${h.toFixed(4)}, endHue: ${(h + range).toFixed(4)} })`)
  } else {
    const { h, s, v } = hexToHsv(tf.color)
    lines.push(`constColor({ hue: ${h.toFixed(4)}, sat: ${s.toFixed(4)}, val: ${v.toFixed(4)} })`)
  }
  return lines
}

function emitBrightnessEffect(tf: Timeframe): string[] {
  const eff = tf.brightnessEffect
  if (!eff) return []
  const params = tf.brightnessEffectParams
  const schemas: Record<string, { key: string }[]> = {
    brightness: [{ key: 'value' }],
    fadeInOut: [{ key: 'high' }],
    fadeOutIn: [{ key: 'low' }],
    blink: [{ key: 'low' }],
    pulse: [{ key: 'low' }, { key: 'staticPhase' }],
    fade: [{ key: 'start' }, { key: 'end' }],
  }
  const schema = schemas[eff]
  const args = formatEffectParams(params, schema)
  if (eff === 'brightness' && args) return [`brightness(${args})`]
  if (eff === 'fadeIn') return ['fadeIn()']
  if (eff === 'fadeOut') return ['fadeOut()']
  if (eff === 'fadeInOut') return [args ? `fadeInOut(${args})` : 'fadeInOut()']
  if (eff === 'fadeOutIn') return [args ? `fadeOutIn(${args})` : 'fadeOutIn()']
  if (eff === 'blink') return [args ? `blink(${args})` : 'blink()']
  if (eff === 'pulse') return [args ? `pulse(${args})` : 'pulse()']
  if (eff === 'fade') return [args ? `fade(${args})` : 'fade()']
  return []
}

function emitHueEffect(tf: Timeframe): string[] {
  const eff = tf.hueEffect
  if (!eff) return []
  const params = tf.hueEffectParams
  const args = formatEffectParams(params)
  if (eff === 'staticHueShift') return [params?.value !== undefined ? `staticHueShift({ value: ${formatParamValue(params.value)} })` : 'staticHueShift()']
  if (eff === 'hueShiftStartToEnd') return [args ? `hueShiftStartToEnd(${args})` : 'hueShiftStartToEnd()']
  if (eff === 'hueShiftSin') return [args ? `hueShiftSin(${args})` : 'hueShiftSin()']
  return []
}

function emitMotionEffect(tf: Timeframe): string[] {
  const eff = tf.motionEffect
  if (!eff) return []
  const params = tf.motionEffectParams
  const args = formatEffectParams(params)
  if (eff === 'snakeFillGrow') {
    const reverse = params?.reverse === true
    return [reverse ? 'snakeFillGrow(true)' : 'snakeFillGrow()']
  }
  if (eff === 'snakeInOut') return [args ? `snakeInOut(${args})` : 'snakeInOut()']
  if (eff === 'snakeTailShrinkGrow') return ['snakeTailShrinkGrow()']
  if (eff === 'snakeHeadMove' || eff === 'staticSnake' || eff === 'snake' || eff === 'snakeHeadSin' || eff === 'snakeSlowFast' || eff === 'snakeHeadSteps') {
    return [args ? `${eff}(${args})` : `${eff}()`]
  }
  return []
}

function emitTimeframeBody(tf: Timeframe): string {
  const segmentId = mappingToSegment(tf.mapping)
  const elementsArg = ringsToElementsArg(tf.rings)
  const inner: string[] = []
  inner.push(...emitColor(tf))
  inner.push(...emitHueEffect(tf))
  inner.push(...emitBrightnessEffect(tf))
  inner.push(...emitMotionEffect(tf))
  const innerLines = inner.length ? inner.map((l) => `            ${l}`).join('\n') : '            // no effects'
  return `    beats(${tf.startTime}, ${tf.endTime}, () => {
      elements(${elementsArg}, () => {
        segment(${segmentId}, () => {
${innerLines}
        });
      });
    })`
}

export function generateSequenceTs(song: Song, timeframes: Timeframe[]): string {
  const safeName = (song.name || 'sequence').trim() || 'sequence'
  const totalTimeSeconds = (song.lengthBeats / song.bpm) * 60
  const startOffsetMs = song.startOffsetMs ?? 0
  const bodyBlocks = timeframes.length === 0
    ? '    // Empty: add beats() blocks and content here.'
    : timeframes.map(emitTimeframeBody).join('\n\n')

  return `// Generated from Timeline Manager. Place this file in your project's src/ so imports resolve.
import { sendSequence } from "./services/sequence";
import { startSong } from "./services/trigger";
import { Animation } from "./animation/animation";
import { beats } from "./time/time";
import { constColor, noColor, rainbow } from "./effects/coloring";
import {
  blink,
  brightness,
  fade,
  fadeIn,
  fadeInOut,
  fadeOut,
  fadeOutIn,
  pulse,
} from "./effects/brightness";
import { elements, segment } from "./objects/elements";
import {
  all,
  center,
  even,
  left,
  odd,
  right,
  segment_all,
  segment_arc,
  segment_b1,
  segment_b2,
  segment_centric,
  segment_ind,
  segment_rand,
  segment_updown,
} from "./objects/ring-elements";
import {
  snake,
  snakeFillGrow,
  snakeHeadMove,
  snakeHeadSin,
  snakeInOut,
  snakeSlowFast,
  snakeTailShrinkGrow,
  snakeHeadSteps,
  staticSnake,
} from "./effects/motion";
import { hueShiftSin, hueShiftStartToEnd, staticHueShift } from "./effects/hue";

const testSequence = async () => {
  const testAnimation = new Animation("${safeName.replace(/"/g, '\\"')}", ${song.bpm}, ${totalTimeSeconds.toFixed(2)}, ${startOffsetMs});
  testAnimation.sync(() => {
${bodyBlocks}
  });

  console.log("sending sequence");
  await sendSequence("${safeName.replace(/"/g, '\\"')}", testAnimation.getSequence());
  await startSong("${safeName.replace(/"/g, '\\"')}", 0);
};

(async () => {
  await testSequence();
})();
`
}
