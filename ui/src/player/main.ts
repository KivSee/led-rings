import { effectKind, effectRelTime, missingSegments, PIXELS_PER_RING, renderRing, type Sequence } from './render'
import { hsvRgb, PIXEL_POS, RING_CENTER } from './geometry'
import type { MidiNote } from '../../../shared/midi-notes'

interface Section { name: string; startBeat: number; endBeat: number; fadeInBeats?: number; fadeOutBeats?: number }

// Sequence Player: play a song's audio and show, next to it, what the rings draw — the sequence its .ts file
// sends, rendered here the way the ring controllers render it. Open at /player.html?song=<name> while `yarn ui`
// is running. "Rebuild from .ts" re-runs the song file (src/export-sequence.ts) and reloads its sequence.

interface SongJson {
  song: { name: string; bpm: number; lengthSeconds: number; startOffsetMs?: number; audioFilePath?: string; beatTimestampsMs?: number[] }
}

const BEATS_PER_BAR = 4
const CONTROL_SERVER_URL_STORAGE_KEY = 'kivsee-control-server-url'
const STRIP_STEP_MS = 200
const PEAK_STEP_MS = 20

const songFiles = import.meta.glob<SongJson>(['../../../src/songs/*.json', '!../../../src/songs/*.layers.json'], { import: 'default' })
const songNames = Object.keys(songFiles).map(p => p.replace(/^.*\/(.*)\.json$/, '$1')).sort()

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const audio = $<HTMLAudioElement>('audio')
const songSelect = $<HTMLSelectElement>('song')
const playBtn = $<HTMLButtonElement>('play')
const status = $('status')
const sim = $<HTMLCanvasElement>('sim')
const timeline = $<HTMLCanvasElement>('timeline')
const zoom = $<HTMLCanvasElement>('zoom')
const midiCanvas = $<HTMLCanvasElement>('midiNotes')
const inspect = $('inspect')

let songName = ''
let durationMs = 0
let beats: number[] = []
let peaks: Float32Array = new Float32Array(0)
let peakMax = 0
let sequence: Sequence = {}
let midiNotes: MidiNote[] = []
// The song's named sections, from section() in its .ts.
let sections: Section[] = []
let selectedRing = 0
// Effects switched off in the player (not on the rings), as "ring:index".
const disabled = new Set<string>()
let disableOnAllRings = true
const skipFor = (ring: number) => disabled.size ? (index: number) => disabled.has(`${ring}:${index}`) : undefined
/** An effect's type, segment and timing: the effects that are the same on every ring share it. */
const effectSignature = (ring: number, index: number) => {
  const e = sequence[`ring${ring}`]?.effects[index]
  return e ? JSON.stringify([effectKind(e), e.effect_config]) : ''
}
/** Switch an effect on or off on the selected ring, or on every ring that has the same one. */
function setEffectOn(index: number, on: boolean) {
  const signature = effectSignature(selectedRing, index)
  for (let ring = 1; ring <= 12; ring++) {
    if (!disableOnAllRings && ring !== selectedRing) continue
    sequence[`ring${ring}`]?.effects.forEach((_, i) => {
      if (ring === selectedRing ? i !== index : effectSignature(ring, i) !== signature) return
      if (on) disabled.delete(`${ring}:${i}`)
      else disabled.add(`${ring}:${i}`)
    })
  }
  lastInspectKey = '-'
  buildStrip()
}
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
/** Time of a fractional beat: between detected beats, and past either end at the neighbouring beat's length. */
function timeAtBeat(b: number) {
  const n = beats.length
  if (n < 2) return 0
  const k = Math.max(0, Math.min(n - 2, Math.floor(b)))
  return beats[k] + (b - k) * (beats[k + 1] - beats[k])
}

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
    sections = []
    setMidiNotes([])
    status.textContent = `no sequence yet for ${songName}: press "Rebuild from .ts"`
    return false
  }
  const data = await r.json()
  // { sections, sequence }, or just the sequence from before sections were saved.
  sequence = data.sequence ?? data
  sections = data.sections ?? []
  setMidiNotes(Array.isArray(data.midiNotes) ? data.midiNotes : [])
  // Effect indexes change with a new sequence.
  disabled.clear()
  const n = Object.values(sequence).reduce((s, t) => s + t.effects.length, 0)
  status.textContent = `${n} effects on ${Object.keys(sequence).length} rings`
  const missing = missingSegments(sequence)
  if (missing.length) status.textContent += ` · ⚠ segments not in segments.json: ${missing.join(', ')} (their effects are not shown, and the rings would reject this sequence)`
  buildStrip()
  return true
}

function setMidiNotes(notes: MidiNote[]) {
  midiNotes = notes.filter(n => Number.isFinite(n.startSeconds) && Number.isFinite(n.endSeconds)
    && n.startSeconds >= 0 && n.endSeconds > n.startSeconds
    && Number.isInteger(n.pitch) && n.pitch >= 0 && n.pitch <= 127)
    .sort((a, b) => a.startSeconds - b.startSeconds)
  $('midiNotesStatus').textContent = midiNotes.length
    ? `Melody transcription · ${midiNotes.length} notes${midiNotes.some(n => n.buildRole) ? ' · piano: blue/cyan' : ''}${midiNotes.some(n => n.instrument === 'bass') ? ' · bass: purple' : ''}${midiNotes.some(n => n.accent === 'bar-low') ? ' · bar lows: magenta' : ''}${midiNotes.some(n => n.instrument === 'synth') ? ' · synth quads: violet' : ''}${midiNotes.some(n => n.instrument === 'pad') ? ' · background: gold' : ''} · follows Zoom · click to seek`
    : 'No note transcription for this song'
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
  peakMax = 0
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
    peakMax = peaks.reduce((max, peak) => Math.max(max, peak), 0)
  } catch { /* no waveform, still plays */ }
}

function computePeaks(buf: AudioBuffer): Float32Array {
  const per = Math.max(1, Math.round(buf.sampleRate * PEAK_STEP_MS / 1000))
  const length = Math.min(buf.length, Math.ceil(durationMs * buf.sampleRate / 1000))
  const out = new Float32Array(Math.ceil(length / per))
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < length; i++) { const v = Math.abs(d[i]), k = (i / per) | 0; if (v > out[k]) out[k] = v }
  }
  return out
}

/** Scale to the preview's loudest point and expand quieter audio for readability. */
function waveformHeight(peak: number, availableHeight: number): number {
  return peakMax > 0 ? Math.sqrt(peak / peakMax) * availableHeight : 0
}

const newLeds = () => Array.from({ length: PIXELS_PER_RING }, () => ({ hue: 0, sat: 0, val: 0 }))
const ringLeds = Array.from({ length: 13 }, newLeds)

function fitCanvas(c: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr)
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
  const ctx = c.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: c.clientWidth, h: c.clientHeight }
}

function drawSim(t: number) {
  for (let r = 1; r <= 12; r++) renderRing(sequence[`ring${r}`], t, ringLeds[r], skipFor(r))
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
        renderRing(sequence[`ring${r}`], col * STRIP_STEP_MS, leds, skipFor(r))
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

const SECTION_H = 18, WAVE_H = 46, ROW_H = 7
/** Top of the ring color rows. */
const ROWS_Y = SECTION_H + WAVE_H
const SECTION_COLORS = ['#2b3a5c', '#4a3560', '#2f5446', '#5a4426']
function drawTimeline(t: number) {
  const { ctx, w, h } = fitCanvas(timeline)
  ctx.clearRect(0, 0, w, h)
  const x = (ms: number) => (ms / durationMs) * w
  // Sections, named
  ctx.font = '600 11px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  sections.forEach((sec, k) => {
    const x0 = x(timeAtBeat(sec.startBeat)), x1 = x(timeAtBeat(sec.endBeat))
    const xIn = x(timeAtBeat(sec.startBeat - (sec.fadeInBeats ?? 0))), xOut = x(timeAtBeat(sec.endBeat + (sec.fadeOutBeats ?? 0)))
    ctx.fillStyle = SECTION_COLORS[k % SECTION_COLORS.length]
    ctx.fillRect(x0, 1, Math.max(1, x1 - x0 - 1), SECTION_H - 2)
    // Fades as ramps over the neighbouring sections, half transparent.
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(xIn, SECTION_H - 1); ctx.lineTo(x0, 1); ctx.lineTo(x0, SECTION_H - 1)
    ctx.moveTo(x1, 1); ctx.lineTo(xOut, SECTION_H - 1); ctx.lineTo(x1, SECTION_H - 1)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, 0, x1 - x0, SECTION_H)
    ctx.clip()
    ctx.fillStyle = '#e6e8ee'
    ctx.fillText(sec.name, x0 + 5, SECTION_H / 2)
    ctx.restore()
  })
  ctx.save()
  ctx.translate(0, SECTION_H)
  // Bars
  ctx.fillStyle = '#232837'
  for (let b = 0; b < beats.length; b += BEATS_PER_BAR * 4) ctx.fillRect(x(beats[b]), 0, 1, WAVE_H)
  // Waveform
  if (peaks.length) {
    ctx.fillStyle = '#3a4a66'
    // Use time, not file length: the audio may be much longer than this preview.
    const per = durationMs / PEAK_STEP_MS / w
    for (let px = 0; px < w; px++) {
      let m = 0
      for (let k = Math.floor(px * per); k < Math.ceil((px + 1) * per); k++) m = Math.max(m, peaks[k] ?? 0)
      const ph = waveformHeight(m, WAVE_H - 4)
      ctx.fillRect(px, WAVE_H / 2 - ph / 2, 1, ph)
    }
  }
  ctx.restore()
  // Ring colors, ring 1 on top
  if (strip) {
    const cols = strip.length / 48
    const img = new ImageData(new Uint8ClampedArray(strip), 12, cols)
    const off = new OffscreenCanvas(12, cols)
    off.getContext('2d')!.putImageData(img, 0, 0)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(0, ROWS_Y)
    ctx.transform(0, 1, 1, 0, 0, 0) // swap axes: image x (ring) goes down, image y (time) goes right
    ctx.drawImage(off, 0, 0, 12, cols, 0, 0, 12 * ROW_H, (cols * STRIP_STEP_MS / durationMs) * w)
    ctx.restore()
    if (selectedRing) {
      ctx.strokeStyle = '#4f8cff'
      ctx.strokeRect(0.5, ROWS_Y + (selectedRing - 1) * ROW_H + 0.5, w - 1, ROW_H - 1)
    }
  }
  // Playhead
  ctx.fillStyle = '#ff4d6d'
  ctx.fillRect(x(t) - 1, 0, 2, h)
}

// --- zoomed view: the bars around the playhead ----------------------------------------------------------------

const Z_SECTION_H = 18, Z_LABEL_H = 16
/** First beat shown in the zoomed view: the playhead sits in the middle. */
const zoomStartBeat = (t: number) => beatAt(t) - (Number($<HTMLSelectElement>('zoomBars').value) * BEATS_PER_BAR) / 2

function drawZoom(t: number) {
  const { ctx, w, h } = fitCanvas(zoom)
  ctx.clearRect(0, 0, w, h)
  const span = Number($<HTMLSelectElement>('zoomBars').value) * BEATS_PER_BAR
  const b0 = zoomStartBeat(t)
  const x = (beat: number) => ((beat - b0) / span) * w
  // Sections, with their fades
  ctx.font = '600 11px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  sections.forEach((sec, k) => {
    const x0 = x(sec.startBeat), x1 = x(sec.endBeat)
    const xIn = x(sec.startBeat - (sec.fadeInBeats ?? 0)), xOut = x(sec.endBeat + (sec.fadeOutBeats ?? 0))
    if (xOut < 0 || xIn > w) return
    ctx.fillStyle = SECTION_COLORS[k % SECTION_COLORS.length]
    ctx.fillRect(x0, 1, x1 - x0 - 1, Z_SECTION_H - 2)
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(xIn, Z_SECTION_H - 1); ctx.lineTo(x0, 1); ctx.lineTo(x0, Z_SECTION_H - 1)
    ctx.moveTo(x1, 1); ctx.lineTo(xOut, Z_SECTION_H - 1); ctx.lineTo(x1, Z_SECTION_H - 1)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = '#e6e8ee'
    // Keep the name in view while its section is.
    ctx.fillText(sec.name, Math.max(x0, 0) + 5, Z_SECTION_H / 2)
  })
  const top = Z_SECTION_H + Z_LABEL_H, waveH = h - top
  // Waveform
  if (peaks.length) {
    ctx.fillStyle = '#3a4a66'
    for (let px = 0; px < w; px++) {
      const ms0 = timeAtBeat(b0 + (px / w) * span), ms1 = timeAtBeat(b0 + ((px + 1) / w) * span)
      let m = 0
      for (let k = Math.floor(ms0 / PEAK_STEP_MS); k <= Math.floor(ms1 / PEAK_STEP_MS); k++) m = Math.max(m, peaks[k] ?? 0)
      const ph = waveformHeight(m, waveH - 6)
      ctx.fillRect(px, top + waveH / 2 - ph / 2, 1, ph)
    }
  }
  // Beats and bars, numbered
  ctx.font = '11px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  const labelEvery = span > 32 ? 2 : 1 // beat numbers on every beat, or every other one when crowded
  for (let beat = Math.max(0, Math.ceil(b0)); beat <= b0 + span && beat < beats.length; beat++) {
    const bx = Math.round(x(beat)) + 0.5
    const isBar = beat % BEATS_PER_BAR === 0
    ctx.fillStyle = isBar ? '#ffb020' : '#4a5368'
    ctx.fillRect(bx - 0.5, top, isBar ? 2 : 1, waveH)
    if (isBar) {
      ctx.fillStyle = '#ffb020'
      ctx.fillText(`bar ${beat / BEATS_PER_BAR + 1}`, bx + 4, Z_SECTION_H + Z_LABEL_H / 2)
    }
    if (beat % labelEvery === 0) {
      ctx.fillStyle = isBar ? '#e6e8ee' : '#8a92a3'
      ctx.fillText(String(beat), bx + 3, h - 8)
    }
  }
  // Playhead
  ctx.fillStyle = '#ff4d6d'
  ctx.fillRect(x(beatAt(t)) - 1, 0, 2, h)
}

zoom.addEventListener('click', ev => {
  const rect = zoom.getBoundingClientRect()
  const span = Number($<HTMLSelectElement>('zoomBars').value) * BEATS_PER_BAR
  const beat = zoomStartBeat(nowMs()) + ((ev.clientX - rect.left) / rect.width) * span
  seek(ev.altKey ? timeAtBeat(beat) : timeOfBeat(beat))
})

// --- MIDI piano roll: the same time window and playhead as the zoomed waveform -------------------------------

const pitchName = (pitch: number) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][pitch % 12]}${Math.floor(pitch / 12) - 1}`

function drawMidiNotes(t: number) {
  const { ctx, w, h } = fitCanvas(midiCanvas)
  ctx.clearRect(0, 0, w, h)
  if (!midiNotes.length) {
    ctx.fillStyle = '#8a92a3'
    ctx.font = '13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Notes will appear here when the song includes a melody transcription.', w / 2, h / 2)
    ctx.textAlign = 'left'
    return
  }

  const span = Number($<HTMLSelectElement>('zoomBars').value) * BEATS_PER_BAR
  const b0 = zoomStartBeat(t)
  const x = (beat: number) => ((beat - b0) / span) * w
  const low = Math.max(0, Math.min(...midiNotes.map(n => n.pitch)) - 1)
  const high = Math.min(127, Math.max(...midiNotes.map(n => n.pitch)) + 1)
  const top = 22, labelWidth = 44, rowH = (h - top) / (high - low + 1)
  const y = (pitch: number) => top + (high - pitch) * rowH

  // Semitone lanes and pitch labels, including the MIDI octave number.
  ctx.font = '10px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  for (let pitch = low; pitch <= high; pitch++) {
    ctx.fillStyle = [1, 3, 6, 8, 10].includes(pitch % 12) ? '#11151d' : '#1b212c'
    ctx.fillRect(0, y(pitch), w, rowH)
    ctx.fillStyle = '#2a303c'
    ctx.fillRect(0, y(pitch) + rowH - 1, w, 1)
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(labelWidth, 0, Math.max(0, w - labelWidth), h)
  ctx.clip()
  for (let beat = Math.max(0, Math.ceil(b0)); beat <= b0 + span && beat < beats.length; beat++) {
    const bx = Math.round(x(beat)) + 0.5
    const bar = beat % BEATS_PER_BAR === 0
    ctx.fillStyle = bar ? '#46516a' : '#282f3d'
    ctx.fillRect(bx, top, 1, h - top)
    if (bar) {
      ctx.fillStyle = '#ffb020'
      ctx.fillText(`bar ${beat / BEATS_PER_BAR + 1}`, bx + 4, top / 2)
    }
  }
  for (const note of midiNotes) {
    const start = x(beatAt(note.startSeconds * 1000))
    const end = x(beatAt(note.endSeconds * 1000))
    if (end < labelWidth || start > w) continue
    const active = note.startSeconds * 1000 <= t && t < note.endSeconds * 1000
    ctx.fillStyle = note.instrument === 'guitar' ? (active ? '#ffd09a' : '#ff963e')
      : note.instrument === 'bass' ? (active ? '#ce91ff' : '#994bd1')
      : note.instrument === 'pad' ? (active ? '#ffd12a' : '#c99412')
      : note.instrument === 'synth' ? (active ? '#d990ff' : '#ae63ff')
      : note.accent === 'bar-low' ? (active ? '#ff8fd8' : '#ed43b8')
      : note.buildRole === 'low' ? (active ? '#76acff' : '#2f82ff')
      : note.buildRole === 'high' ? (active ? '#00f0ff' : '#00c8ed')
      : (active ? '#8affd5' : '#628fff')
    ctx.fillRect(start, y(note.pitch) + 2, Math.max(2, end - start - 1), Math.max(2, rowH - 4))
    if (end - start > 30 && rowH >= 12) {
      ctx.fillStyle = '#101a2f'
      ctx.fillText(pitchName(note.pitch), start + 4, y(note.pitch) + rowH / 2)
    }
  }
  ctx.fillStyle = '#ff4d6d'
  ctx.fillRect(x(beatAt(t)) - 1, 0, 2, h)
  ctx.restore()

  // Labels overlay the first few pixels; the time scale still matches the waveform exactly.
  ctx.fillStyle = '#161a22'
  ctx.fillRect(0, 0, labelWidth, h)
  ctx.fillStyle = '#8a92a3'
  for (let pitch = low; pitch <= high; pitch++) ctx.fillText(pitchName(pitch), 8, y(pitch) + rowH / 2)
  ctx.textBaseline = 'alphabetic'
}

midiCanvas.addEventListener('click', ev => {
  if (!midiNotes.length || ev.clientX - midiCanvas.getBoundingClientRect().left < 44) return
  const rect = midiCanvas.getBoundingClientRect()
  const span = Number($<HTMLSelectElement>('zoomBars').value) * BEATS_PER_BAR
  const beat = zoomStartBeat(nowMs()) + ((ev.clientX - rect.left) / rect.width) * span
  seek(ev.altKey ? timeAtBeat(beat) : timeOfBeat(beat))
})

// --- readouts and the effects of the selected ring -------------------------------------------------------------

function drawReadout(t: number) {
  $('time').textContent = fmt(t)
  const b = beatAt(t)
  const whole = Math.floor(b)
  $('barbeat').textContent = b < 0 ? 'before beat 0' : `bar ${Math.floor(whole / BEATS_PER_BAR) + 1} · beat ${(whole % BEATS_PER_BAR) + 1}`
  $('beatnum').textContent = `beat ${b.toFixed(1)}`
  // The section playing, and any section fading in or out over it.
  const names = sections.flatMap(s =>
    b >= s.startBeat && b < s.endBeat ? [s.name]
      : b >= s.startBeat - (s.fadeInBeats ?? 0) && b < s.startBeat ? [`${s.name} (fading in)`]
        : b >= s.endBeat && b < s.endBeat + (s.fadeOutBeats ?? 0) ? [`${s.name} (fading out)`] : [])
  $('section').textContent = names.join(' · ')
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
  // Effects whose beats cover the playhead: rendering now, or waiting for their part of the cycle.
  const shown = (seq?.effects ?? []).map((e, n) => ({ e, n, on: effectRelTime(e.effect_config, t) !== undefined }))
    .filter(({ e }) => t >= e.effect_config.start_time && t < e.effect_config.end_time)
  const key = `${selectedRing}|${disabled.size}|${shown.map(a => `${a.n}${a.on ? '' : 'w'}`).join(',')}`
  if (key === lastInspectKey) return
  lastInspectKey = key
  // Keep effects the user opened open across redraws.
  const open = new Set([...inspect.querySelectorAll<HTMLDetailsElement>('details[open]')].map(d => d.dataset.n))
  const beatOf = (ms: number) => { const v = beatAt(ms); return Math.abs(v - Math.round(v)) < 0.02 ? String(Math.round(v)) : String(+v.toFixed(2)) }
  const active = shown.filter(a => a.on).length
  inspect.innerHTML = `
    <div class="inspect-head">Ring ${selectedRing} · ${seq?.effects.length ?? 0} effects in the song · ${active} active effect${active === 1 ? '' : 's'}${shown.length > active ? `, ${shown.length - active} waiting for their part of the cycle` : ''} <span class="muted">(in render order)</span></div>
    <div class="inspect-tools muted">Untick an effect to see the simulation without it, on
      <label><input type="radio" name="disableScope" value="all"${disableOnAllRings ? ' checked' : ''}> every ring that has it</label>
      <label><input type="radio" name="disableScope" value="one"${disableOnAllRings ? '' : ' checked'}> this ring only</label>
      ${disabled.size ? `<button id="enableAll">Show all ${disabled.size} hidden</button>` : ''}</div>
    ${shown.map(({ e, n, on }) => {
      const c = e.effect_config
      let cycle = ''
      if (c.repeat_num) {
        const cycleBeats = +((beatAt(c.end_time) - beatAt(c.start_time)) / c.repeat_num).toFixed(2)
        const part = (c.repeat_start ?? 0) > 0 || (c.repeat_end ?? 1) < 1
          ? ` · beats ${+((c.repeat_start ?? 0) * cycleBeats).toFixed(2)}-${+((c.repeat_end ?? 1) * cycleBeats).toFixed(2)} of each`
          : ' · every'
        cycle = `${part} ${cycleBeats}-beat cycle`
      }
      const off = disabled.has(`${selectedRing}:${n}`)
      const classes = [on ? '' : 'waiting', off ? 'off' : ''].filter(Boolean).join(' ')
      return `<details data-n="${n}"${classes ? ` class="${classes}"` : ''}${open.has(String(n)) ? ' open' : ''}><summary><input type="checkbox" class="effect-on" data-n="${n}"${off ? '' : ' checked'} title="Show this effect in the simulation"> <b>${effectKind(e)}</b>${on ? '' : ' <span class="tag">waiting</span>'} <span class="muted">on ${c.segments || 'all'} · beats ${beatOf(c.start_time)}-${beatOf(c.end_time)}${cycle}</span></summary>
        <pre>${JSON.stringify(e[effectKind(e)], null, 1)}</pre></details>`
    }).join('')}`
}

inspect.addEventListener('click', ev => {
  const target = ev.target as HTMLElement
  // A checkbox inside a summary must not open or close its details.
  if (target.matches('input.effect-on')) ev.stopPropagation()
  if (target.id === 'enableAll') { disabled.clear(); lastInspectKey = '-'; buildStrip() }
})
inspect.addEventListener('change', ev => {
  const target = ev.target as HTMLInputElement
  if (target.matches('input.effect-on')) setEffectOn(Number(target.dataset.n), target.checked)
  if (target.name === 'disableScope') disableOnAllRings = target.value === 'all'
})

// --- loop and input ------------------------------------------------------------------------------------------

function frame() {
  const t = nowMs()
  if (!hasAudio() && clockRunning && t >= durationMs) { clockRunning = false; clockAt = durationMs }
  drawSim(t)
  drawTimeline(t)
  drawZoom(t)
  drawMidiNotes(t)
  drawReadout(t)
  drawInspect(t)
  requestAnimationFrame(frame)
}

function seekFromTimeline(ev: PointerEvent) {
  const rect = timeline.getBoundingClientRect()
  let ms = ((ev.clientX - rect.left - timeline.clientLeft) / timeline.clientWidth) * durationMs
  if (ev.shiftKey) ms = timeOfBeat(beatAt(ms))
  seek(ms)
  const y = ev.clientY - rect.top - ROWS_Y
  if (y >= 0 && y < 12 * ROW_H) selectedRing = Math.floor(y / ROW_H) + 1
}
timeline.addEventListener('pointerdown', ev => {
  if (ev.button !== 0 || !ev.isPrimary) return
  ev.preventDefault()
  timeline.setPointerCapture(ev.pointerId)
  seekFromTimeline(ev)
})
timeline.addEventListener('pointermove', ev => {
  if (timeline.hasPointerCapture(ev.pointerId)) seekFromTimeline(ev)
})
timeline.addEventListener('pointerup', ev => {
  if (!timeline.hasPointerCapture(ev.pointerId)) return
  seekFromTimeline(ev)
  timeline.releasePointerCapture(ev.pointerId)
})
timeline.addEventListener('pointercancel', ev => {
  if (timeline.hasPointerCapture(ev.pointerId)) timeline.releasePointerCapture(ev.pointerId)
})

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
