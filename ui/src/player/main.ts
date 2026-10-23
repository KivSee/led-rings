import { effectKind, effectRelTime, missingSegments, PIXELS_PER_RING, renderRing, type HSV, type Sequence } from './render'

// Sequence Player: play a song's audio and show, next to it, what the rings draw — the sequence its .ts file
// sends, rendered here the way the ring controllers render it. Open at /player.html?song=<name> while `yarn ui`
// is running. "Rebuild from .ts" re-runs the song file (src/export-sequence.ts) and reloads its sequence.

interface SongJson {
  song: { name: string; bpm: number; lengthSeconds: number; startOffsetMs?: number; audioFilePath?: string; beatTimestampsMs?: number[] }
}

const BEATS_PER_BAR = 4
const CONTROL_SERVER_URL_STORAGE_KEY = 'kivsee-control-server-url'
const STRIP_STEP_MS = 200

const songFiles = import.meta.glob<SongJson>(['../../../src/songs/*.json', '!../../../src/songs/*.layers.json'], { import: 'default' })
const songNames = Object.keys(songFiles).map(p => p.replace(/^.*\/(.*)\.json$/, '$1')).sort()

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const audio = $<HTMLAudioElement>('audio')
const songSelect = $<HTMLSelectElement>('song')
const playBtn = $<HTMLButtonElement>('play')
const status = $('status')
const sim = $<HTMLCanvasElement>('sim')
const timeline = $<HTMLCanvasElement>('timeline')
const inspect = $('inspect')

let songName = ''
let durationMs = 0
let beats: number[] = []
let peaks: Float32Array = new Float32Array(0)
let sequence: Sequence = {}
let selectedRing = 0
// Average color of every ring over the song, one column per STRIP_STEP_MS, filled in the background.
let strip: Uint8ClampedArray | null = null
let stripToken = 0

// Without audio the playhead runs on its own clock.
let clockStart = 0, clockAt = 0, clockRunning = false

const fmt = (ms: number, decimals = 2) => {
  const s = Math.max(0, ms) / 1000
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(decimals).padStart(decimals ? 3 + decimals : 2, '0')}`
}

// --- time -----------------------------------------------------------------------------------------------

const hasAudio = () => !!audio.getAttribute('src')
const nowMs = () => hasAudio() ? audio.currentTime * 1000
  : clockRunning ? clockAt + (performance.now() - clockStart) * speed() : clockAt
const speed = () => Number($<HTMLSelectElement>('speed').value)
const playing = () => hasAudio() ? !audio.paused : clockRunning

function seek(ms: number) {
  ms = Math.min(Math.max(0, ms), durationMs)
  if (hasAudio()) audio.currentTime = ms / 1000
  else { clockAt = ms; clockStart = performance.now() }
}
function togglePlay() {
  if (hasAudio()) { if (audio.paused) audio.play(); else audio.pause() }
  else { clockAt = nowMs(); clockStart = performance.now(); clockRunning = !clockRunning }
}

/** Beat number (fractional) at time t, as beats(start, end) counts them; negative before the first beat. */
function beatAt(t: number) {
  if (!beats.length) return 0
  if (t < beats[0]) return (t - beats[0]) / (beats[1] - beats[0] || 1)
  let lo = 0, hi = beats.length - 1
  if (t >= beats[hi]) return hi + (t - beats[hi]) / (beats[hi] - beats[hi - 1] || 1)
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (beats[mid] <= t) lo = mid; else hi = mid }
  return lo + (t - beats[lo]) / (beats[hi] - beats[lo])
}
const timeOfBeat = (b: number) => beats[Math.max(0, Math.min(beats.length - 1, Math.round(b)))] ?? 0

// --- loading -------------------------------------------------------------------------------------------------

async function audioUrl(file: string): Promise<string | null> {
  const local = `/${encodeURIComponent(file)}`
  try {
    const r = await fetch(local, { method: 'HEAD' })
    if (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')) return local
  } catch { /* fall through */ }
  const api = localStorage.getItem(CONTROL_SERVER_URL_STORAGE_KEY) || 'http://localhost:3080'
  const remote = `${api}/api/audio?path=${encodeURIComponent(file)}`
  try {
    if ((await fetch(remote, { method: 'HEAD' })).ok) return remote
  } catch { /* not available */ }
  return null
}

async function loadSequence(): Promise<boolean> {
  const r = await fetch(`/${encodeURIComponent(songName)}.sequence.json?t=${Date.now()}`)
  if (!r.ok || (r.headers.get('content-type') ?? '').includes('text/html')) {
    sequence = {}
    status.textContent = `no sequence yet for ${songName}: press "Rebuild from .ts"`
    return false
  }
  sequence = await r.json()
  const n = Object.values(sequence).reduce((s, t) => s + t.effects.length, 0)
  status.textContent = `${n} effects on ${Object.keys(sequence).length} rings`
  const missing = missingSegments(sequence)
  if (missing.length) status.textContent += ` · ⚠ segments not in segments.json: ${missing.join(', ')} (their effects are not shown, and the rings would reject this sequence)`
  buildStrip()
  return true
}

async function rebuild() {
  const btn = $<HTMLButtonElement>('rebuild')
  btn.disabled = true
  status.textContent = `running src/songs/${songName}.ts…`
  try {
    const r = await fetch(`/api/export-sequence?song=${encodeURIComponent(songName)}`, { method: 'POST' })
    const text = await r.text()
    if (!r.ok) { status.textContent = `rebuild failed: ${text.slice(-300)}`; return }
    await loadSequence()
  } catch (e) {
    status.textContent = `rebuild failed: ${e}`
  } finally {
    btn.disabled = false
  }
}

async function loadSong(name: string) {
  audio.pause()
  clockRunning = false
  clockAt = 0
  songName = name
  history.replaceState(null, '', `?song=${encodeURIComponent(name)}`)
  const s = (await songFiles[`../../../src/songs/${name}.json`]()).song
  durationMs = s.lengthSeconds * 1000
  const beatMs = 60000 / s.bpm
  beats = s.beatTimestampsMs?.length
    ? s.beatTimestampsMs
    : Array.from({ length: Math.ceil(durationMs / beatMs) + 1 }, (_, n) => (s.startOffsetMs ?? 0) + n * beatMs)
  peaks = new Float32Array(0)
  strip = null
  $('duration').textContent = fmt(durationMs, 0)
  if (!(await loadSequence())) await rebuild()
  const url = s.audioFilePath ? await audioUrl(s.audioFilePath) : null
  if (!url) {
    audio.removeAttribute('src')
    status.textContent += ` · no audio${s.audioFilePath ? ` ("${s.audioFilePath}" not in ui/public or the control server)` : ''}, playing silently`
    return
  }
  audio.src = url
  try {
    const decoded = await new AudioContext().decodeAudioData(await (await fetch(url)).arrayBuffer())
    peaks = computePeaks(decoded)
  } catch { /* no waveform, still plays */ }
}

function computePeaks(buf: AudioBuffer): Float32Array {
  const per = Math.max(1, Math.round(buf.sampleRate * 0.02))
  const out = new Float32Array(Math.ceil(buf.length / per))
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]), k = (i / per) | 0; if (v > out[k]) out[k] = v }
  }
  return out
}

// --- colors --------------------------------------------------------------------------------------------------

// Seen saturation is sat ^ 4 on the LEDs, the same model the Song Sync page uses.
function hsvRgb({ hue, sat, val }: HSV): [number, number, number] {
  const s = Math.pow(Math.min(1, Math.max(0, sat)), 4), v = Math.min(1, Math.max(0, val))
  const h = (((hue % 1) + 1) % 1) * 6, i = Math.floor(h), f = h - i
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f))
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]
  return [r * 255, g * 255, b * 255]
}

const newLeds = () => Array.from({ length: PIXELS_PER_RING }, () => ({ hue: 0, sat: 0, val: 0 }))
const ringLeds = Array.from({ length: 13 }, newLeds)

// --- the installation ------------------------------------------------------------------------------------------

// The wiring starts 9 small rings in: physical small ring i (pixels 12i - 12i+11) sits at local (i + 9):30, the
// same as src/ring-segments/geometry-segments.ts.
const D0_OFFSET = 9
// Pixel positions in a unit square (-1..1), like docs/layout.html: ring r at r:30, physical d0 i at local (i + 9):30.
const PIXEL_POS: { r: number; index: number; x: number; y: number }[] = []
const RING_CENTER: { x: number; y: number }[] = []
{
  const at = (cx: number, cy: number, R: number, deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + R * Math.sin(a), cy - R * Math.cos(a)]
  }
  for (let r = 1; r <= 12; r++) {
    const A = (r + 0.5) * 30
    const [x1, y1] = at(0, 0, 500, A)
    RING_CENTER[r] = { x: x1 / 640, y: y1 / 640 }
    for (let i = 0; i < 12; i++) {
      const Ai = A + 180 + (((i + D0_OFFSET) % 12) + 0.5) * 30
      const [x0, y0] = at(x1, y1, 100, Ai)
      for (let p = 0; p < 12; p++) {
        const [x, y] = at(x0, y0, 20, Ai + 180 + (p + 0.5) * 30)
        PIXEL_POS.push({ r, index: i * 12 + p, x: x / 640, y: y / 640 })
      }
    }
  }
}

function fitCanvas(c: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr)
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
  const ctx = c.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: c.clientWidth, h: c.clientHeight }
}

function drawSim(t: number) {
  for (let r = 1; r <= 12; r++) renderRing(sequence[`ring${r}`], t, ringLeds[r])
  const { ctx, w, h } = fitCanvas(sim)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const s = Math.min(w, h) / 2
  const dot = Math.max(1.2, s / 95)
  if (selectedRing) {
    const c = RING_CENTER[selectedRing]
    ctx.strokeStyle = '#4f8cff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(w / 2 + c.x * s, h / 2 + c.y * s, s * 0.25, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (const { r, index, x, y } of PIXEL_POS) {
    const px = ringLeds[r][index]
    const cx = w / 2 + x * s, cy = h / 2 + y * s
    if (px.val <= 0.004) {
      ctx.fillStyle = '#151820'
    } else {
      const [R, G, B] = hsvRgb(px)
      ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`
    }
    ctx.beginPath()
    ctx.arc(cx, cy, dot, 0, Math.PI * 2)
    ctx.fill()
  }
}

// --- timeline: waveform, beats, and each ring's color over the song ------------------------------------------

/** Render the color strip in the background, a chunk of columns per frame. */
function buildStrip() {
  const token = ++stripToken
  const cols = Math.ceil(durationMs / STRIP_STEP_MS)
  const data = new Uint8ClampedArray(cols * 12 * 4)
  strip = data
  const leds = newLeds()
  let col = 0
  const step = () => {
    if (token !== stripToken) return
    const until = performance.now() + 12
    while (col < cols && performance.now() < until) {
      for (let r = 1; r <= 12; r++) {
        renderRing(sequence[`ring${r}`], col * STRIP_STEP_MS, leds)
        let R = 0, G = 0, B = 0
        for (const px of leds) { const [a, b, c] = hsvRgb(px); R += a; G += b; B += c }
        // Brighten the average, since most rings light only some of their pixels.
        const k = Math.min(3, 255 / Math.max(1, R / leds.length, G / leds.length, B / leds.length)) / leds.length
        const o = (col * 12 + r - 1) * 4
        data[o] = R * k; data[o + 1] = G * k; data[o + 2] = B * k; data[o + 3] = 255
      }
      col++
    }
    if (col < cols) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const WAVE_H = 46, ROW_H = 7
function drawTimeline(t: number) {
  const { ctx, w, h } = fitCanvas(timeline)
  ctx.clearRect(0, 0, w, h)
  const x = (ms: number) => (ms / durationMs) * w
  // Bars
  ctx.fillStyle = '#232837'
  for (let b = 0; b < beats.length; b += BEATS_PER_BAR * 4) ctx.fillRect(x(beats[b]), 0, 1, WAVE_H)
  // Waveform
  if (peaks.length) {
    ctx.fillStyle = '#3a4a66'
    const per = peaks.length / w
    for (let px = 0; px < w; px++) {
      let m = 0
      for (let k = Math.floor(px * per); k < Math.floor((px + 1) * per); k++) m = Math.max(m, peaks[k] ?? 0)
      const ph = m * (WAVE_H - 4)
      ctx.fillRect(px, WAVE_H / 2 - ph / 2, 1, ph)
    }
  }
  // Ring colors, ring 1 on top
  if (strip) {
    const cols = strip.length / 48
    const img = new ImageData(new Uint8ClampedArray(strip), 12, cols)
    const off = new OffscreenCanvas(12, cols)
    off.getContext('2d')!.putImageData(img, 0, 0)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(0, WAVE_H)
    ctx.transform(0, 1, 1, 0, 0, 0) // swap axes: image x (ring) goes down, image y (time) goes right
    ctx.drawImage(off, 0, 0, 12, cols, 0, 0, 12 * ROW_H, (cols * STRIP_STEP_MS / durationMs) * w)
    ctx.restore()
    if (selectedRing) {
      ctx.strokeStyle = '#4f8cff'
      ctx.strokeRect(0.5, WAVE_H + (selectedRing - 1) * ROW_H + 0.5, w - 1, ROW_H - 1)
    }
  }
  // Playhead
  ctx.fillStyle = '#ff4d6d'
  ctx.fillRect(x(t) - 1, 0, 2, h)
}

// --- readouts and the effects of the selected ring -------------------------------------------------------------

function drawReadout(t: number) {
  $('time').textContent = fmt(t)
  const b = beatAt(t)
  const whole = Math.floor(b)
  $('barbeat').textContent = b < 0 ? 'before beat 0' : `bar ${Math.floor(whole / BEATS_PER_BAR) + 1} · beat ${(whole % BEATS_PER_BAR) + 1}`
  $('beatnum').textContent = `beat ${b.toFixed(1)}`
  const spans = $('beats').children
  for (let k = 0; k < spans.length; k++) spans[k].className = b >= 0 && whole % BEATS_PER_BAR === k ? (k ? 'on' : 'on down') : ''
  playBtn.textContent = playing() ? '❚❚ Pause' : '▶ Play'
}

let lastInspectKey = ''
function drawInspect(t: number) {
  if (!selectedRing) {
    if (lastInspectKey !== '') { inspect.innerHTML = '<p class="muted">Click a ring in the simulation to see its effects at the playhead.</p>'; lastInspectKey = '' }
    return
  }
  const seq = sequence[`ring${selectedRing}`]
  const active = (seq?.effects ?? []).map((e, n) => ({ e, n, rel: effectRelTime(e.effect_config, t) })).filter(a => a.rel !== undefined)
  const key = `${selectedRing}|${active.map(a => a.n).join(',')}`
  if (key === lastInspectKey) return
  lastInspectKey = key
  const beatOf = (ms: number) => { const v = beatAt(ms); return Math.abs(v - Math.round(v)) < 0.02 ? String(Math.round(v)) : v.toFixed(2) }
  inspect.innerHTML = `
    <div class="inspect-head">Ring ${selectedRing} · ${active.length} active effect${active.length === 1 ? '' : 's'} <span class="muted">(in render order)</span></div>
    ${active.map(({ e }) => {
      const c = e.effect_config
      const cycle = c.repeat_num ? ` · ${+(c.repeat_num).toFixed(2)} cycles` : ''
      return `<details><summary><b>${effectKind(e)}</b> <span class="muted">on ${c.segments || 'all'} · beats ${beatOf(c.start_time)}-${beatOf(c.end_time)}${cycle}</span></summary>
        <pre>${JSON.stringify(e[effectKind(e)], null, 1)}</pre></details>`
    }).join('')}`
}

// --- loop and input ------------------------------------------------------------------------------------------

function frame() {
  const t = nowMs()
  if (!hasAudio() && clockRunning && t >= durationMs) { clockRunning = false; clockAt = durationMs }
  drawSim(t)
  drawTimeline(t)
  drawReadout(t)
  drawInspect(t)
  requestAnimationFrame(frame)
}

function seekFromTimeline(ev: MouseEvent) {
  const rect = timeline.getBoundingClientRect()
  let ms = ((ev.clientX - rect.left) / rect.width) * durationMs
  if (!ev.altKey) ms = timeOfBeat(beatAt(ms))
  seek(ms)
  const y = ev.clientY - rect.top - WAVE_H
  if (y >= 0 && y < 12 * ROW_H) selectedRing = Math.floor(y / ROW_H) + 1
}
let scrubbing = false
timeline.addEventListener('mousedown', ev => { scrubbing = true; seekFromTimeline(ev) })
window.addEventListener('mousemove', ev => { if (scrubbing) seekFromTimeline(ev) })
window.addEventListener('mouseup', () => { scrubbing = false })

sim.addEventListener('click', ev => {
  const rect = sim.getBoundingClientRect()
  const s = Math.min(rect.width, rect.height) / 2
  const x = (ev.clientX - rect.left - rect.width / 2) / s, y = (ev.clientY - rect.top - rect.height / 2) / s
  let best = 0, bestD = 0.3
  for (let r = 1; r <= 12; r++) {
    const d = Math.hypot(RING_CENTER[r].x - x, RING_CENTER[r].y - y)
    if (d < bestD) { bestD = d; best = r }
  }
  selectedRing = best === selectedRing ? 0 : best
})

playBtn.addEventListener('click', togglePlay)
$('rebuild').addEventListener('click', rebuild)
$<HTMLSelectElement>('speed').addEventListener('change', () => {
  audio.playbackRate = speed()
  clockAt = nowMs(); clockStart = performance.now()
})
songSelect.addEventListener('change', () => loadSong(songSelect.value))
$<HTMLInputElement>('goBeat').addEventListener('change', e => seek(timeOfBeat(Number((e.target as HTMLInputElement).value))))

window.addEventListener('keydown', ev => {
  if ((ev.target as HTMLElement).matches('input, select, textarea')) return
  const b = Math.round(beatAt(nowMs()))
  if (ev.code === 'Space') { ev.preventDefault(); togglePlay() }
  else if (ev.key === 'ArrowRight') { ev.preventDefault(); seek(timeOfBeat(b + (ev.shiftKey ? BEATS_PER_BAR : 1))) }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); seek(timeOfBeat(b - (ev.shiftKey ? BEATS_PER_BAR : 1))) }
  else if (ev.key === 'Home') { ev.preventDefault(); seek(0) }
  else if (ev.key === 'r' && !ev.metaKey && !ev.ctrlKey) rebuild()
})

for (const name of songNames) songSelect.add(new Option(name, name))
const initial = new URLSearchParams(location.search).get('song')
songSelect.value = initial && songNames.includes(initial) ? initial : songNames.includes('shemesh') ? 'shemesh' : songNames[0]
loadSong(songSelect.value)
requestAnimationFrame(frame)
