import { PIXELS_PER_RING, renderRing, type HSV, type Sequence } from '../player/render'
import { hsvRgb, PIXEL_POS } from '../player/geometry'
import { BAR, compose, mixPlacements, PALETTES, TEXTURES, TRANSITIONS, type LabContext, type SectionSpec, type Shape, type Texture, type Transition } from './options'

// Section Lab: loop one section of a song and compare option cards side by side, each drawing what the rings
// would show, and try a mix of them taking turns with transitions.
// lab.html?song=inequal&from=216&to=280&name=starry%20middle

interface SongJson {
  song: { name: string; bpm: number; startOffsetMs?: number; audioFilePath?: string }
  timeframes?: { label?: string; startTime: number; endTime: number }[]
}

const BEATS_PER_BAR = BAR
const CONTROL_SERVER_URL_STORAGE_KEY = 'kivsee-control-server-url'
const songFiles = import.meta.glob<SongJson>(['../../../src/songs/*.json', '!../../../src/songs/*.layers.json'], { import: 'default' })

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const params = new URLSearchParams(location.search)
const songName = params.get('song') ?? 'inequal'
// The section comes from the song's marker timeframe with this name (so a moved marker or an old link still
// lands on the right beats); from/to in the URL are only used when the song has no such marker.
const sectionName = params.get('name') ?? 'starry middle'
let fromBeat = Number(params.get('from') ?? 216)
let toBeat = Number(params.get('to') ?? 280)
let storeKey = ''

const audio = $<HTMLAudioElement>('audio')
let beatMs = 400, offsetMs = 0

// --- state (kept in localStorage) ----------------------------------------------------------------------------------

let paletteId = 'rebuild'
const mappingFor: Record<string, string> = {}
let picks: string[] = []
let shape: Shape = { buildUp: true, fadeOut: true, peak: true, peakOffset: 0 }
let mix: { id: string; mapping: string }[] = []
let mixBars = 2
let mixTransition: Transition = 'streak'
let shuffleColors = true

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(storeKey) ?? '{}')
    if (PALETTES.some(p => p.id === s.paletteId)) paletteId = s.paletteId
    Object.assign(mappingFor, s.mappingFor ?? {})
    if (Array.isArray(s.picks)) picks = s.picks
    if (s.shape) shape = { ...shape, ...s.shape }
    if (Array.isArray(s.mix)) mix = s.mix.filter((m: { id: string }) => TEXTURES.some(t => t.id === m.id))
    if ([1, 2, 3].includes(s.mixBars)) mixBars = s.mixBars
    if (TRANSITIONS.some(t => t.id === s.mixTransition)) mixTransition = s.mixTransition
    if (typeof s.shuffleColors === 'boolean') shuffleColors = s.shuffleColors
  } catch { /* first visit or blocked storage */ }
}
const save = () => {
  try { localStorage.setItem(storeKey, JSON.stringify({ paletteId, mappingFor, picks, shape, mix, mixBars, mixTransition, shuffleColors })) } catch { /* ignore */ }
}

// --- sequences -----------------------------------------------------------------------------------------------------

const palette = () => PALETTES.find(p => p.id === paletteId)!
const textureById = (id: string) => TEXTURES.find(t => t.id === id)!
const mappingOf = (t: Texture) => mappingFor[t.id] ?? t.mappings[0]
const describe = (t: Texture, mapping = mappingOf(t)) => `${t.name} · ${mapping}`
const pickId = (t: Texture) => `${describe(t)} · ${palette().name}`
const ctx = (): LabContext => ({ fromBeat, toBeat, beatMs, offsetMs, palette: palette() })
const shapeKey = () => `${+shape.buildUp}${+shape.fadeOut}${+(shape.peak !== false)}${shape.peakOffset ?? 0}`

const cache = new Map<string, Sequence>()
function cardSequence(t: Texture): Sequence {
  const key = `card|${t.id}|${mappingOf(t)}|${paletteId}|${shapeKey()}`
  let seq = cache.get(key)
  if (!seq) {
    seq = compose(ctx(), [{ texture: t, mapping: mappingOf(t), from: fromBeat, to: toBeat, amount: () => 1 }], shape)
    cache.set(key, seq)
  }
  return seq
}
function mixSequence(): Sequence | null {
  if (!mix.length) return null
  const key = `mix|${JSON.stringify(mix)}|${mixBars}|${mixTransition}|${paletteId}|${shapeKey()}|${shuffleColors}`
  let seq = cache.get(key)
  if (!seq) {
    const items = mix.map(m => ({ texture: textureById(m.id), mapping: m.mapping }))
    seq = compose(ctx(), mixPlacements(ctx(), items, mixBars, mixTransition), shape, shuffleColors ? mixBars * BAR : 0)
    cache.set(key, seq)
  }
  return seq
}

// --- drawing -------------------------------------------------------------------------------------------------------

const leds: HSV[][] = Array.from({ length: 13 }, () => Array.from({ length: PIXELS_PER_RING }, () => ({ hue: 0, sat: 0, val: 0 })))

function drawRings(canvas: HTMLCanvasElement, seq: Sequence | null, t: number) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (!w || !h) return
  if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr) }
  const g = canvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  if (!seq) return
  for (let r = 1; r <= 12; r++) renderRing(seq[`ring${r}`], t, leds[r])
  const s = Math.min(w, h) / 2, dot = Math.max(1, s / 95)
  for (const { r, index, x, y } of PIXEL_POS) {
    const px = leds[r][index]
    if (px.val <= 0.004) g.fillStyle = '#12151c'
    else { const [R, G, B] = hsvRgb(px); g.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})` }
    g.beginPath()
    g.arc(w / 2 + x * s, h / 2 + y * s, dot, 0, Math.PI * 2)
    g.fill()
  }
}

// --- page ----------------------------------------------------------------------------------------------------------

const cards: { texture: Texture; canvas: HTMLCanvasElement; el: HTMLElement; visible: boolean }[] = []
let bigTexture: Texture | null = null

const swatches = (p = palette()) =>
  `<span class="sw">${p.colors.map(c => { const [r, g, b] = hsvRgb(c); return `<span style="background:rgb(${r | 0},${g | 0},${b | 0})"></span>` }).join('')}</span>`

function renderPalettes() {
  $('palettes').innerHTML = ''
  for (const p of PALETTES) {
    const b = document.createElement('button')
    b.className = 'pal' + (p.id === paletteId ? ' sel' : '')
    b.innerHTML = `${swatches(p)} ${p.name}`
    b.onclick = () => { paletteId = p.id; save(); renderPalettes(); refresh() }
    $('palettes').append(b)
  }
  $('paletteSource').textContent = `${palette().name}: ${palette().source}`
}

function renderCards() {
  const families = [...new Set(TEXTURES.map(t => t.family))]
  const visibility = new IntersectionObserver(entries => {
    for (const e of entries) { const c = cards.find(x => x.canvas === e.target); if (c) c.visible = e.isIntersecting }
  })
  for (const family of families) {
    const section = document.createElement('div')
    section.className = 'family'
    section.innerHTML = `<h2>${family}</h2><div class="grid"></div>`
    $('families').append(section)
    for (const texture of TEXTURES.filter(t => t.family === family)) {
      const el = document.createElement('div')
      el.className = 'card'
      el.innerHTML = `
        <div class="top"><h2>${texture.name}</h2><span><button class="add" title="Add to the mix">＋ mix</button><button class="star" title="Add to picks">★</button></span></div>
        <canvas></canvas>
        <p>${texture.description}</p>
        <div class="meta"><span class="muted">from ${texture.inspiration}</span>
          <label class="muted">mapping <select>${texture.mappings.map(m => `<option>${m}</option>`).join('')}</select></label></div>`
      const canvas = el.querySelector('canvas')!
      const select = el.querySelector('select')!
      select.value = mappingOf(texture)
      select.onchange = () => { mappingFor[texture.id] = select.value; save(); refresh() }
      el.querySelector<HTMLButtonElement>('.star')!.onclick = () => {
        const id = pickId(texture)
        picks = picks.includes(id) ? picks.filter(p => p !== id) : [...picks, id]
        save(); refresh()
      }
      el.querySelector<HTMLButtonElement>('.add')!.onclick = () => { mix.push({ id: texture.id, mapping: mappingOf(texture) }); save(); refresh() }
      canvas.onclick = () => { bigTexture = texture; $('big').hidden = false; $('bigCap').textContent = pickId(texture) }
      section.querySelector('.grid')!.append(el)
      const card = { texture, canvas, el, visible: true }
      cards.push(card)
      visibility.observe(canvas)
    }
  }
}

function renderMix() {
  $('mixList').innerHTML = mix.map((m, n) => `<li data-n="${n}">${describe(textureById(m.id), m.mapping)}
    <button data-act="up" title="Earlier">↑</button><button data-act="down" title="Later">↓</button><button data-act="del" title="Remove">✕</button></li>`).join('')
    || '<li class="muted">empty — press ＋ mix on a card</li>'
  $('mixTransitionHint').textContent = TRANSITIONS.find(t => t.id === mixTransition)!.description
}
$('mixList').onclick = ev => {
  const btn = (ev.target as HTMLElement).closest('button')
  const li = btn?.closest('li')
  if (!btn || !li) return
  const n = Number(li.dataset.n), act = btn.dataset.act
  if (act === 'del') mix.splice(n, 1)
  if (act === 'up' && n > 0) [mix[n - 1], mix[n]] = [mix[n], mix[n - 1]]
  if (act === 'down' && n < mix.length - 1) [mix[n + 1], mix[n]] = [mix[n], mix[n + 1]]
  save(); refresh()
}
$('mixClear').onclick = () => { mix = []; save(); refresh() }
$<HTMLInputElement>('mixShuffle').onchange = e => { shuffleColors = (e.target as HTMLInputElement).checked; save(); refresh() }
/** The section's settings exactly as a song stores them on its marker timeframe (labSection). */
const sectionSpec = (): SectionSpec => ({ palette: paletteId, mix: mix.map(m => ({ texture: m.id, mapping: m.mapping })), barsEach: mixBars, transition: mixTransition, shape: { ...shape }, shuffleColors })
$('copySpec').onclick = async () => {
  const text = `Section Lab spec for ${songName} · ${sectionName} (${fromBeat}–${toBeat}):
${JSON.stringify(sectionSpec())}`
  try { await navigator.clipboard.writeText(text); $('copiedSpec').textContent = 'copied — paste it to Claude' } catch { $('copiedSpec').textContent = text }
}
const bars = $<HTMLSelectElement>('mixBars'), trans = $<HTMLSelectElement>('mixTransition')
const peakSel = $<HTMLSelectElement>('shapePeakOffset')
peakSel.onchange = () => { shape = { ...shape, peakOffset: Number(peakSel.value) }; save(); refresh() }
trans.innerHTML = TRANSITIONS.map(t => `<option value="${t.id}">${t.name}</option>`).join('')
bars.onchange = () => { mixBars = Number(bars.value); save(); refresh() }
trans.onchange = () => { mixTransition = trans.value as Transition; save(); refresh() }
for (const [id, k] of [['shapeBuildUp', 'buildUp'], ['shapeFadeOut', 'fadeOut'], ['shapePeak', 'peak']] as const) {
  const box = $<HTMLInputElement>(id)
  box.onchange = () => { shape = { ...shape, [k]: box.checked }; save(); refresh() }
}

function refresh() {
  for (const { texture, el } of cards) el.classList.toggle('starred', picks.includes(pickId(texture)))
  const lines = [...picks]
  if (mix.length) lines.push(`MIX (${palette().name}, every ${mixBars} bars, ${TRANSITIONS.find(t => t.id === mixTransition)!.name.toLowerCase()}): ` +
    mix.map(m => describe(textureById(m.id), m.mapping)).join(' → '))
  $('picks').innerHTML = lines.map(p => `<li>${p}</li>`).join('') || '<li class="muted">none yet</li>'
  if (bigTexture) $('bigCap').textContent = pickId(bigTexture)
  bars.value = String(mixBars)
  $<HTMLInputElement>('mixShuffle').checked = shuffleColors
  trans.value = mixTransition
  $<HTMLInputElement>('shapeBuildUp').checked = shape.buildUp
  $<HTMLInputElement>('shapeFadeOut').checked = shape.fadeOut
  $<HTMLInputElement>('shapePeak').checked = shape.peak !== false
  peakSel.value = String(shape.peakOffset ?? 0)
  renderMix()
}

$('big').onclick = () => { $('big').hidden = true; bigTexture = null }
$('copyPicks').onclick = async () => {
  const text = `${songName} · ${sectionName} (${fromBeat}–${toBeat})\n` + [...$('picks').querySelectorAll('li')].map((li, i) => `${i + 1}. ${li.textContent}`).join('\n')
  try { await navigator.clipboard.writeText(text); $('copied').textContent = 'copied' } catch { $('copied').textContent = text }
}

// --- transport: the section loops --------------------------------------------------------------------------------

let hasAudio = false
let clockStart = 0 // without audio, a free-running clock loops the section
let pausedAt = 0
const startMs = () => offsetMs + fromBeat * beatMs
const endMs = () => offsetMs + toBeat * beatMs
const playing = () => (hasAudio ? !audio.paused : clockStart > 0)

function now(): number {
  if (hasAudio) {
    let t = audio.currentTime * 1000
    if (!audio.paused && (t >= endMs() || t < startMs() - 50)) { audio.currentTime = startMs() / 1000; t = startMs() }
    return audio.paused ? pausedAt : t
  }
  if (!clockStart) return pausedAt
  return startMs() + ((performance.now() - clockStart) % (endMs() - startMs()))
}

$('play').onclick = async () => {
  if (playing()) {
    pausedAt = now()
    if (hasAudio) audio.pause(); else clockStart = 0
  } else if (hasAudio) {
    if (audio.currentTime * 1000 < startMs() || audio.currentTime * 1000 >= endMs()) audio.currentTime = startMs() / 1000
    await audio.play()
  } else {
    clockStart = performance.now() - (pausedAt - startMs())
  }
  $('play').textContent = playing() ? '⏸ Pause' : '▶ Play'
}
$('restart').onclick = () => {
  pausedAt = startMs()
  if (hasAudio) audio.currentTime = startMs() / 1000
  else if (clockStart) clockStart = performance.now()
}

function frame() {
  const t = now()
  const beatInSection = (t - startMs()) / beatMs
  $('bar').textContent = String(Math.floor(beatInSection / BEATS_PER_BAR) + 1)
  const beat = Math.floor(beatInSection) % BEATS_PER_BAR
  $('beats').querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === beat))
  for (const { texture, canvas, visible } of cards) if (visible) drawRings(canvas, cardSequence(texture), t)
  if (bigTexture) drawRings($<HTMLCanvasElement>('bigCanvas'), cardSequence(bigTexture), t)
  drawRings($<HTMLCanvasElement>('mixCanvas'), mixSequence(), t)
  if (mix.length) {
    const n = Math.floor(beatInSection / (mixBars * BEATS_PER_BAR))
    const cur = mix[n % mix.length]
    $('mixNow').textContent = `now: ${describe(textureById(cur.id), cur.mapping)}`
    $('mixList').querySelectorAll('li').forEach((li, k) => li.classList.toggle('now', k === n % mix.length))
  } else $('mixNow').textContent = ''
  requestAnimationFrame(frame)
}

async function audioUrl(file: string): Promise<string | null> {
  const local = `/${encodeURIComponent(file)}`
  try {
    const r = await fetch(local, { method: 'HEAD' })
    if (r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')) return local
  } catch { /* fall through */ }
  const api = localStorage.getItem(CONTROL_SERVER_URL_STORAGE_KEY) || 'http://localhost:3080'
  const remote = `${api}/api/audio?path=${encodeURIComponent(file)}`
  try { if ((await fetch(remote, { method: 'HEAD' })).ok) return remote } catch { /* not available */ }
  return null
}

async function init() {
  const file = songFiles[`../../../src/songs/${songName}.json`]
  if (!file) { $('songName').innerHTML = `<span class="warn">no song "${songName}"</span>`; return }
  const json = await file()
  const s = json.song
  const marker = json.timeframes?.find(t => (t.label ?? '').trim().toLowerCase() === sectionName.trim().toLowerCase())
  if (marker) { fromBeat = marker.startTime; toBeat = marker.endTime }
  storeKey = `section-lab:v3:${songName}:${fromBeat}-${toBeat}`
  history.replaceState(null, '', `?song=${encodeURIComponent(songName)}&name=${encodeURIComponent(sectionName)}${marker ? '' : `&from=${fromBeat}&to=${toBeat}`}`)
  beatMs = 60000 / s.bpm
  offsetMs = s.startOffsetMs ?? 0
  load()
  pausedAt = startMs()
  $('songName').textContent = s.name
  $('sectionName').textContent = sectionName
  const nBars = (toBeat - fromBeat) / BEATS_PER_BAR
  $('sectionRange').textContent = `beats ${fromBeat}–${toBeat} · ${nBars} bars`
  $('barOf').textContent = ` / ${nBars}`
  peakSel.innerHTML = [0, 1, 2, 3].map(o => { const first = fromBeat + (o === 0 ? BEATS_PER_BAR : o); return `<option value="${o}">${first}, ${first + BEATS_PER_BAR}, …</option>` }).join('')
  peakSel.value = String(shape.peakOffset ?? 0)
  const url = await audioUrl(s.audioFilePath ?? `${songName}.wav`)
  if (url) { audio.src = url; hasAudio = true; $('audioState').textContent = 'loops the section with the music' }
  else $('audioState').innerHTML = '<span class="warn">audio not found — plays without music</span>'
  renderPalettes()
  renderCards()
  refresh()
  requestAnimationFrame(frame)
}

init()
