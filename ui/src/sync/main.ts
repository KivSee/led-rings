import { bestLayout, candidates, customLayout, evalFn, GRADIENT_SEGMENTS, groupAt, K, layoutById, LINEAR, mapLeaves, maxRelPos, relPos, type CustomSpec, type Layout } from '../../../shared/layouts'

// Song Sync: load a song from src/songs, play / pause / jump, and show its beat grid with bars of 4 beats.
// Open at /sync.html?song=<name> while `yarn ui` is running.

interface SongJson {
  song: {
    name: string
    bpm: number
    lengthSeconds: number
    startOffsetMs?: number
    audioFilePath?: string
    beatTimestampsMs?: number[]
  }
}

const BEATS_PER_BAR = 4
const LETTERS = ['A', 'B', 'C', 'D']
const CONTROL_SERVER_URL_STORAGE_KEY = 'kivsee-control-server-url'

const songFiles = import.meta.glob<SongJson>(['../../../src/songs/*.json', '!../../../src/songs/*.layers.json'], { import: 'default' })
const songNames = Object.keys(songFiles).map(p => p.replace(/^.*\/(.*)\.json$/, '$1')).sort()

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const audio = $<HTMLAudioElement>('audio')
const songSelect = $<HTMLSelectElement>('song')
const playBtn = $<HTMLButtonElement>('play')
const view = $<HTMLCanvasElement>('view')
const overview = $<HTMLCanvasElement>('overview')
const zoomSelect = $<HTMLSelectElement>('zoom')
const offsetSelect = $<HTMLSelectElement>('barOffset')
const status = $<HTMLSpanElement>('status')
const lane = $<HTMLCanvasElement>('coloringLane')
const bgLane = $<HTMLCanvasElement>('backgroundLane')
const transLane = $<HTMLCanvasElement>('transitionLane')
const motionLane = $<HTMLCanvasElement>('motionLane')
const overrideLane = $<HTMLCanvasElement>('overrideLane')
const panel = $<HTMLDivElement>('sectionPanel')

let beats: number[] = [] // beat n -> ms
let durationMs = 0
let peaks: Float32Array = new Float32Array(0) // max |amplitude| per PEAK_MS
const PEAK_MS = 10

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// --- beat math ---------------------------------------------------------------

/** Fractional beat number at time t (ms), extrapolating past both ends of the grid. */
function beatAt(t: number): number {
  const n = beats.length
  if (n < 2) return 0
  if (t <= beats[0]) return (t - beats[0]) / (beats[1] - beats[0])
  if (t >= beats[n - 1]) return n - 1 + (t - beats[n - 1]) / (beats[n - 1] - beats[n - 2])
  let lo = 0, hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (beats[mid] <= t) lo = mid
    else hi = mid
  }
  return lo + (t - beats[lo]) / (beats[lo + 1] - beats[lo])
}

/** Time (ms) of a possibly fractional beat number. */
function timeOfBeat(b: number): number {
  const n = beats.length
  if (n < 2) return 0
  const i = Math.max(0, Math.min(n - 2, Math.floor(b)))
  return beats[i] + (b - i) * (beats[i + 1] - beats[i])
}

const barOffset = () => Number(offsetSelect.value)
/** 1-based bar and beat-in-bar of a whole beat number. */
function barOf(beat: number) {
  const shifted = beat - barOffset()
  return { bar: Math.floor(shifted / BEATS_PER_BAR) + 1, inBar: ((shifted % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR + 1 }
}
const beatOfBar = (bar: number) => (bar - 1) * BEATS_PER_BAR + barOffset()

const fmt = (ms: number, decimals = 2) => {
  const s = Math.max(0, ms) / 1000
  const m = Math.floor(s / 60)
  const rest = (s - m * 60).toFixed(decimals).padStart(decimals ? 3 + decimals : 2, '0')
  return `${m}:${rest}`
}

// --- loading -----------------------------------------------------------------

async function audioUrl(file: string): Promise<string | null> {
  const local = `/${encodeURIComponent(file)}`
  try {
    const r = await fetch(local, { method: 'HEAD' })
    if (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')) return local
  } catch { /* fall through */ }
  const api = localStorage.getItem(CONTROL_SERVER_URL_STORAGE_KEY) || 'http://localhost:3080'
  const remote = `${api}/api/audio?path=${encodeURIComponent(file)}`
  try {
    const r = await fetch(remote, { method: 'HEAD' })
    if (r.ok) return remote
  } catch { /* not available */ }
  return null
}

async function loadSong(name: string) {
  audio.pause()
  songName = name
  selected = null
  loadLayers(name)
  const data = await songFiles[`../../../src/songs/${name}.json`]()
  const s = data.song
  durationMs = s.lengthSeconds * 1000
  const beatMs = 60000 / s.bpm
  beats = s.beatTimestampsMs?.length
    ? s.beatTimestampsMs
    : Array.from({ length: Math.ceil(durationMs / beatMs) + 1 }, (_, n) => (s.startOffsetMs ?? 0) + n * beatMs)
  peaks = new Float32Array(0)
  history.replaceState(null, '', `?song=${encodeURIComponent(name)}`)
  $('duration').textContent = fmt(durationMs, 0)
  const grid = s.beatTimestampsMs?.length ? `${beats.length} detected beats` : `fixed ${s.bpm} BPM grid`
  if (!s.audioFilePath) {
    status.textContent = `${grid} · this song has no audio file`
    audio.removeAttribute('src')
    draw()
    return
  }
  const url = await audioUrl(s.audioFilePath)
  if (!url) {
    status.textContent = `${grid} · audio "${s.audioFilePath}" not found in ui/public or the control server`
    audio.removeAttribute('src')
    draw()
    return
  }
  audio.src = url
  status.textContent = `${grid} · ${s.bpm} BPM · loading waveform…`
  draw()
  try {
    const buf = await (await fetch(url)).arrayBuffer()
    const decoded = await new AudioContext().decodeAudioData(buf)
    peaks = computePeaks(decoded)
    status.textContent = `${grid} · ${s.bpm} BPM`
  } catch {
    status.textContent = `${grid} · ${s.bpm} BPM · could not decode the waveform`
  }
  draw()
}

function computePeaks(buf: AudioBuffer): Float32Array {
  const per = Math.max(1, Math.round((buf.sampleRate * PEAK_MS) / 1000))
  const out = new Float32Array(Math.ceil(buf.length / per))
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) {
      const v = Math.abs(d[i])
      const k = (i / per) | 0
      if (v > out[k]) out[k] = v
    }
  }
  return out
}

// --- drawing -----------------------------------------------------------------

function fitCanvas(c: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr)
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
  const ctx = c.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: c.clientWidth, h: c.clientHeight }
}

function drawWave(ctx: CanvasRenderingContext2D, w: number, h: number, t0: number, t1: number) {
  if (!peaks.length) return
  ctx.fillStyle = css('--wave')
  const mid = h / 2
  for (let x = 0; x < w; x++) {
    const a = Math.floor((t0 + ((t1 - t0) * x) / w) / PEAK_MS)
    const b = Math.max(a + 1, Math.floor((t0 + ((t1 - t0) * (x + 1)) / w) / PEAK_MS))
    let m = 0
    for (let k = Math.max(0, a); k < Math.min(peaks.length, b); k++) if (peaks[k] > m) m = peaks[k]
    const y = m * mid * 0.95
    ctx.fillRect(x, mid - y, 1, Math.max(1, y * 2))
  }
}

/** Visible window of the main view, following the playhead. */
function viewWindow() {
  const t = audio.currentTime * 1000
  const bars = Number(zoomSelect.value)
  const span = timeOfBeat(beatAt(t) + bars * BEATS_PER_BAR) - t || bars * BEATS_PER_BAR * 500
  const t0 = t - span * 0.25
  return { t0, t1: t0 + span }
}

function draw() {
  const now = audio.currentTime * 1000

  // Main view: waveform, beat lines, bar lines with labels, playhead.
  {
    const { ctx, w, h } = fitCanvas(view)
    ctx.clearRect(0, 0, w, h)
    const { t0, t1 } = viewWindow()
    const x = (t: number) => ((t - t0) / (t1 - t0)) * w
    drawWave(ctx, w, h, t0, t1)
    const first = Math.max(0, Math.floor(beatAt(t0)))
    const last = Math.min(beats.length - 1, Math.ceil(beatAt(t1)))
    ctx.font = '12px system-ui, sans-serif'
    for (let b = first; b <= last; b++) {
      const bx = x(beats[b])
      const { bar, inBar } = barOf(b)
      const down = inBar === 1
      ctx.fillStyle = down ? css('--bar') : css('--beat')
      ctx.fillRect(bx - (down ? 1 : 0.5), 0, down ? 2 : 1, h)
      ctx.fillStyle = down ? css('--bar') : css('--muted')
      if (down) ctx.fillText(`bar ${bar}`, bx + 4, 14)
      ctx.fillStyle = css('--muted')
      ctx.fillText(String(b), bx + 3, h - 6)
    }
    ctx.fillStyle = css('--head')
    ctx.fillRect(x(now) - 1, 0, 2, h)
  }

  drawLane(now)
  drawSim(now)

  // Overview: whole song, a line every 8 bars, coloring sections, the visible window and the playhead.
  {
    const { ctx, w, h } = fitCanvas(overview)
    ctx.clearRect(0, 0, w, h)
    const x = (t: number) => (t / durationMs) * w
    drawWave(ctx, w, h, 0, durationMs)
    ctx.fillStyle = 'rgba(255, 200, 120, 0.8)'
    for (const sec of motion.sections) {
      ctx.fillRect(x(timeOfBar(sec.startBar)), 10, Math.max(2, x(timeOfBar(sec.endBar)) - x(timeOfBar(sec.startBar))), 4)
    }
    ctx.fillStyle = 'rgba(160, 200, 255, 0.7)'
    for (const sec of transition.sections) {
      ctx.fillRect(x(timeOfBar(sec.startBar)), 5, Math.max(2, x(timeOfBar(sec.endBar)) - x(timeOfBar(sec.startBar))), 4)
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    for (const sec of background.sections) {
      ctx.fillRect(x(timeOfBar(sec.startBar)), 0, x(timeOfBar(sec.endBar)) - x(timeOfBar(sec.startBar)), 4)
    }
    for (const [secs, y, bh] of [[coloring.sections, h - 8, 8], [coloring.overrides, h - 16, 8]] as const) {
      for (const sec of secs) {
        const c = layerByName(sec.layer)?.colors[0]
        ctx.fillStyle = c ? hsvCss(c) : css('--muted')
        ctx.fillRect(x(timeOfBar(sec.startBar)), y, Math.max(2, x(timeOfBar(sec.endBar)) - x(timeOfBar(sec.startBar))), bh)
      }
    }
    ctx.fillStyle = css('--bar')
    ctx.globalAlpha = 0.5
    for (let b = 0; b < beats.length; b++) {
      const { bar, inBar } = barOf(b)
      if (inBar === 1 && (bar - 1) % 8 === 0) ctx.fillRect(x(beats[b]), 0, 1, h)
    }
    ctx.globalAlpha = 1
    const { t0, t1 } = viewWindow()
    ctx.strokeStyle = css('--accent')
    ctx.strokeRect(x(t0) + 0.5, 0.5, Math.max(2, x(t1) - x(t0)), h - 1)
    ctx.fillStyle = css('--head')
    ctx.fillRect(x(now) - 1, 0, 2, h)
  }

  // Readouts.
  const fb = beatAt(now)
  const whole = Math.floor(fb)
  const { bar, inBar } = barOf(whole)
  $('time').textContent = fmt(now)
  $('barbeat').textContent = fb < 0 ? 'before beat 0' : `bar ${bar} · beat ${inBar}`
  $('beatnum').textContent = `beat ${fb.toFixed(2)}`
  const lit = fb >= 0 ? inBar : 0
  ;[...$('beats').children].forEach((el, n) => {
    el.classList.toggle('on', n + 1 === lit)
    el.classList.toggle('down', n === 0)
  })
  playBtn.textContent = audio.paused ? '▶ Play' : '❚❚ Pause'
}

function loop() {
  draw()
  if (!audio.paused) requestAnimationFrame(loop)
}

// --- controls ----------------------------------------------------------------

function seek(ms: number) {
  audio.currentTime = Math.max(0, Math.min(durationMs, ms)) / 1000
  draw()
}
const seekBeat = (b: number) => seek(timeOfBeat(Math.max(0, Math.min(beats.length - 1, b))))

function togglePlay() {
  if (!audio.src) return
  if (audio.paused) audio.play().then(() => requestAnimationFrame(loop))
  else audio.pause()
  draw()
}

playBtn.addEventListener('click', togglePlay)
audio.addEventListener('pause', draw)
audio.addEventListener('ended', draw)

$('goBar').addEventListener('change', e => seekBeat(beatOfBar(Number((e.target as HTMLInputElement).value))))
$('goBeat').addEventListener('change', e => seekBeat(Number((e.target as HTMLInputElement).value)))
$('goTime').addEventListener('change', e => {
  const v = (e.target as HTMLInputElement).value.trim()
  const m = v.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/)
  if (m) seek((Number(m[1] ?? 0) * 60 + Number(m[2])) * 1000)
})
$('speed').addEventListener('change', e => { audio.playbackRate = Number((e.target as HTMLSelectElement).value) })
zoomSelect.addEventListener('change', draw)
offsetSelect.addEventListener('change', draw)
songSelect.addEventListener('change', () => loadSong(songSelect.value))

view.addEventListener('click', e => {
  const r = view.getBoundingClientRect()
  const { t0, t1 } = viewWindow()
  const t = t0 + ((e.clientX - r.left) / r.width) * (t1 - t0)
  if (e.altKey) seek(t)
  else seekBeat(Math.round(beatAt(t)))
})
overview.addEventListener('click', e => {
  const r = overview.getBoundingClientRect()
  const t = ((e.clientX - r.left) / r.width) * durationMs
  if (e.altKey) seek(t)
  else seekBeat(Math.round(beatAt(t)))
})

document.addEventListener('keydown', e => {
  if ((e.target as HTMLElement).matches('input, select')) return
  const b = beatAt(audio.currentTime * 1000)
  const step = e.shiftKey ? BEATS_PER_BAR : 1
  if (e.code === 'Space') { e.preventDefault(); togglePlay() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); seekBeat(e.shiftKey ? beatOfBar(barOf(Math.floor(b + 1e-6)).bar + 1) : Math.floor(b + 1e-6) + step) }
  else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    // From the middle of a beat or bar, go to its start first.
    const cur = e.shiftKey ? beatOfBar(barOf(Math.floor(b + 1e-6)).bar) : Math.floor(b + 1e-6)
    seekBeat(b - cur > 0.05 ? cur : cur - step)
  }
  else if (e.key === 'Home') { e.preventDefault(); seek(0) }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected() }
})
window.addEventListener('resize', draw)

// --- coloring layer ----------------------------------------------------------
// Sections of the song, in whole bars, each using a coloring layer: a layout (docs/layout.md) plus one color per
// group (docs/coloring-layer.md). Stored in src/songs/<song>.layers.json:
// { "coloring": { "layers": [{ name, groups, balance, clustering, layout, colors }], "sections": [{ startBar, endBar, layer }] } }
// Bars are 1-based and endBar is exclusive, so a section covers bars startBar .. endBar - 1.

/**
 * A group's color. With `hueEnd` it is a hue range: a gradient from `hue` to `hueEnd` across the group's part.
 * On rings where the group is not split, the gradient runs along `gradientSeg` (default "all").
 */
interface HSV { hue: number; sat: number; val: number; hueEnd?: number; gradientSeg?: string }
interface LayerDef {
  name: string; groups: number; balance: number; clustering: number; layout: string; colors: HSV[]
  /** A hand-made layout; used instead of `layout` when present (layout is then "custom"). */
  custom?: CustomSpec
}
const layoutOf = (layer: LayerDef) => (layer.custom ? customLayout(layer.custom) : layoutById(layer.layout))
interface Section { startBar: number; endBar: number; layer: string }
/**
 * Coloring sections plus overrides: short sections that paint another coloring layer over the base sections for a
 * while (to highlight something in the song). When an override ends, the base section's coloring shows again.
 */
interface Coloring { layers: LayerDef[]; sections: Section[]; overrides: Section[] }

/** A background layer (docs/background-layer.md): a texture that repeats all through its sections. */
interface BgLayer {
  name: string
  /** sparkles: a snake on `rand` lighting pixels; hueDrift: the whole hue swings up and down with a sin. */
  recipe: 'sparkles' | 'hueDrift'
  /** For hueDrift: how far the hue moves each way (+ and -). */
  hueSwing?: number
  /**
   * For hueDrift: sin (default) sways up and back down; linear ramps from -swing to +swing over each cycle and
   * jumps back (a sawtooth); rotate turns the hue a full round, linear(0, 1), every cycle (seamless, since hue 1 is
   * hue 0); its ring phases become starting hue offsets, linear(phase, 1 + phase). linear has no phase in the
   * proto, so ring phases do not apply to linear.
   */
  hueShape?: 'sin' | 'linear' | 'rotate'
  /**
   * For hueDrift, 0-1: how far apart in time the rings sway. Ring r's sin phase is shifted by frac(r × 0.618) ×
   * scatter (golden-ratio steps, so neighbouring rings are not in sequence). 0 = all rings sway together.
   */
  hueScatter?: number
  /**
   * For hueDrift: a random phase (0-1) per d1 ring, used instead of the golden-ratio steps so the rings look
   * unorganized. Fixed once picked, so the song plays the same every time.
   */
  ringPhases?: number[]
  /** For hueDrift: optional per-ring cycle length in beats (instead of `period`), so rings drift against each other. */
  ringPeriods?: number[]
  /** For hueDrift: optional per-ring swing (instead of `hueSwing`). */
  ringSwings?: number[]
  /** How far it moves brightness away from the coloring, 0-1. */
  intensity: number
  /** Beats per cycle of the pattern. */
  period: number
  /** Share of pixels lit at once (the snake's tail length). */
  density: number
  /**
   * Breathing of the density, 0-1: the tail length swings with a sin between density × (1 - breath) and
   * density × (1 + breath), one breath every `breathBars` bars. 0 keeps it constant.
   */
  breath?: number
  breathBars?: number
  /**
   * 0-1: how far apart in time the rings breathe. Ring r's sin phase is shifted by frac(r × 0.618) × scatter of a
   * breath (golden-ratio steps, so neighbouring rings are not in sequence). 0 = all rings breathe together.
   */
  breathScatter?: number
  mode: 'light' | 'dark'
  /**
   * What the sparkles change: brightness (snake_brightness, default) or saturation (snake_saturation).
   * For saturation, light pushes toward full color and dark pulls toward white.
   */
  channel?: 'brightness' | 'saturation'
  /** d1 rings (1-12) that get it. */
  rings: number[]
}
interface Background { layers: BgLayer[]; sections: Section[] }
type LaneId = 'coloring' | 'override' | 'background' | 'motion' | 'transition'
const LANES: LaneId[] = ['coloring', 'override', 'background', 'motion', 'transition']
/** Lanes whose sections use coloring layers. */
const isColoringLane = (id: LaneId) => id === 'coloring' || id === 'override'

/** A transition layer (docs/transition-layer.md): brings a scene in or takes it out, over everything else. */
interface TransLayer {
  name: string
  direction: 'in' | 'out'
  style: 'fade' | 'steps' | 'rings' | 'build'
  /** For steps: how many brightness steps. */
  steps?: number
  /** For rings: the order the d1 rings come in or go out. */
  order?: 'clockwise' | 'bottom-up' | 'scattered' | 'alternate'
  /** For build: how many groups of rings come in, one per stage. */
  groups?: number
  /** For build: the brightness (absolute, 0-1) the groups come in at. */
  level?: number
  /** For build: one extra last stage where everything pumps to full brightness. */
  pump?: boolean
}
interface Transition { layers: TransLayer[]; sections: Section[] }
const newTransLayer = (name: string): TransLayer => ({ name, direction: 'in', style: 'fade', steps: 4, order: 'bottom-up' })
/** One ring's snake parameters (docs/motion-layer.md). */
interface MotionParams {
  period: number; tail: number; delay: number; intensity: number
  /** Beats after the section start before this ring's snakes begin; every ring still ends with the section. */
  startOffset?: number
}
/** A motion layer: snakes travelling along a segment, as light on top (glow) or the only thing lit (mask). */
interface MotionLayer extends MotionParams {
  name: string
  /** shoot: a snake travels the segment. swell: the whole ring brightens and fades on a sin (timed_brightness). */
  recipe: 'shoot' | 'swell'
  segment: string
  draw: 'glow' | 'mask'
  /**
   * How the head moves each cycle. linear: linear(-delay, 1 + tail), one shot from start to end. sin:
   * sin(min 0, max 1, phase -0.25, repeats 1), the snake grows out to the end and pulls back in, smoothly.
   */
  headShape?: 'linear' | 'sin'
  /**
   * For the sin head: around shifts ring r's sin by (r - 1) / 12 of a cycle, so the peak travels clockwise from
   * ring to ring and the rings combine into one motion going around the circle.
   */
  ringPhase?: 'none' | 'around' | 'around2' | 'across'
  rings: number[]
  /** Optional per-ring parameters (index 0 = ring 1), so rings do not move together. */
  ringParams?: MotionParams[]
}
interface Motion { layers: MotionLayer[]; sections: Section[] }
const newMotionLayer = (name: string): MotionLayer => ({
  name, recipe: 'shoot', segment: 'rad', draw: 'glow', rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  period: 2, tail: 0.3, delay: 0.3, intensity: 0.8,
})
const emptyMotion = (): Motion => ({ layers: [newMotionLayer('rays 1')], sections: [] })
function normalizeMotion(data?: Partial<Motion>): Motion {
  return { layers: data?.layers?.length ? data.layers : [newMotionLayer('rays 1')], sections: data?.sections ?? [] }
}
const emptyTransition = (): Transition => ({ layers: [newTransLayer('fade in')], sections: [] })
function normalizeTrans(data?: Partial<Transition>): Transition {
  return { layers: data?.layers?.length ? data.layers : [newTransLayer('fade in')], sections: data?.sections ?? [] }
}
const ALL_RINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const newBgLayer = (name: string): BgLayer =>
  ({ name, recipe: 'sparkles', intensity: 0.6, period: 8, density: 0.08, mode: 'light', rings: [...ALL_RINGS] })
const emptyBackground = (): Background => ({ layers: [newBgLayer('sparkles 1')], sections: [] })

const DEFAULT_COLORS: HSV[] = [
  { hue: 0.6, sat: 1, val: 1 }, { hue: 0.08, sat: 1, val: 1 }, { hue: 0.33, sat: 1, val: 1 }, { hue: 0.85, sat: 1, val: 1 },
]
const EDGE_PX = 6

function newLayer(name: string): LayerDef {
  const layer = { name, groups: 2, balance: 1, clustering: 0.5, layout: '', colors: DEFAULT_COLORS.slice(0, 2).map(c => ({ ...c })) }
  layer.layout = bestLayout(layer.groups, layer.balance, layer.clustering)?.id ?? 'same'
  return layer
}
const emptyColoring = (): Coloring => ({ layers: [newLayer('coloring 1')], sections: [], overrides: [] })

let songName = ''
let coloring: Coloring = emptyColoring()
let background: Background = emptyBackground()
let transition: Transition = emptyTransition()
let motion: Motion = emptyMotion()
let selected: Section | null = null
/** Which lane the selected section is in. */
let selectedLane: LaneId = 'coloring'
let lastLayer = 'coloring 1'
let lastBgLayer = 'sparkles 1'
let lastTransLayer = 'fade in'
let lastMotionLayer = 'rays 1'

const apiBase = () => localStorage.getItem(CONTROL_SERVER_URL_STORAGE_KEY) || 'http://localhost:3080'
const layersPath = (name: string) => `src/songs/${name}.layers.json`
const localKey = (name: string) => `kivsee-sync-layers:${name}`
const layerByName = (name: string) => coloring.layers.find(l => l.name === name)
const bgLayerByName = (name: string) => background.layers.find(l => l.name === name)
const transLayerByName = (name: string) => transition.layers.find(l => l.name === name)
const motionLayerByName = (name: string) => motion.layers.find(l => l.name === name)
const sectionsOf = (id: LaneId) => (id === 'coloring' ? coloring.sections : id === 'override' ? coloring.overrides
  : id === 'background' ? background.sections : id === 'motion' ? motion.sections : transition.sections)

// WS2812 LEDs wash out quickly as saturation drops: sat 0.7 already looks almost white and 0.5 very light.
// Seen saturation is modelled as sat ^ LED_SAT_GAMMA, used both to draw colors and for the sat slider.
const LED_SAT_GAMMA = 4
const seenSat = (sat: number) => Math.pow(sat, LED_SAT_GAMMA)
const satFromSeen = (seen: number) => Math.pow(seen, 1 / LED_SAT_GAMMA)

/** HSV (0-1 each) to a CSS color, looking the way it does on the LEDs. */
function hsvCss({ hue, sat: ledSat, val }: HSV) {
  const sat = seenSat(ledSat)
  const h = (((hue % 1) + 1) % 1) * 6, i = Math.floor(h), f = h - i
  const p = val * (1 - sat), q = val * (1 - sat * f), t = val * (1 - sat * (1 - f))
  const [r, g, b] = [[val, t, p], [q, val, p], [p, val, t], [p, q, val], [t, p, val], [val, p, q]][i % 6]
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

const timeOfBar = (bar: number) => timeOfBeat(beatOfBar(bar))
/** Last bar that has beats, + 1 (the exclusive end of the song in bars). */
const endBarOfSong = () => barOf(beats.length - 1).bar + 1
/** Bar that contains time t, and the nearest bar boundary to time t. */
const barAt = (t: number) => barOf(Math.floor(beatAt(t))).bar
const nearestBarEdge = (t: number) => Math.round((beatAt(t) - barOffset()) / BEATS_PER_BAR) + 1

/** Older files listed plain layer names under "options"; turn them into full layers. */
function normalize(data: { layers?: LayerDef[]; options?: string[]; sections?: Section[]; overrides?: Section[] }): Coloring {
  const layers = data.layers ?? (data.options ?? []).map(newLayer)
  return { layers: layers.length ? layers : [newLayer('coloring 1')], sections: data.sections ?? [], overrides: data.overrides ?? [] }
}
function normalizeBg(data?: Partial<Background>): Background {
  return { layers: data?.layers?.length ? data.layers : [newBgLayer('sparkles 1')], sections: data?.sections ?? [] }
}

async function loadLayers(name: string) {
  coloring = emptyColoring()
  background = emptyBackground()
  transition = emptyTransition()
  motion = emptyMotion()
  let source = 'new'
  try {
    const r = await fetch(`${apiBase()}/api/read-file?path=${encodeURIComponent(layersPath(name))}`)
    if (r.ok) {
      const content = (await r.json()).content
      const data = JSON.parse(content)
      if (data.coloring) coloring = normalize(data.coloring)
      background = normalizeBg(data.background)
      transition = normalizeTrans(data.transition)
      motion = normalizeMotion(data.motion)
      lastFileContent = content
      source = 'file'
    } else if (r.status === 404) lastFileContent = ''
    else throw new Error()
  } catch {
    const local = localStorage.getItem(localKey(name))
    if (local) {
      // Older copies held only the coloring.
      const data = JSON.parse(local)
      coloring = normalize(data.coloring ?? data)
      background = normalizeBg(data.background)
      transition = normalizeTrans(data.transition)
      motion = normalizeMotion(data.motion)
      source = 'browser'
    }
  }
  if (name !== songName) return
  lastLayer = coloring.layers[0].name
  lastBgLayer = background.layers[0].name
  lastTransLayer = transition.layers[0].name
  lastMotionLayer = motion.layers[0].name
  setSaveStatus(source === 'browser' ? 'loaded from this browser (control server not running)' : '')
  closeDrawer()
  renderPanel()
  draw()
}

let saveTimer: number | undefined
/** The layers file as last read or written by this page, to notice when something else changes it. */
let lastFileContent: string | null = null

// Every 2 s, reload the layers if the file changed on disk (another tab, an editor, a script) and this page
// has nothing waiting to be saved. Keeps the selected section and the open drawer.
async function pollLayers() {
  if (saveTimer !== undefined || drag || lastFileContent === null || !songName) return
  const name = songName
  let content: string
  try {
    const r = await fetch(`${apiBase()}/api/read-file?path=${encodeURIComponent(layersPath(name))}`)
    if (!r.ok) return
    content = (await r.json()).content
  } catch { return }
  if (name !== songName || saveTimer !== undefined || content === lastFileContent) return
  const data = JSON.parse(content)
  if (!data.coloring) return
  const keepBar = selected?.startBar
  const keepLayer = editing?.name
  const keepBgLayer = editingBg?.name
  const keepTransLayer = editingTrans?.name
  const keepMotionLayer = editingMotion?.name
  coloring = normalize(data.coloring)
  background = normalizeBg(data.background)
  transition = normalizeTrans(data.transition)
  motion = normalizeMotion(data.motion)
  lastFileContent = content
  selected = keepBar === undefined ? null : sectionsOf(selectedLane).find(s => s.startBar === keepBar) ?? null
  setSaveStatus('reloaded: the file changed on disk')
  renderPanel()
  const layer = keepLayer ? layerByName(keepLayer) : undefined
  const bgLayer = keepBgLayer ? bgLayerByName(keepBgLayer) : undefined
  if (layer) openDrawer(layer)
  else if (bgLayer) openBgDrawer(bgLayer)
  else if (keepTransLayer && transLayerByName(keepTransLayer)) openTransDrawer(transLayerByName(keepTransLayer)!)
  else if (keepMotionLayer && motionLayerByName(keepMotionLayer)) openMotionDrawer(motionLayerByName(keepMotionLayer)!)
  else if (keepLayer || keepBgLayer || keepTransLayer || keepMotionLayer) closeDrawer()
  draw()
}
setInterval(pollLayers, 2000)
function changed() {
  coloring.sections.sort((a, b) => a.startBar - b.startBar)
  background.sections.sort((a, b) => a.startBar - b.startBar)
  transition.sections.sort((a, b) => a.startBar - b.startBar)
  motion.sections.sort((a, b) => a.startBar - b.startBar)
  coloring.overrides.sort((a, b) => a.startBar - b.startBar)
  renderPanel()
  draw()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(save, 400)
}

async function save() {
  saveTimer = undefined
  const content = JSON.stringify({ coloring, background, motion, transition }, null, 2) + '\n'
  localStorage.setItem(localKey(songName), JSON.stringify({ coloring, background, motion, transition }))
  try {
    const r = await fetch(`${apiBase()}/api/save-file`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: layersPath(songName), content }),
    })
    if (!r.ok) throw new Error()
    lastFileContent = content
    setSaveStatus(`saved to ${layersPath(songName)}`)
  } catch {
    setSaveStatus('saved in this browser only: start the control server (yarn control-server) to save to the repo')
  }
}
function setSaveStatus(text: string) {
  const el = document.getElementById('saveStatus')
  if (el) el.textContent = text
  pendingSaveStatus = text
}
let pendingSaveStatus = ''

/** Neighbours of a section (or of a free bar) in a lane, to keep sections from overlapping. */
function freeRange(id: LaneId, bar: number, except?: Section) {
  let lo = 1, hi = endBarOfSong()
  for (const s of sectionsOf(id)) {
    if (s === except) continue
    if (s.endBar <= bar) lo = Math.max(lo, s.endBar)
    if (s.startBar > bar) hi = Math.min(hi, s.startBar)
  }
  return { lo, hi }
}
const sectionAtBar = (bar: number, id: LaneId = 'coloring') => sectionsOf(id).find(s => s.startBar <= bar && bar < s.endBar)

function addSection(id: LaneId, startBar: number, endBar: number) {
  const { lo, hi } = freeRange(id, startBar)
  const sec = { startBar: Math.max(lo, startBar), endBar: Math.min(hi, endBar), layer: isColoringLane(id) ? lastLayer : id === 'background' ? lastBgLayer : id === 'motion' ? lastMotionLayer : lastTransLayer }
  if (sec.endBar <= sec.startBar) return
  sectionsOf(id).push(sec)
  selected = sec
  selectedLane = id
  changed()
}

function deleteSelected() {
  if (!selected) return
  if (selectedLane === 'coloring') coloring.sections = coloring.sections.filter(s => s !== selected)
  else if (selectedLane === 'override') coloring.overrides = coloring.overrides.filter(s => s !== selected)
  else if (selectedLane === 'background') background.sections = background.sections.filter(s => s !== selected)
  else if (selectedLane === 'motion') motion.sections = motion.sections.filter(s => s !== selected)
  else transition.sections = transition.sections.filter(s => s !== selected)
  selected = null
  changed()
}

function drawLane(now: number) {
  drawLaneOf('coloring', lane, now)
  drawLaneOf('override', overrideLane, now)
  drawLaneOf('background', bgLane, now)
  drawLaneOf('motion', motionLane, now)
  drawLaneOf('transition', transLane, now)
}

/** Motion sections: dark with slanted streaks, like things moving past. */
function paintMotionSection(ctx: CanvasRenderingContext2D, x0: number, x1: number, h: number) {
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x0 + 1, 4, x1 - x0 - 2, h - 8)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0 + 1, 4, x1 - x0 - 2, h - 8)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.55)'
  ctx.lineWidth = 2
  for (let x = x0 - h; x < x1; x += 14) {
    ctx.beginPath()
    ctx.moveTo(x, h - 4)
    ctx.lineTo(x + h * 0.8, 4)
    ctx.stroke()
  }
  ctx.restore()
}

/** Transition sections: the shape of the brightness factor over the section (a ramp, stairs, or 12 ring steps). */
function paintTransSection(ctx: CanvasRenderingContext2D, x0: number, x1: number, h: number, layer?: TransLayer) {
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x0 + 1, 4, x1 - x0 - 2, h - 8)
  if (!layer) return
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.beginPath()
  ctx.moveTo(x0 + 1, h - 4)
  const n = 60
  for (let k = 0; k <= n; k++) {
    const rel = Math.min(0.9999, k / n)
    const f = layer.style === 'build'
      ? ALL_RINGS.reduce((sum, r) => sum + buildLevel(layer, rel, buildGroupOf(layer, r)), 0) / 12
      : transFactor(layer, rel, transStepIndex(layer, rel))
    ctx.lineTo(x0 + 1 + (x1 - x0 - 2) * (k / n), h - 4 - (h - 8) * f)
  }
  ctx.lineTo(x1 - 1, h - 4)
  ctx.closePath()
  ctx.fill()
}

/** Background sections: dark with a sprinkle of dots, so they read as texture rather than color. */
function paintBgSection(ctx: CanvasRenderingContext2D, x0: number, x1: number, h: number) {
  ctx.fillStyle = '#2a2f3d'
  ctx.fillRect(x0 + 1, 4, x1 - x0 - 2, h - 8)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  for (let k = 0; k < (x1 - x0) / 5; k++) {
    const fx = (Math.sin(k * 12.9898) * 43758.5453) % 1, fy = (Math.sin(k * 78.233) * 12345.678) % 1
    ctx.fillRect(x0 + 2 + Math.abs(fx) * (x1 - x0 - 4), 6 + Math.abs(fy) * (h - 12), 1.5, 1.5)
  }
}

function drawLaneOf(id: LaneId, canvas: HTMLCanvasElement, now: number) {
  const { ctx, w, h } = fitCanvas(canvas)
  ctx.clearRect(0, 0, w, h)
  const { t0, t1 } = viewWindow()
  const x = (t: number) => ((t - t0) / (t1 - t0)) * w
  // Bar grid.
  ctx.fillStyle = css('--line')
  const firstBar = Math.max(1, barAt(t0)), lastBar = Math.min(endBarOfSong(), barAt(t1) + 1)
  for (let b = firstBar; b <= lastBar; b++) ctx.fillRect(x(timeOfBar(b)), 0, 1, h)
  // Sections, striped with their layer's group colors.
  ctx.font = '600 12px system-ui, sans-serif'
  for (const sec of sectionsOf(id)) {
    const x0 = x(timeOfBar(sec.startBar)), x1 = x(timeOfBar(sec.endBar))
    if (x1 < 0 || x0 > w) continue
    if (id === 'background') paintBgSection(ctx, x0, x1, h)
    if (id === 'transition') paintTransSection(ctx, x0, x1, h, transLayerByName(sec.layer))
    if (id === 'motion') paintMotionSection(ctx, x0, x1, h)
    const colors = isColoringLane(id) ? layerByName(sec.layer)?.colors ?? [] : []
    const band = (h - 8) / Math.max(1, colors.length)
    colors.forEach((c, g) => {
      if (c.hueEnd === undefined) ctx.fillStyle = hsvCss(c)
      else {
        const grad = ctx.createLinearGradient(x0, 0, x1, 0)
        for (const t of [0, 0.25, 0.5, 0.75, 1]) grad.addColorStop(t, hsvCss({ ...c, hue: c.hue + (c.hueEnd - c.hue) * t }))
        ctx.fillStyle = grad
      }
      ctx.fillRect(x0 + 1, 4 + g * band, x1 - x0 - 2, band)
    })
    if (sec === selected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(x0 + 1, 4, x1 - x0 - 2, h - 8)
    }
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, 0, x1 - x0, h)
    ctx.clip()
    const label = `${sec.layer} · bars ${sec.startBar}-${sec.endBar - 1}`
    const lx = Math.max(x0, 0) + 8
    ctx.fillStyle = 'rgba(13, 15, 20, 0.75)'
    ctx.fillRect(lx - 4, h / 2 - 9, ctx.measureText(label).width + 8, 18)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, lx, h / 2 + 4)
    ctx.restore()
  }
  // Drag preview.
  if (drag?.mode === 'create' && drag.moved && drag.lane === id) {
    const a = Math.min(drag.anchor, drag.current), b = Math.max(drag.anchor, drag.current) + 1
    ctx.strokeStyle = css('--muted')
    ctx.setLineDash([4, 4])
    ctx.strokeRect(x(timeOfBar(a)) + 1, 4, x(timeOfBar(b)) - x(timeOfBar(a)) - 2, h - 8)
    ctx.setLineDash([])
  }
  ctx.fillStyle = css('--head')
  ctx.fillRect(x(now) - 1, 0, 2, h)
}

function renderPanel() {
  if (!selected) {
    panel.innerHTML = `<span class="muted">No section selected. Drag on a lane, or add 4 bars at the playhead:</span>
      <button id="addHere">+ Coloring</button>
      <button id="addOverrideHere" title="1 bar that paints over the coloring">+ Override</button>
      <button id="addBgHere">+ Background</button>
      <button id="addMotionHere" title="4 bars">+ Motion</button>
      <button id="addTransHere" title="2 bars">+ Transition</button>
      <span class="muted" id="saveStatus">${pendingSaveStatus}</span>`
    for (const [btn, id, bars] of [['addHere', 'coloring', 4], ['addOverrideHere', 'override', 1], ['addBgHere', 'background', 4], ['addMotionHere', 'motion', 4], ['addTransHere', 'transition', 2]] as const) {
      $(btn).addEventListener('click', () => {
        const bar = Math.max(1, barAt(audio.currentTime * 1000))
        const hit = sectionAtBar(bar, id)
        if (hit) { selected = hit; selectedLane = id; changed(); return }
        addSection(id, bar, bar + bars)
      })
    }
    return
  }
  if (selectedLane === 'background') { renderBgPanel(selected); return }
  if (selectedLane === 'transition') { renderTransPanel(selected); return }
  if (selectedLane === 'motion') { renderMotionPanel(selected); return }
  const sec = selected
  const swatches = (layerByName(sec.layer)?.colors ?? []).map(c => `<span class="swatch" style="background:${swatchCss(c)}"></span>`).join('')
  panel.innerHTML = `
    <span>${swatches}${selectedLane === 'override' ? '<b>Override</b> · ' : ''}<b>Bars ${sec.startBar}-${sec.endBar - 1}</b> <span class="muted">(${sec.endBar - sec.startBar} bars)</span></span>
    <label>Coloring layer <select id="layerSel">
      ${coloring.layers.map(l => `<option${l.name === sec.layer ? ' selected' : ''}>${l.name}</option>`).join('')}
      <option value="__new">+ New layer…</option>
    </select></label>
    <button id="editLayer">Edit layer…</button>
    <button id="jumpSec">Jump to start</button>
    <button id="delSec">Delete</button>
    <button id="deselect">Done</button>
    <span class="muted" id="saveStatus">${pendingSaveStatus}</span>`
  $<HTMLSelectElement>('layerSel').addEventListener('change', e => {
    let v = (e.target as HTMLSelectElement).value
    if (v === '__new') {
      const name = prompt('Name of the new coloring layer')?.trim()
      if (!name) { renderPanel(); return }
      if (!layerByName(name)) coloring.layers.push(newLayer(name))
      v = name
      sec.layer = v
      lastLayer = v
      changed()
      openDrawer(layerByName(v)!)
      return
    }
    sec.layer = v
    lastLayer = v
    changed()
    if (!drawer.hidden) openDrawer(layerByName(v)!)
  })
  $('editLayer').addEventListener('click', () => openDrawer(layerByName(sec.layer) ?? newLayer(sec.layer)))
  $('jumpSec').addEventListener('click', () => seek(timeOfBar(sec.startBar)))
  $('delSec').addEventListener('click', deleteSelected)
  $('deselect').addEventListener('click', () => { selected = null; renderPanel(); draw() })
}

function renderBgPanel(sec: Section) {
  const layer = bgLayerByName(sec.layer)
  panel.innerHTML = `
    <span><b>Bars ${sec.startBar}-${sec.endBar - 1}</b> <span class="muted">(${sec.endBar - sec.startBar} bars)</span></span>
    <label>Background layer <select id="bgLayerSel">
      ${background.layers.map(l => `<option${l.name === sec.layer ? ' selected' : ''}>${l.name}</option>`).join('')}
      <option value="__new">+ New layer…</option>
    </select></label>
    <span class="muted">${layer ? `${layer.recipe} · rings ${ringsText(layer.rings)}` : ''}</span>
    <button id="editLayer">Edit layer…</button>
    <button id="jumpSec">Jump to start</button>
    <button id="delSec">Delete</button>
    <button id="deselect">Done</button>
    <span class="muted" id="saveStatus">${pendingSaveStatus}</span>`
  $<HTMLSelectElement>('bgLayerSel').addEventListener('change', e => {
    let v = (e.target as HTMLSelectElement).value
    const isNew = v === '__new'
    if (isNew) {
      const name = prompt('Name of the new background layer')?.trim()
      if (!name) { renderPanel(); return }
      if (!bgLayerByName(name)) background.layers.push(newBgLayer(name))
      v = name
    }
    sec.layer = v
    lastBgLayer = v
    changed()
    if (isNew || !drawer.hidden) openBgDrawer(bgLayerByName(v)!)
  })
  $('editLayer').addEventListener('click', () => openBgDrawer(bgLayerByName(sec.layer) ?? newBgLayer(sec.layer)))
  $('jumpSec').addEventListener('click', () => seek(timeOfBar(sec.startBar)))
  $('delSec').addEventListener('click', deleteSelected)
  $('deselect').addEventListener('click', () => { selected = null; renderPanel(); draw() })
}

/** "all", or a compact list like "4-7, 10". */
function ringsText(rings: number[]) {
  if (rings.length === 12) return 'all'
  if (!rings.length) return 'none'
  const sorted = [...rings].sort((a, b) => a - b), parts: string[] = []
  for (let k = 0; k < sorted.length; k++) {
    let j = k
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++
    parts.push(j > k ? `${sorted[k]}-${sorted[j]}` : String(sorted[k]))
    k = j
  }
  return parts.join(', ')
}

// --- transitions ---------------------------------------------------------------------------------------------

/** d1 rings in the order a `rings` transition brings them in (or takes them out). */
function ringOrder(order: TransLayer['order']) {
  if (order === 'clockwise' || order === 'alternate') return [...ALL_RINGS]
  if (order === 'scattered') return [...ALL_RINGS].sort((a, b) => ((a * GOLDEN) % 1) - ((b * GOLDEN) % 1))
  // bottom-up: by height, the bottom of the clock first (ring r sits at r:30).
  return [...ALL_RINGS].sort((a, b) => Math.cos(((a + 0.5) * Math.PI) / 6) - Math.cos(((b + 0.5) * Math.PI) / 6))
}

/** For steps, the step index at position `rel` (0-1) of the section; unused otherwise. */
const transStepIndex = (layer: TransLayer, rel: number) => Math.floor(rel * Math.max(2, layer.steps ?? 4))

/** Brightness factor 0-1 at position `rel` of the section, for a ring at `pos` in the ring order (rings style). */
function transFactor(layer: TransLayer, rel: number, step: number, pos = 0) {
  const into = layer.direction === 'in'
  if (layer.style === 'fade') return into ? rel : 1 - rel
  if (layer.style === 'steps') {
    const n = Math.max(2, layer.steps ?? 4)
    return into ? step / (n - 1) : 1 - step / (n - 1)
  }
  // rings: ring number pos in the order is dark until pos/12 (in), or from (pos+1)/12 (out).
  return into ? (rel >= pos / 12 ? 1 : 0) : (rel >= (pos + 1) / 12 ? 0 : 1)
}

/** For build: which group (0-based) ring r comes in with. alternate: ring by ring; otherwise the order in chunks. */
function buildGroupOf(layer: TransLayer, r: number) {
  const G = layer.groups ?? 3
  if (layer.order === 'alternate') return (r - 1) % G
  return Math.floor((ringOrder(layer.order).indexOf(r) * G) / 12)
}
/** For build: the stage at position rel. Stages are the groups coming in one by one, then the pump if set. */
const buildStages = (layer: TransLayer) => (layer.groups ?? 3) + (layer.pump ? 1 : 0)
/** For build: absolute brightness of a ring in group g at position rel of the section. */
function buildLevel(layer: TransLayer, rel: number, g: number) {
  const stage = Math.floor(rel * buildStages(layer))
  if (layer.pump && stage === (layer.groups ?? 3)) return 1
  return g <= stage ? layer.level ?? 0.3 : 0
}

/** The transition's brightness change at time `now`, the same way its effects scale everything underneath. */
function transitionAt(sec: Section, layer: TransLayer, now: number) {
  const start = timeOfBar(sec.startBar), end = timeOfBar(sec.endBar)
  const rel = Math.min(0.9999, Math.max(0, (now - start) / (end - start)))
  // build sets absolute brightness levels (raising above the coloring where needed), the others scale it.
  if (layer.style === 'build') return (r: number, _i: number, _p: number, c: HSV): HSV => ({ ...c, val: buildLevel(layer, rel, buildGroupOf(layer, r)) })
  const step = transStepIndex(layer, rel)
  const order = ringOrder(layer.order)
  return (r: number, _i: number, _p: number, c: HSV): HSV =>
    ({ ...c, val: c.val * transFactor(layer, rel, step, order.indexOf(r)) })
}

function renderTransPanel(sec: Section) {
  const layer = transLayerByName(sec.layer)
  panel.innerHTML = `
    <span><b>Transition</b> · <b>Bars ${sec.startBar}-${sec.endBar - 1}</b> <span class="muted">(${sec.endBar - sec.startBar} bars)</span></span>
    <label>Transition layer <select id="transLayerSel">
      ${transition.layers.map(l => `<option${l.name === sec.layer ? ' selected' : ''}>${l.name}</option>`).join('')}
      <option value="__new">+ New layer…</option>
    </select></label>
    <span class="muted">${layer ? `${layer.direction} · ${layer.style}` : ''}</span>
    <button id="editLayer">Edit layer…</button>
    <button id="jumpSec">Jump to start</button>
    <button id="delSec">Delete</button>
    <button id="deselect">Done</button>
    <span class="muted" id="saveStatus">${pendingSaveStatus}</span>`
  $<HTMLSelectElement>('transLayerSel').addEventListener('change', e => {
    let v = (e.target as HTMLSelectElement).value
    const isNew = v === '__new'
    if (isNew) {
      const name = prompt('Name of the new transition layer')?.trim()
      if (!name) { renderPanel(); return }
      if (!transLayerByName(name)) transition.layers.push(newTransLayer(name))
      v = name
    }
    sec.layer = v
    lastTransLayer = v
    changed()
    if (isNew || !drawer.hidden) openTransDrawer(transLayerByName(v)!)
  })
  $('editLayer').addEventListener('click', () => openTransDrawer(transLayerByName(sec.layer) ?? newTransLayer(sec.layer)))
  $('jumpSec').addEventListener('click', () => seek(timeOfBar(sec.startBar)))
  $('delSec').addEventListener('click', deleteSelected)
  $('deselect').addEventListener('click', () => { selected = null; renderPanel(); draw() })
}

// --- motion ------------------------------------------------------------------------------------------------

/** A ring's snake parameters: its own if the layer varies them per ring, else the layer's. */
const motionParams = (layer: MotionLayer, r: number): MotionParams => layer.ringParams?.[r - 1] ?? layer

/**
 * The motion's change at time `now`, drawn like the renderer: per ring a non-cyclic snake whose head runs
 * linear(-delay, 1 + tail) every period beats; 0 at the tail end, 1 at the head. glow raises brightness by
 * intensity × that (snake_brightness, mult_factor_increase); mask multiplies by it and darkens everything else (snake).
 */
/**
 * Phase shift of ring r, in cycles. around: (r - 1) / 12 (one wave around the circle); around2: twice that;
 * across: by the ring's left-to-right position, the left side first and the right side 0.7 of a cycle later.
 */
function motionRingPhase(layer: MotionLayer, r: number) {
  if (layer.ringPhase === 'around') return (r - 1) / 12
  if (layer.ringPhase === 'around2') return (2 * (r - 1)) / 12
  if (layer.ringPhase === 'across') return (1 - (Math.sin(((r + 0.5) * Math.PI) / 6) + 1) / 2) * 0.7
  return 0
}

function motionAt(sec: Section, layer: MotionLayer, now: number) {
  const start = timeOfBar(sec.startBar), end = timeOfBar(sec.endBar)
  const beatsIn = ((now - start) / (end - start)) * (sec.endBar - sec.startBar) * BEATS_PER_BAR
  const rings = new Set(layer.rings)
  if (layer.recipe === 'swell') {
    // timed_brightness, mult_factor_increase = sin(min 0, max intensity, phase -0.25 + ring phase, repeats 1).
    const lift = ALL_RINGS.map(r => {
      const m = motionParams(layer, r)
      const pos = ((beatsIn / m.period) % 1 + 1) % 1
      return (m.intensity * (Math.sin((pos - 0.25 + motionRingPhase(layer, r)) * 2 * Math.PI) + 1)) / 2
    })
    return (r: number, _i: number, _p: number, c: HSV): HSV =>
      (rings.has(r) ? { ...c, val: c.val + (1 - c.val) * lift[r - 1] } : c)
  }
  // A ring's snakes start startOffset beats into the section (its own start_time) and end with the section.
  const heads = ALL_RINGS.map(r => {
    const m = motionParams(layer, r)
    const ringBeats = beatsIn - (m.startOffset ?? 0)
    if (ringBeats < 0) return null
    const pos = ((ringBeats / m.period) % 1 + 1) % 1
    // around: one wave travels the circle each cycle; around2: two opposite waves, (r - 1) × 2 / 12.
    const phase = motionRingPhase(layer, r)
    if (layer.headShape === 'sin') return (Math.sin((pos - 0.25 + phase) * 2 * Math.PI) + 1) / 2
    return -m.delay + pos * (1 + m.tail + m.delay)
  })
  return (r: number, i: number, p: number, c: HSV): HSV => {
    if (!rings.has(r)) return c
    const m = motionParams(layer, r)
    if (heads[r - 1] === null) return layer.draw === 'mask' ? { ...c, val: 0 } : c
    const rp = relPos(layer.segment, i * 12 + p)
    const head = heads[r - 1]!, tail = head - m.tail
    const inside = !Number.isNaN(rp) && rp >= tail && rp <= head
    const idx = inside ? (rp - tail) / m.tail : 0
    if (layer.draw === 'mask') return { ...c, val: c.val * idx }
    return inside ? { ...c, val: c.val + (1 - c.val) * m.intensity * idx } : c
  }
}

function renderMotionPanel(sec: Section) {
  const layer = motionLayerByName(sec.layer)
  panel.innerHTML = `
    <span><b>Motion</b> · <b>Bars ${sec.startBar}-${sec.endBar - 1}</b> <span class="muted">(${sec.endBar - sec.startBar} bars)</span></span>
    <label>Motion layer <select id="motionLayerSel">
      ${motion.layers.map(l => `<option${l.name === sec.layer ? ' selected' : ''}>${l.name}</option>`).join('')}
      <option value="__new">+ New layer…</option>
    </select></label>
    <span class="muted">${layer ? `${layer.recipe} on ${layer.segment} · ${layer.draw}` : ''}</span>
    <button id="editLayer">Edit layer…</button>
    <button id="jumpSec">Jump to start</button>
    <button id="delSec">Delete</button>
    <button id="deselect">Done</button>
    <span class="muted" id="saveStatus">${pendingSaveStatus}</span>`
  $<HTMLSelectElement>('motionLayerSel').addEventListener('change', e => {
    let v = (e.target as HTMLSelectElement).value
    const isNew = v === '__new'
    if (isNew) {
      const name = prompt('Name of the new motion layer')?.trim()
      if (!name) { renderPanel(); return }
      if (!motionLayerByName(name)) motion.layers.push(newMotionLayer(name))
      v = name
    }
    sec.layer = v
    lastMotionLayer = v
    changed()
    if (isNew || !drawer.hidden) openMotionDrawer(motionLayerByName(v)!)
  })
  $('editLayer').addEventListener('click', () => openMotionDrawer(motionLayerByName(sec.layer) ?? newMotionLayer(sec.layer)))
  $('jumpSec').addEventListener('click', () => seek(timeOfBar(sec.startBar)))
  $('delSec').addEventListener('click', deleteSelected)
  $('deselect').addEventListener('click', () => { selected = null; renderPanel(); draw() })
}

// --- simulation: the installation as it looks at the playhead ---------------------------------------------

const simCanvas = $<HTMLCanvasElement>('sim')
let lastSimKey = ''

/**
 * The snake's tail_length function, as sent to the renderer: the density, or a sin around it. The renderer gives
 * it the position within one cycle (0-1 over `period` beats), so one breath per `breathBars` bars needs
 * repeats = period / (4 × breathBars). Phase -0.25 starts each breath at its smallest.
 */
type TailFn =
  | { const_value: { value: number } }
  | { sin: { min: number; max: number; phase: number; repeats: number } }
const GOLDEN = 0.6180339887
/** Phase shift of ring r's breathing, in breaths. */
const breathPhase = (layer: BgLayer, r: number) => ((r * GOLDEN) % 1) * (layer.breathScatter ?? 0)

function tailLengthFn(layer: BgLayer, r: number): TailFn {
  const breath = layer.breath ?? 0
  if (!breath) return { const_value: { value: layer.density } }
  return {
    sin: {
      min: layer.density * (1 - breath), max: layer.density * (1 + breath),
      phase: -0.25 + breathPhase(layer, r),
      repeats: layer.period / (BEATS_PER_BAR * (layer.breathBars ?? 1)),
    },
  }
}
function tailLengthAt(layer: BgLayer, r: number, cyclePos: number) {
  const fn = tailLengthFn(layer, r)
  if ('const_value' in fn) return fn.const_value.value
  const { min, max, phase, repeats } = fn.sin
  return ((Math.sin((cyclePos * repeats + phase) * 2 * Math.PI) + 1) / 2) * (max - min) + min
}

/**
 * Brightness change of the background at time `now`, the way the renderer draws it: sparkles are a cyclic
 * snake_brightness on segment `rand` whose head runs 0 -> 1 once per period, with a soft sin shape inside the snake.
 */
/** Phase shift of ring r's hue sway, in cycles: its random phase if set, else golden-ratio steps, times scatter. */
const hueRingPhase = (layer: BgLayer, r: number) =>
  (layer.ringPhases?.[r - 1] ?? (r * GOLDEN) % 1) * (layer.hueScatter ?? 0)

function backgroundAt(sec: Section, layer: BgLayer, now: number) {
  const start = timeOfBar(sec.startBar), end = timeOfBar(sec.endBar)
  const repeatNum = ((sec.endBar - sec.startBar) * BEATS_PER_BAR) / layer.period
  const cyclePos = ((((now - start) / (end - start)) * repeatNum) % 1 + 1) % 1
  if (layer.recipe === 'hueDrift') {
    // timed_hue with offset_factor sin(min -swing, max +swing, phase, repeats 1): one swing per period, with
    // each ring's phase scattered by hueScatter.
    // Each ring may have its own cycle length and swing; its position in its own cycle comes from its repeat_num.
    const rel = (now - start) / (end - start)
    const sectionBeats = (sec.endBar - sec.startBar) * BEATS_PER_BAR
    const offsets = ALL_RINGS.map(r => {
      const period = layer.ringPeriods?.[r - 1] ?? layer.period
      const swing = layer.ringSwings?.[r - 1] ?? layer.hueSwing ?? 0.1
      const pos = (((rel * sectionBeats) / period) % 1 + 1) % 1
      // rotate: linear(phase, 1 + phase), so each ring starts its full round at its own color.
      if (layer.hueShape === 'rotate') return hueRingPhase(layer, r) + pos
      if (layer.hueShape === 'linear') return -swing + 2 * swing * pos
      return swing * Math.sin((pos + hueRingPhase(layer, r)) * 2 * Math.PI)
    })
    const driftRings = new Set(layer.rings)
    return (r: number, _i: number, _p: number, c: HSV): HSV => {
      if (!driftRings.has(r)) return c
      const offset = offsets[r - 1]
      return { ...c, hue: c.hue + offset, hueEnd: c.hueEnd === undefined ? undefined : c.hueEnd + offset }
    }
  }
  const head = cyclePos
  const tails = ALL_RINGS.map(r => Math.max(0.001, tailLengthAt(layer, r, cyclePos)))
  const rings = new Set(layer.rings)
  return (r: number, i: number, p: number, c: HSV): HSV => {
    if (!rings.has(r)) return c
    const tail = tails[r - 1]
    const d = (head - relPos('rand', i * 12 + p) + 1) % 1
    if (d > tail) return c
    const idx = 1 - d / tail // 0 at the tail end, 1 at the head, like the renderer's snake_index
    const mult = (layer.intensity * (Math.sin((idx - 0.25) * 2 * Math.PI) + 1)) / 2
    const ch = layer.channel === 'saturation' ? 'sat' : 'val'
    const v = layer.mode === 'light' ? c[ch] + (1 - c[ch]) * mult : c[ch] * (1 - mult)
    return { ...c, [ch]: v }
  }
}

/**
 * Draws the section under the playhead: its coloring, and its background animated on top. Without a background
 * it redraws only when the section, its layer or the size change.
 */
function drawSim(now: number) {
  const fb = beatAt(now)
  const bar = barOf(Math.floor(fb)).bar
  // An override paints over the base coloring section while it lasts.
  const sec = fb >= 0 ? sectionAtBar(bar, 'override') ?? sectionAtBar(bar, 'coloring') : undefined
  const isOverride = !!sec && coloring.overrides.includes(sec)
  const bgSec = fb >= 0 ? sectionAtBar(bar, 'background') : undefined
  const layer = sec ? layerByName(sec.layer) : undefined
  const bgLayer = bgSec ? bgLayerByName(bgSec.layer) : undefined
  const moSec = fb >= 0 ? sectionAtBar(bar, 'motion') : undefined
  const moLayer = moSec ? motionLayerByName(moSec.layer) : undefined
  const trSec = fb >= 0 ? sectionAtBar(bar, 'transition') : undefined
  const trLayer = trSec ? transLayerByName(trSec.layer) : undefined
  const layout = layer ? layoutOf(layer) : undefined
  const key = JSON.stringify([simCanvas.clientWidth, sec?.startBar, sec?.endBar, layer, bgLayer || trLayer || moLayer ? now : null])
  if (key === lastSimKey) return
  lastSimKey = key
  // Background on top of the coloring, then the transition on top of everything.
  const bgMod = bgSec && bgLayer ? backgroundAt(bgSec, bgLayer, now) : undefined
  const moMod = moSec && moLayer ? motionAt(moSec, moLayer, now) : undefined
  const trMod = trSec && trLayer ? transitionAt(trSec, trLayer, now) : undefined
  // Order: background, then motion, then the transition on top of everything.
  const mods = [bgMod, moMod, trMod].filter((m): m is NonNullable<typeof m> => !!m)
  const modify = mods.length
    ? (r: number, i: number, p: number, c: HSV) => mods.reduce((acc, m) => m(r, i, p, acc), c)
    : undefined
  const bgText = (bgLayer ? ` + ${bgLayer.name}` : '') + (moLayer ? ` + ${moLayer.name}` : '') + (trLayer ? ` + ${trLayer.name}` : '')
  if (layer && layout) {
    drawInstallation(simCanvas, layout, layer.colors, modify)
    $('simLabel').textContent = `${isOverride ? 'override: ' : ''}${layer.name}${bgText} · bars ${sec!.startBar}-${sec!.endBar - 1}`
  } else {
    drawInstallation(simCanvas, layoutById('same')!, [{ hue: 0, sat: 0, val: 0.12 }], modify)
    $('simLabel').textContent = `no coloring section here: rings off${bgText}`
  }
}

// --- coloring drawer: edit a layer's groups, balance, clustering, layout and colors ----------------------------

const drawer = $<HTMLElement>('drawer')
let editing: LayerDef | null = null
let editingBg: BgLayer | null = null
let editingTrans: TransLayer | null = null
let editingMotion: MotionLayer | null = null

// The wiring starts 9 small rings in: physical small ring i (pixels 12i - 12i+11) sits at local (i + 9):30, the
// same as src/ring-segments/geometry-segments.ts.
const D0_OFFSET = 9
// Pixel positions of the whole installation in a unit square (-1..1), drawn like docs/layout.html.
const PIXEL_POS: { r: number; i: number; p: number; x: number; y: number }[] = []
{
  const at = (cx: number, cy: number, R: number, deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + R * Math.sin(a), cy - R * Math.cos(a)]
  }
  for (let r = 1; r <= 12; r++) {
    const A = (r + 0.5) * 30
    const [x1, y1] = at(0, 0, 500, A)
    for (let i = 0; i < 12; i++) {
      const Ai = A + 180 + (((i + D0_OFFSET) % 12) + 0.5) * 30
      const [x0, y0] = at(x1, y1, 100, Ai)
      for (let p = 0; p < 12; p++) {
        const [x, y] = at(x0, y0, 20, Ai + 180 + (p + 0.5) * 30)
        PIXEL_POS.push({ r, i, p, x: x / 640, y: y / 640 })
      }
    }
  }
}

/** Hue of a group as a function: a constant, or `linear(hue, hueEnd)` for a hue range. */
const hueLeaf = (c: HSV) => (c.hueEnd === undefined ? K(c.hue) : LINEAR(c.hue, c.hueEnd))

/**
 * Color of every pixel, the way the effects produce it: a split ring's hue comes from the layout function with
 * each group's leaf replaced by its hue (a gradient for a hue range); a whole ring's hue range runs along segment
 * `all`, around the d1 ring.
 */
function pixelColor(layout: Layout, colors: HSV[]) {
  const plans = Array.from({ length: 13 }, (_, r) => (r ? layout.ring(r) : null))
  const hueFns = plans.map(pl => (pl?.fn && pl.other !== undefined && colors[pl.base] && colors[pl.other]
    ? mapLeaves(pl.fn, hueLeaf(colors[pl.base]), hueLeaf(colors[pl.other])) : null))
  return (r: number, i: number, p: number): HSV | undefined => {
    const plan = plans[r]!
    const c = colors[groupAt(plan, i, p)]
    if (!c) return undefined
    if (c.hueEnd === undefined) return c
    const idx = i * 12 + p
    const seg = c.gradientSeg ?? 'all'
    const hue = hueFns[r]
      ? evalFn(hueFns[r]!, relPos(plan.seg!, idx))
      : c.hue + (c.hueEnd - c.hue) * (relPos(seg, idx) / maxRelPos(seg))
    return { ...c, hue }
  }
}

/** CSS background for a swatch: a solid color, or a gradient for a hue range. */
function swatchCss(c: HSV) {
  if (c.hueEnd === undefined) return hsvCss(c)
  const stops = [0, 0.25, 0.5, 0.75, 1].map(t => hsvCss({ ...c, hue: c.hue + (c.hueEnd! - c.hue) * t }))
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

function drawInstallation(canvas: HTMLCanvasElement, layout: Layout, colors: HSV[], modify?: (r: number, i: number, p: number, c: HSV) => HSV) {
  const { ctx, w, h } = fitCanvas(canvas)
  ctx.clearRect(0, 0, w, h)
  const s = Math.min(w, h) / 2
  const dot = Math.max(1, s / 100)
  const colorAt = pixelColor(layout, colors)
  for (const { r, i, p, x, y } of PIXEL_POS) {
    let c = colorAt(r, i, p)
    if (c && modify) c = modify(r, i, p, c)
    ctx.fillStyle = c ? hsvCss(c) : '#555'
    ctx.beginPath()
    ctx.arc(w / 2 + x * s, h / 2 + y * s, dot, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** The layer's colors, padded or trimmed to its number of groups. */
function fitColors(layer: LayerDef) {
  while (layer.colors.length < layer.groups) layer.colors.push({ ...DEFAULT_COLORS[layer.colors.length % 4] })
  layer.colors.length = layer.groups
}

function openDrawer(layer: LayerDef) {
  editingBg = null
  editingTrans = null
  editingMotion = null
  editing = layer
  fitColors(layer)
  drawer.hidden = false
  document.body.classList.add('drawer-open')
  renderDrawer()
}
function closeDrawer() {
  editing = null
  editingBg = null
  editingTrans = null
  editingMotion = null
  drawer.hidden = true
  document.body.classList.remove('drawer-open')
}

const pct = (n: number) => `${Math.round((n / 1728) * 100)}%`

function renderDrawer() {
  const layer = editing
  if (!layer) return
  drawer.innerHTML = `
    <div class="drawer-head">
      <input id="dName" value="${layer.name}" title="Layer name">
      <button id="dClose" title="Close (Esc)">✕</button>
    </div>
    <div class="drawer-row">
      <label>Groups <select id="dGroups">${[1, 2, 3, 4].map(g => `<option${g === layer.groups ? ' selected' : ''}>${g}</option>`).join('')}</select></label>
    </div>
    <div class="drawer-row">
      <label>Balance <input id="dBalance" type="range" min="0" max="1" step="0.01" value="${layer.balance}"${layer.groups === 1 ? ' disabled' : ''}></label>
      <output id="dBalanceOut">${layer.balance.toFixed(2)}</output>
    </div>
    <div class="drawer-row">
      <label>Clustering <input id="dClustering" type="range" min="0" max="1" step="0.01" value="${layer.clustering}"></label>
      <output id="dClusteringOut">${layer.clustering.toFixed(2)}</output>
    </div>
    <canvas id="dPreview" class="preview"></canvas>
    <div class="drawer-layout" id="dLayoutInfo"></div>
    <h3>Colors</h3>
    <div id="dColors"></div>
    <h3>Layouts for these parameters</h3>
    <div class="thumbs" id="dThumbs"></div>`
  $('dClose').addEventListener('click', closeDrawer)
  $<HTMLInputElement>('dName').addEventListener('change', e => {
    const name = (e.target as HTMLInputElement).value.trim()
    if (!name || name === layer.name || layerByName(name)) { (e.target as HTMLInputElement).value = layer.name; return }
    for (const s of coloring.sections) if (s.layer === layer.name) s.layer = name
    if (lastLayer === layer.name) lastLayer = name
    layer.name = name
    changed()
  })
  const params = () => {
    layer.groups = Number($<HTMLSelectElement>('dGroups').value)
    layer.balance = Number($<HTMLInputElement>('dBalance').value)
    layer.clustering = Number($<HTMLInputElement>('dClustering').value)
    // Moving the parameters goes back to the catalog, replacing a custom layout.
    delete layer.custom
    fitColors(layer)
    layer.layout = bestLayout(layer.groups, layer.balance, layer.clustering)?.id ?? layer.layout
  }
  $('dGroups').addEventListener('change', () => { params(); changed(); renderDrawer() })
  for (const id of ['dBalance', 'dClustering']) {
    $(id).addEventListener('input', () => {
      params()
      $('dBalanceOut').textContent = layer.balance.toFixed(2)
      $('dClusteringOut').textContent = layer.clustering.toFixed(2)
      refreshDrawer()
      changed()
    })
  }
  renderColors()
  refreshDrawer()
}

function renderColors() {
  const layer = editing!
  const box = $('dColors')
  const slider = (g: number, ch: string, label: string, value: number, title = '') => `
    <label class="ch"${title ? ` title="${title}"` : ''}>${label}
      <input type="range" min="0" max="1" step="0.01" value="${value}" data-g="${g}" data-ch="${ch}">
      <output>${(ch === 'sat' ? layer.colors[g].sat : value).toFixed(2)}</output>
    </label>`
  box.innerHTML = layer.colors.map((c, g) => `
    <div class="color-row">
      <span class="swatch big" id="dSw${g}" style="background:${swatchCss(c)}"></span>
      <b>${LETTERS[g]}</b>
      <label class="ch range-toggle"><span></span><span><input type="checkbox" data-range="${g}"${c.hueEnd !== undefined ? ' checked' : ''}> hue range (gradient)</span></label>
      ${slider(g, 'hue', c.hueEnd !== undefined ? 'hue from' : 'hue', c.hue)}
      ${c.hueEnd !== undefined ? slider(g, 'hueEnd', 'hue to', c.hueEnd) : ''}
      ${c.hueEnd !== undefined ? `<label class="ch" title="Where the group covers whole rings (no split), the gradient runs along this segment">along
        <select data-seg="${g}">${GRADIENT_SEGMENTS.map(sg => `<option${sg === (c.gradientSeg ?? 'all') ? ' selected' : ''}>${sg}</option>`).join('')}</select><span></span>
      </label>` : ''}
      ${slider(g, 'sat', 'sat', seenSat(c.sat), 'Slider follows how saturated the LEDs look; the number is the sat value sent')}
      ${slider(g, 'val', 'bright', c.val)}
    </div>`).join('')
  box.querySelectorAll<HTMLInputElement>('input[type=range]').forEach(input => {
    input.addEventListener('input', () => {
      const g = Number(input.dataset.g), ch = input.dataset.ch as 'hue' | 'hueEnd' | 'sat' | 'val'
      // The sat slider moves evenly through how saturated the LEDs look; the value stored is the LED sat.
      const v = ch === 'sat' ? Math.round(satFromSeen(Number(input.value)) * 100) / 100 : Number(input.value)
      layer.colors[g][ch] = v
      input.nextElementSibling!.textContent = v.toFixed(2)
      $(`dSw${g}`).style.background = swatchCss(layer.colors[g])
      refreshDrawer()
      changed()
    })
  })
  box.querySelectorAll<HTMLSelectElement>('select[data-seg]').forEach(sel => {
    sel.addEventListener('change', () => {
      const c = layer.colors[Number(sel.dataset.seg)]
      if (sel.value === 'all') delete c.gradientSeg
      else c.gradientSeg = sel.value
      refreshDrawer()
      changed()
    })
  })
  box.querySelectorAll<HTMLInputElement>('input[data-range]').forEach(input => {
    input.addEventListener('change', () => {
      const c = layer.colors[Number(input.dataset.range)]
      if (input.checked) c.hueEnd = Math.min(1, Math.round((c.hue + 0.15) * 100) / 100)
      else { delete c.hueEnd; delete c.gradientSeg }
      renderColors()
      refreshDrawer()
      changed()
    })
  })
}

/** Preview, layout info and candidate thumbnails, for the current parameters. */
function refreshDrawer() {
  const layer = editing!
  const layout = layoutOf(layer)
  if (layout) drawInstallation($<HTMLCanvasElement>('dPreview'), layout, layer.colors)
  $('dLayoutInfo').innerHTML = layout
    ? `<b>${layout.title}</b>${layer.custom ? ' <span class="muted">(custom)</span>' : ''} <span class="muted">${layout.counts.map((n, g) => `${LETTERS[g]} ${pct(n)}`).join(' · ')}</span>`
    : '<span class="muted">No layout selected</span>'
  const thumbs = $('dThumbs')
  thumbs.innerHTML = ''
  const list = [...(layer.custom ? [layoutOf(layer)!] : []), ...candidates(layer.groups, layer.balance, layer.clustering)]
  if (!list.length) thumbs.innerHTML = '<span class="muted">No layout with these groups and balance.</span>'
  for (const l of list) {
    const item = document.createElement('button')
    item.className = 'thumb' + (l.id === (layer.custom ? 'custom' : layer.layout) ? ' on' : '')
    const c = document.createElement('canvas')
    item.appendChild(c)
    const t = document.createElement('span')
    t.textContent = l.title
    item.appendChild(t)
    item.addEventListener('click', () => {
      if (l.id === 'custom') return
      delete layer.custom
      layer.layout = l.id
      refreshDrawer()
      changed()
    })
    thumbs.appendChild(item)
    drawInstallation(c, l, layer.colors)
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !drawer.hidden) closeDrawer()
})
// --- background drawer ---------------------------------------------------------------------------------------

function openBgDrawer(layer: BgLayer) {
  editing = null
  editingTrans = null
  editingMotion = null
  editingBg = layer
  drawer.hidden = false
  document.body.classList.add('drawer-open')
  renderBgDrawer()
}

function renderBgDrawer() {
  const layer = editingBg
  if (!layer) return
  const ringButtons = ALL_RINGS.map(r => `<button class="ring${layer.rings.includes(r) ? ' on' : ''}" data-ring="${r}">${r}</button>`).join('')
  drawer.innerHTML = `
    <div class="drawer-head">
      <input id="dName" value="${layer.name}" title="Layer name">
      <button id="dClose" title="Close (Esc)">✕</button>
    </div>
    <p class="muted">Background: a texture repeated all through its sections, on top of the coloring.
      Play the song to see it in the simulation.</p>
    <div class="drawer-row"><label>Recipe <select id="bRecipe">
      <option value="sparkles"${layer.recipe === 'sparkles' ? ' selected' : ''}>sparkles</option>
      <option value="hueDrift"${layer.recipe === 'hueDrift' ? ' selected' : ''}>hue drift (sin)</option>
    </select></label></div>
    ${layer.recipe === 'hueDrift' ? `
    <div class="drawer-row"><label title="How far the hue moves each way, + and -">Hue swing
      <input id="bSwing" type="range" min="0" max="0.3" step="0.01" value="${layer.hueSwing ?? 0.1}"></label>
      <output id="bSwingOut">${(layer.hueSwing ?? 0.1).toFixed(2)}</output></div>
    <div class="drawer-row"><label>Shape <select id="bHueShape">
      <option value="sin"${(layer.hueShape ?? 'sin') === 'sin' ? ' selected' : ''}>sin (sway up and back)</option>
      <option value="linear"${layer.hueShape === 'linear' ? ' selected' : ''}>linear (ramp, then jump back)</option>
      <option value="rotate"${layer.hueShape === 'rotate' ? ' selected' : ''}>rotate (full round, linear 0 to 1)</option>
    </select></label></div>
    <div class="drawer-row"><label title="0: all rings sway together. 1: each ring at its own, scattered time">Scatter
      <input id="bHueScatter" type="range" min="0" max="1" step="0.01" value="${layer.hueScatter ?? 0}"></label>
      <output id="bHueScatterOut">${(layer.hueScatter ?? 0).toFixed(2)}</output></div>
    <div class="drawer-row"><button id="bShufflePhases">Shuffle ring phases</button>
      <span class="muted">${layer.ringPhases ? 'random phase per ring' : 'golden-ratio steps'}</span></div>
    <div class="drawer-row"><button id="bVaryRings" title="Random cycle (period ±25%) and swing (±30%) per ring">Vary cycle and swing per ring</button>
      <button id="bSameRings">Same for all</button>
      <span class="muted">${layer.ringPeriods ? 'each ring has its own cycle and swing' : 'all rings share period and swing'}</span></div>
    <p class="muted">The hue moves up by the swing, back, down by the swing and back, once per period.</p>` : `
    <div class="drawer-row"><label title="How far brightness moves away from the coloring">Intensity
      <input id="bIntensity" type="range" min="0" max="1" step="0.01" value="${layer.intensity}"></label>
      <output id="bIntensityOut">${layer.intensity.toFixed(2)}</output></div>
    <div class="drawer-row"><label title="Share of pixels lit at once">Density
      <input id="bDensity" type="range" min="0.01" max="0.5" step="0.01" value="${layer.density}"></label>
      <output id="bDensityOut">${layer.density.toFixed(2)}</output></div>
    <div class="drawer-row"><label title="Density swings up and down by this share, like breathing">Breath
      <input id="bBreath" type="range" min="0" max="1" step="0.01" value="${layer.breath ?? 0}"></label>
      <output id="bBreathOut">${(layer.breath ?? 0).toFixed(2)}</output></div>
    <div class="drawer-row"><label>One breath every <select id="bBreathBars">
      ${[1, 2, 4].map(n => `<option value="${n}"${n === (layer.breathBars ?? 1) ? ' selected' : ''}>${n} bar${n > 1 ? 's' : ''}</option>`).join('')}
    </select></label></div>
    <div class="drawer-row"><label title="0: all rings breathe together. 1: each ring at its own, scattered time">Breath scatter
      <input id="bScatter" type="range" min="0" max="1" step="0.01" value="${layer.breathScatter ?? 0}"></label>
      <output id="bScatterOut">${(layer.breathScatter ?? 0).toFixed(2)}</output></div>
    <p class="muted" id="bBreathNote"></p>`}
    <div class="drawer-row"><label>Period <select id="bPeriod">
      ${[1, 2, 4, 8, 16, 32].map(n => `<option value="${n}"${n === layer.period ? ' selected' : ''}>${n} beats</option>`).join('')}
    </select></label>
    ${layer.recipe === 'hueDrift' ? '' : `<label>Changes <select id="bChannel">
      <option value="brightness"${(layer.channel ?? 'brightness') === 'brightness' ? ' selected' : ''}>brightness</option>
      <option value="saturation"${layer.channel === 'saturation' ? ' selected' : ''}>saturation</option>
    </select></label>
    <label>Mode <select id="bMode">
      <option value="light"${layer.mode === 'light' ? ' selected' : ''}>${layer.channel === 'saturation' ? 'up (more color)' : 'light (brighter)'}</option>
      <option value="dark"${layer.mode === 'dark' ? ' selected' : ''}>${layer.channel === 'saturation' ? 'down (whiter)' : 'dark (dimmer)'}</option>
    </select></label>`}</div>
    <h3>Rings</h3>
    <div class="rings">${ringButtons}</div>
    <div class="drawer-row" style="margin-top:6px">
      <button id="bAll">All</button><button id="bBottom">Bottom 4-7</button><button id="bNone">None</button>
    </div>`
  $('dClose').addEventListener('click', closeDrawer)
  $<HTMLInputElement>('dName').addEventListener('change', e => {
    const name = (e.target as HTMLInputElement).value.trim()
    if (!name || name === layer.name || bgLayerByName(name)) { (e.target as HTMLInputElement).value = layer.name; return }
    for (const s of background.sections) if (s.layer === layer.name) s.layer = name
    if (lastBgLayer === layer.name) lastBgLayer = name
    layer.name = name
    changed()
  })
  const breathNote = () => {
    if (!document.getElementById('bBreathNote')) return
    const bars = layer.breathBars ?? 1
    $('bBreathNote').textContent = (layer.breath ?? 0) > 0 && layer.period % (BEATS_PER_BAR * bars) !== 0
      ? `The period (${layer.period} beats) is not a whole number of breaths, so each cycle cuts the breath short.`
      : ''
  }
  breathNote()
  document.getElementById('bHueShape')?.addEventListener('change', e => {
    layer.hueShape = (e.target as HTMLSelectElement).value as BgLayer['hueShape']
    changed()
  })
  document.getElementById('bShufflePhases')?.addEventListener('click', () => {
    layer.ringPhases = ALL_RINGS.map(() => Math.round(Math.random() * 1000) / 1000)
    if (!layer.hueScatter) layer.hueScatter = 1
    changed()
    renderBgDrawer()
  })
  document.getElementById('bVaryRings')?.addEventListener('click', () => {
    const r2 = (n: number) => Math.round(n * 100) / 100
    layer.ringPeriods = ALL_RINGS.map(() => r2(layer.period * (0.75 + Math.random() * 0.5)))
    layer.ringSwings = ALL_RINGS.map(() => Math.round((layer.hueSwing ?? 0.1) * (0.7 + Math.random() * 0.6) * 1000) / 1000)
    changed()
    renderBgDrawer()
  })
  document.getElementById('bSameRings')?.addEventListener('click', () => {
    delete layer.ringPeriods
    delete layer.ringSwings
    changed()
    renderBgDrawer()
  })
  $('bRecipe').addEventListener('change', e => {
    layer.recipe = (e.target as HTMLSelectElement).value as BgLayer['recipe']
    if (layer.recipe === 'hueDrift' && layer.hueSwing === undefined) layer.hueSwing = 0.1
    changed()
    renderBgDrawer()
  })
  for (const [id, key] of [['bIntensity', 'intensity'], ['bDensity', 'density'], ['bBreath', 'breath'], ['bScatter', 'breathScatter'], ['bSwing', 'hueSwing'], ['bHueScatter', 'hueScatter']] as const) {
    document.getElementById(id)?.addEventListener('input', e => {
      layer[key] = Number((e.target as HTMLInputElement).value)
      $(`${id}Out`).textContent = (layer[key] ?? 0).toFixed(2)
      breathNote()
      changed()
    })
  }
  document.getElementById('bBreathBars')?.addEventListener('change', e => { layer.breathBars = Number((e.target as HTMLSelectElement).value); breathNote(); changed() })
  $('bPeriod').addEventListener('change', e => { layer.period = Number((e.target as HTMLSelectElement).value); breathNote(); changed() })
  document.getElementById('bChannel')?.addEventListener('change', e => {
    layer.channel = (e.target as HTMLSelectElement).value as BgLayer['channel']
    changed()
    renderBgDrawer()
  })
  document.getElementById('bMode')?.addEventListener('change', e => { layer.mode = (e.target as HTMLSelectElement).value as BgLayer['mode']; changed() })
  drawer.querySelectorAll<HTMLButtonElement>('button[data-ring]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = Number(btn.dataset.ring)
      layer.rings = layer.rings.includes(r) ? layer.rings.filter(x => x !== r) : [...layer.rings, r].sort((a, b) => a - b)
      changed()
      renderBgDrawer()
    })
  })
  const setRings = (rings: number[]) => { layer.rings = rings; changed(); renderBgDrawer() }
  $('bAll').addEventListener('click', () => setRings([...ALL_RINGS]))
  $('bBottom').addEventListener('click', () => setRings([4, 5, 6, 7]))
  $('bNone').addEventListener('click', () => setRings([]))
}

// --- transition drawer ---------------------------------------------------------------------------------------

function openTransDrawer(layer: TransLayer) {
  editing = null
  editingBg = null
  editingMotion = null
  editingTrans = layer
  drawer.hidden = false
  document.body.classList.add('drawer-open')
  renderTransDrawer()
}

function renderTransDrawer() {
  const layer = editingTrans
  if (!layer) return
  const opt = <T extends string>(values: [T, string][], cur: T | undefined) =>
    values.map(([v, label]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`).join('')
  drawer.innerHTML = `
    <div class="drawer-head">
      <input id="dName" value="${layer.name}" title="Layer name">
      <button id="dClose" title="Close (Esc)">✕</button>
    </div>
    <p class="muted">Transition: brings the scene in or takes it out over the section, scaling the brightness of
      everything underneath. Put a fade in on the first bars of a part and a fade out on its last bars.</p>
    <div class="drawer-row"><label>Direction <select id="tDirection">
      ${opt([['in', 'in (introduce)'], ['out', 'out (sunset)']], layer.direction)}</select></label></div>
    <div class="drawer-row"><label>Style <select id="tStyle">
      ${opt([['fade', 'fade'], ['steps', 'steps'], ['rings', 'rings one by one'], ['build', 'build: groups come in, then pump']], layer.style)}</select></label></div>
    ${layer.style === 'build' ? `
    <div class="drawer-row"><label>Groups <select id="tGroups">
      ${[2, 3, 4, 6].map(n => `<option value="${n}"${n === (layer.groups ?? 3) ? ' selected' : ''}>${n}</option>`).join('')}
    </select></label>
    <label>Grouping <select id="tOrder">
      ${opt([['alternate', 'alternate ring by ring'], ['clockwise', 'clockwise blocks'], ['bottom-up', 'bottom up'], ['scattered', 'scattered']], layer.order ?? 'alternate')}
    </select></label></div>
    <div class="drawer-row"><label title="Absolute brightness the groups come in at">Level
      <input id="tLevel" type="range" min="0" max="1" step="0.01" value="${layer.level ?? 0.3}"></label>
      <output id="tLevelOut">${(layer.level ?? 0.3).toFixed(2)}</output></div>
    <div class="drawer-row"><label><input type="checkbox" id="tPump"${layer.pump ? ' checked' : ''}> pump to full brightness on the last stage</label></div>
    <p class="muted">The section is split into equal stages: one per group, plus the pump. On a 1-bar section with 3 groups
      and the pump, every stage is one beat.</p>` : ''}
    ${layer.style === 'steps' ? `<div class="drawer-row"><label>Steps <select id="tSteps">
      ${[2, 3, 4, 6, 8, 12, 16].map(n => `<option value="${n}"${n === (layer.steps ?? 4) ? ' selected' : ''}>${n}</option>`).join('')}
    </select></label></div>` : ''}
    ${layer.style === 'rings' ? `<div class="drawer-row"><label>Ring order <select id="tOrder">
      ${opt([['bottom-up', 'bottom up (sunrise)'], ['clockwise', 'clockwise from ring 1'], ['scattered', 'scattered']], layer.order ?? 'bottom-up')}
    </select></label></div>` : ''}`
  $('dClose').addEventListener('click', closeDrawer)
  $<HTMLInputElement>('dName').addEventListener('change', e => {
    const name = (e.target as HTMLInputElement).value.trim()
    if (!name || name === layer.name || transLayerByName(name)) { (e.target as HTMLInputElement).value = layer.name; return }
    for (const s of transition.sections) if (s.layer === layer.name) s.layer = name
    if (lastTransLayer === layer.name) lastTransLayer = name
    layer.name = name
    changed()
  })
  $('tDirection').addEventListener('change', e => { layer.direction = (e.target as HTMLSelectElement).value as TransLayer['direction']; changed() })
  $('tStyle').addEventListener('change', e => { layer.style = (e.target as HTMLSelectElement).value as TransLayer['style']; changed(); renderTransDrawer() })
  document.getElementById('tSteps')?.addEventListener('change', e => { layer.steps = Number((e.target as HTMLSelectElement).value); changed() })
  document.getElementById('tGroups')?.addEventListener('change', e => { layer.groups = Number((e.target as HTMLSelectElement).value); changed() })
  document.getElementById('tLevel')?.addEventListener('input', e => {
    layer.level = Number((e.target as HTMLInputElement).value)
    $('tLevelOut').textContent = layer.level.toFixed(2)
    changed()
  })
  document.getElementById('tPump')?.addEventListener('change', e => { layer.pump = (e.target as HTMLInputElement).checked; changed() })
  document.getElementById('tOrder')?.addEventListener('change', e => { layer.order = (e.target as HTMLSelectElement).value as TransLayer['order']; changed() })
}

// --- motion drawer -------------------------------------------------------------------------------------------

function openMotionDrawer(layer: MotionLayer) {
  editing = null
  editingBg = null
  editingTrans = null
  editingMotion = layer
  drawer.hidden = false
  document.body.classList.add('drawer-open')
  renderMotionDrawer()
}

function renderMotionDrawer() {
  const layer = editingMotion
  if (!layer) return
  const ringButtons = ALL_RINGS.map(r => `<button class="ring${layer.rings.includes(r) ? ' on' : ''}" data-ring="${r}">${r}</button>`).join('')
  const slider = (key: 'tail' | 'delay' | 'intensity', label: string, min: number, max: number, title: string) => `
    <div class="drawer-row"><label title="${title}">${label}
      <input id="m_${key}" type="range" min="${min}" max="${max}" step="0.01" value="${layer[key]}"></label>
      <output id="m_${key}Out">${layer[key].toFixed(2)}</output></div>`
  drawer.innerHTML = `
    <div class="drawer-head">
      <input id="dName" value="${layer.name}" title="Layer name">
      <button id="dClose" title="Close (Esc)">✕</button>
    </div>
    <p class="muted">Motion: snakes travelling along a segment. Glow adds a bright streak on top of the scene; mask lights
      only the snake.</p>
    <div class="drawer-row"><label>Recipe <select id="mRecipe">
      <option value="shoot"${layer.recipe === 'shoot' ? ' selected' : ''}>shoot (a snake travels the segment)</option>
      <option value="swell"${layer.recipe === 'swell' ? ' selected' : ''}>swell (whole rings brighten and fade)</option>
    </select></label></div>
    <div class="drawer-row"><label>Segment <select id="mSegment">
      ${[['rad', 'rad: center outward'], ['arc', 'arc: around each small ring, both sides'], ['all', 'all: around the ring'], ['updown', 'updown: one way in space'], ['centric', 'centric: around each small ring']]
        .map(([v, t]) => `<option value="${v}"${v === layer.segment ? ' selected' : ''}>${t}</option>`).join('')}
    </select></label>
    <label>Head <select id="mHeadShape">
      <option value="linear"${(layer.headShape ?? 'linear') === 'linear' ? ' selected' : ''}>linear: shoot out and leave</option>
      <option value="sin"${layer.headShape === 'sin' ? ' selected' : ''}>sin: grow out and pull back</option>
    </select></label>
    <label title="For the sin head: shift each ring so the rings make one motion around the circle">Ring phase <select id="mRingPhase">
      <option value="none"${(layer.ringPhase ?? 'none') === 'none' ? ' selected' : ''}>together</option>
      <option value="around"${layer.ringPhase === 'around' ? ' selected' : ''}>around the circle</option>
      <option value="around2"${layer.ringPhase === 'around2' ? ' selected' : ''}>around twice (2 waves)</option>
      <option value="across"${layer.ringPhase === 'across' ? ' selected' : ''}>across, left to right</option>
    </select></label>
    <label>Draw <select id="mDraw">
      <option value="glow"${layer.draw === 'glow' ? ' selected' : ''}>glow (light on top)</option>
      <option value="mask"${layer.draw === 'mask' ? ' selected' : ''}>mask (only the snake)</option>
    </select></label></div>
    <div class="drawer-row"><label>Period <select id="mPeriod">
      ${[1, 1.5, 2, 3, 4, 8].map(n => `<option value="${n}"${n === layer.period ? ' selected' : ''}>${n} beats</option>`).join('')}
    </select></label></div>
    ${slider('tail', 'Tail', 0.05, 1, 'Snake length, as a share of the segment')}
    ${slider('delay', 'Delay', 0, 1, 'Pause before the snake enters each cycle')}
    ${slider('intensity', 'Intensity', 0, 1, 'For glow: how bright the snake head gets')}
    <div class="drawer-row"><button id="mVary" title="Random period, tail, delay and intensity per ring">Vary per ring</button>
      <button id="mSame">Same for all</button>
      <span class="muted">${layer.ringParams ? 'each ring has its own parameters' : 'all rings share the parameters'}</span></div>
    <h3>Rings</h3>
    <div class="rings">${ringButtons}</div>
    <div class="drawer-row" style="margin-top:6px">
      <button id="mAll">All</button><button id="mNone">None</button>
    </div>`
  $('dClose').addEventListener('click', closeDrawer)
  $<HTMLInputElement>('dName').addEventListener('change', e => {
    const name = (e.target as HTMLInputElement).value.trim()
    if (!name || name === layer.name || motionLayerByName(name)) { (e.target as HTMLInputElement).value = layer.name; return }
    for (const s of motion.sections) if (s.layer === layer.name) s.layer = name
    if (lastMotionLayer === layer.name) lastMotionLayer = name
    layer.name = name
    changed()
  })
  $('mSegment').addEventListener('change', e => { layer.segment = (e.target as HTMLSelectElement).value; changed() })
  $('mRecipe').addEventListener('change', e => { layer.recipe = (e.target as HTMLSelectElement).value as MotionLayer['recipe']; changed() })
  $('mRingPhase').addEventListener('change', e => { layer.ringPhase = (e.target as HTMLSelectElement).value as MotionLayer['ringPhase']; changed() })
  $('mHeadShape').addEventListener('change', e => { layer.headShape = (e.target as HTMLSelectElement).value as MotionLayer['headShape']; changed() })
  $('mDraw').addEventListener('change', e => { layer.draw = (e.target as HTMLSelectElement).value as MotionLayer['draw']; changed() })
  $('mPeriod').addEventListener('change', e => { layer.period = Number((e.target as HTMLSelectElement).value); changed() })
  for (const key of ['tail', 'delay', 'intensity'] as const) {
    $(`m_${key}`).addEventListener('input', e => {
      layer[key] = Number((e.target as HTMLInputElement).value)
      $(`m_${key}Out`).textContent = layer[key].toFixed(2)
      changed()
    })
  }
  $('mVary').addEventListener('click', () => {
    const r2 = (n: number) => Math.round(n * 100) / 100
    const vary = (v: number, spread: number, lo: number, hi: number) => r2(Math.min(hi, Math.max(lo, v * (1 - spread + Math.random() * 2 * spread))))
    layer.ringParams = ALL_RINGS.map(() => ({
      period: vary(layer.period, 0.35, 0.5, 16), tail: vary(layer.tail, 0.4, 0.05, 1),
      delay: r2(Math.random() * Math.max(0.1, layer.delay * 2)), intensity: vary(layer.intensity, 0.2, 0, 1),
      startOffset: r2(Math.random() * 0.75),
    }))
    changed()
    renderMotionDrawer()
  })
  $('mSame').addEventListener('click', () => { delete layer.ringParams; changed(); renderMotionDrawer() })
  drawer.querySelectorAll<HTMLButtonElement>('button[data-ring]').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = Number(btn.dataset.ring)
      layer.rings = layer.rings.includes(r) ? layer.rings.filter(x => x !== r) : [...layer.rings, r].sort((a, b) => a - b)
      changed()
      renderMotionDrawer()
    })
  })
  $('mAll').addEventListener('click', () => { layer.rings = [...ALL_RINGS]; changed(); renderMotionDrawer() })
  $('mNone').addEventListener('click', () => { layer.rings = []; changed(); renderMotionDrawer() })
}

// --- lanes: coloring and background ---------------------------------------------------------------------------

const laneCanvas = (id: LaneId) => (id === 'coloring' ? lane : id === 'override' ? overrideLane : id === 'background' ? bgLane
  : id === 'motion' ? motionLane : transLane)
const openLayerOf = (id: LaneId, sec: Section) => (isColoringLane(id)
  ? openDrawer(layerByName(sec.layer) ?? newLayer(sec.layer))
  : id === 'background'
    ? openBgDrawer(bgLayerByName(sec.layer) ?? newBgLayer(sec.layer))
    : id === 'motion'
      ? openMotionDrawer(motionLayerByName(sec.layer) ?? newMotionLayer(sec.layer))
      : openTransDrawer(transLayerByName(sec.layer) ?? newTransLayer(sec.layer)))

// Create by dragging empty bars, select by clicking, resize by dragging an edge, double-click to edit the layer.
type Drag =
  | { lane: LaneId; mode: 'create'; anchor: number; current: number; moved: boolean; startX: number }
  | { lane: LaneId; mode: 'resize'; sec: Section; edge: 'start' | 'end'; moved: boolean; startX: number }
let drag: Drag | null = null

function laneTime(id: LaneId, e: MouseEvent) {
  const r = laneCanvas(id).getBoundingClientRect()
  const { t0, t1 } = viewWindow()
  return { t: t0 + ((e.clientX - r.left) / r.width) * (t1 - t0), px: e.clientX - r.left, w: r.width, t0, t1 }
}
function edgeAt(id: LaneId, e: MouseEvent) {
  const { px, w, t0, t1 } = laneTime(id, e)
  const x = (t: number) => ((t - t0) / (t1 - t0)) * w
  for (const sec of sectionsOf(id)) {
    if (Math.abs(x(timeOfBar(sec.startBar)) - px) <= EDGE_PX) return { sec, edge: 'start' as const }
    if (Math.abs(x(timeOfBar(sec.endBar)) - px) <= EDGE_PX) return { sec, edge: 'end' as const }
  }
  return null
}

for (const id of LANES) {
  const canvas = laneCanvas(id)
  canvas.addEventListener('dblclick', () => { if (selected && selectedLane === id) openLayerOf(id, selected) })
  canvas.addEventListener('mousedown', e => {
    const { t } = laneTime(id, e)
    const edge = edgeAt(id, e)
    if (edge) {
      drag = { lane: id, mode: 'resize', ...edge, moved: false, startX: e.clientX }
      selected = edge.sec
      selectedLane = id
      renderPanel()
      return
    }
    const bar = barAt(t)
    const hit = sectionAtBar(bar, id)
    if (hit) { selected = hit; selectedLane = id; renderPanel(); draw(); return }
    if (bar < 1 || bar >= endBarOfSong()) return
    drag = { lane: id, mode: 'create', anchor: bar, current: bar, moved: false, startX: e.clientX }
  })
}
window.addEventListener('mousemove', e => {
  if (!drag) {
    for (const id of LANES) {
      const canvas = laneCanvas(id)
      if (e.target === canvas) canvas.style.cursor = edgeAt(id, e) ? 'ew-resize' : 'crosshair'
    }
    return
  }
  if (Math.abs(e.clientX - drag.startX) > 3) drag.moved = true
  const { t } = laneTime(drag.lane, e)
  if (drag.mode === 'create') {
    const { lo, hi } = freeRange(drag.lane, drag.anchor)
    drag.current = Math.max(lo, Math.min(hi - 1, barAt(t)))
  } else {
    const { sec } = drag
    const { lo, hi } = freeRange(drag.lane, sec.startBar, sec)
    const edgeBar = nearestBarEdge(t)
    if (drag.edge === 'start') sec.startBar = Math.max(lo, Math.min(sec.endBar - 1, edgeBar))
    else sec.endBar = Math.min(hi, Math.max(sec.startBar + 1, edgeBar))
  }
  draw()
})
window.addEventListener('mouseup', () => {
  if (!drag) return
  const d = drag
  drag = null
  if (d.mode === 'create') {
    if (d.moved) addSection(d.lane, Math.min(d.anchor, d.current), Math.max(d.anchor, d.current) + 1)
    else { selected = null; renderPanel(); draw() }
  } else if (d.moved) changed()
})

songSelect.innerHTML = songNames.map(n => `<option value="${n}">${n}</option>`).join('')
const requested = new URLSearchParams(location.search).get('song')
songSelect.value = requested && songNames.includes(requested) ? requested : songNames.includes('shemesh') ? 'shemesh' : songNames[0]
loadSong(songSelect.value)
