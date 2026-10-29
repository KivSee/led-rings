import { PIXELS_PER_RING, renderRing, type HSV, type Sequence } from '../player/render'

// Background Gallery: every option of a set looping on its own card, drawn the way the ring controllers draw it.
// ?set=1 (the default) is src/background-options.ts (built into public/background-options.json), ?set=<n> the
// background set src/background<n>-options.ts (public/background<n>-options.json), and ?set=<song> a song's options
// (src/songs/<song>-options.ts, public/<song>-options.json), which come with the song's audio: then every card plays in
// time with it. Starred options are saved for Claude through the dev server (POST /api/background-picks?set=, to
// src/background-picks.json, src/background<n>-picks.json or src/songs/<song>-picks.json).

const SET = new URLSearchParams(location.search).get('set') ?? '1'
const IS_SONG = !/^\d+$/.test(SET)
const OPTIONS_FILE = SET === '1' ? '/background-options.json' : IS_SONG ? `/${SET}-options.json` : `/background${SET}-options.json`

interface Option { name: string; category: string; tags?: string[]; desc: string; sequence: Sequence }
// from / to (seconds): only that part of the song, looped (its options are in song time).
interface Data { loopSeconds: number; audio?: string; from?: number; to?: number; options: Option[] }

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const grid = $('grid'), filters = $('filters'), picksEl = $('picks'), status = $('status'), clock = $('clock')
const playBtn = $<HTMLButtonElement>('play'), sizeSelect = $<HTMLSelectElement>('size')
const focus = $('focus'), focusCanvas = $<HTMLCanvasElement>('focusCanvas')

const KEY = `background-gallery:${SET}:`
const load = <T>(what: string, fallback: T): T => {
  try { const s = localStorage.getItem(KEY + what); return s ? (JSON.parse(s) as T) : fallback } catch { return fallback }
}
const save = (what: string, value: unknown) => { try { localStorage.setItem(KEY + what, JSON.stringify(value)) } catch { /* not saved */ } }

let data: Data = { loopSeconds: 20, options: [] }
let picked = new Set<number>(load<number[]>('picked', []))
let filter = load<string>('filter', 'All')
let focused = -1

// --- time: one clock for every card, looping; the song's audio when the set has one ----------------------------

let running = !IS_SONG, clockAt = 0, clockStart = performance.now()
const audio = new Audio()
audio.loop = true
const nowMs = () => data.audio
  ? audio.currentTime * 1000
  : (running ? clockAt + performance.now() - clockStart : clockAt) % (data.loopSeconds * 1000)
const showPlay = () => { playBtn.textContent = running ? '❚❚ Pause' : '▶ Play' }
function togglePlay() {
  if (data.audio) {
    if (audio.paused) audio.play(); else audio.pause()
    running = !audio.paused
  } else {
    if (running) clockAt = nowMs(); else clockStart = performance.now()
    running = !running
  }
  showPlay()
}
audio.addEventListener('play', () => { running = true; showPlay() })
audio.addEventListener('pause', () => { running = false; showPlay() })

// --- drawing (the same geometry and colors as the Sequence Player) ---------------------------------------------

function hsvRgb({ hue, sat, val }: HSV): [number, number, number] {
  const s = Math.pow(Math.min(1, Math.max(0, sat)), 4), v = Math.min(1, Math.max(0, val))
  const h = (((hue % 1) + 1) % 1) * 6, i = Math.floor(h), f = h - i
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f))
  const [r, gr, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]
  return [r * 255, gr * 255, b * 255]
}
const D0_OFFSET = 9
const PIXEL_POS: { r: number; index: number; x: number; y: number }[] = []
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
        PIXEL_POS.push({ r, index: i * 12 + p, x: x / 640, y: y / 640 })
      }
    }
  }
}
const leds = Array.from({ length: 13 }, () => Array.from({ length: PIXELS_PER_RING }, () => ({ hue: 0, sat: 0, val: 0 })))

function draw(canvas: HTMLCanvasElement, s: Sequence, t: number) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  if (!w) return
  const px = Math.round(w * dpr)
  if (canvas.width !== px || canvas.height !== px) { canvas.width = px; canvas.height = px }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, w)
  for (let r = 1; r <= 12; r++) renderRing(s[`ring${r}`], t, leds[r])
  const half = w / 2, big = w > 400
  const dot = Math.max(1, half / 95)
  for (const { r, index, x, y } of PIXEL_POS) {
    const p = leds[r][index]
    if (p.val <= 0.004) ctx.fillStyle = '#151820'
    else { const [R, G, B] = hsvRgb(p); ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})` }
    const cx = half + x * half, cy = half + y * half
    if (big) { ctx.beginPath(); ctx.arc(cx, cy, dot, 0, Math.PI * 2); ctx.fill() }
    else ctx.fillRect(cx - dot, cy - dot, dot * 2, dot * 2)
  }
}

// --- the cards -------------------------------------------------------------------------------------------------

const cards: { canvas: HTMLCanvasElement; el: HTMLElement }[] = []
// Only the cards on screen are drawn.
const visible = new Set<number>()
const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    const i = Number((e.target as HTMLElement).dataset.i)
    if (e.isIntersecting) visible.add(i); else visible.delete(i)
  }
}, { rootMargin: '200px' })

function buildCards() {
  grid.innerHTML = ''
  cards.length = 0
  data.options.forEach((o, i) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.dataset.i = String(i)
    el.innerHTML = `<canvas></canvas>
      <div class="head"><div><span class="num">${i + 1}</span><span class="name">${o.name}</span></div>
      <button class="star" title="Star it to use it">☆</button></div>
      <div class="desc">${o.desc}</div>`
    const canvas = el.querySelector('canvas')!
    canvas.addEventListener('click', () => openFocus(i))
    el.querySelector<HTMLButtonElement>('.star')!.addEventListener('click', () => toggleStar(i))
    grid.appendChild(el)
    cards.push({ canvas, el })
    observer.observe(el)
  })
  showCards()
}

function showCards() {
  cards.forEach(({ el }, i) => {
    const o = data.options[i]
    const shown = filter === 'All' || (filter === 'Starred' ? picked.has(i) : o.category === filter || !!o.tags?.includes(filter))
    el.style.display = shown ? '' : 'none'
    el.classList.toggle('picked', picked.has(i))
    el.querySelector('.star')!.textContent = picked.has(i) ? '★' : '☆'
  })
  filters.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === filter))
  const list = [...picked].sort((a, b) => a - b)
  picksEl.textContent = list.length ? `Starred (${list.length}): ${list.map(i => `${i + 1} ${data.options[i]?.name ?? ''}`).join(' · ')}` : 'Star the options you like.'
}

function buildFilters() {
  const cats = ['All', ...new Set(data.options.map(o => o.category)), ...new Set(data.options.flatMap(o => o.tags ?? [])), 'Starred']
  filters.innerHTML = cats.map(c => `<button data-f="${c}">${c}</button>`).join('')
  filters.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f!
    save('filter', filter)
    showCards()
  }))
}

let saveTimer = 0
function toggleStar(i: number) {
  if (picked.has(i)) picked.delete(i); else picked.add(i)
  save('picked', [...picked])
  showCards()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(savePicks, 300)
}
async function savePicks() {
  const list = [...picked].sort((a, b) => a - b).map(i => ({ option: i + 1, name: data.options[i].name, desc: data.options[i].desc }))
  try {
    const res = await fetch(`/api/background-picks?set=${SET}`, { method: 'POST', body: JSON.stringify(list) })
    status.textContent = res.ok ? `saved ${list.length} star${list.length === 1 ? '' : 's'}` : 'not saved'
  } catch {
    status.textContent = 'not saved (is the dev server running?)'
  }
}

function openFocus(i: number) {
  focused = i
  $('focusTitle').textContent = `${i + 1}. ${data.options[i].name}`
  $('focusDesc').textContent = data.options[i].desc
  focus.classList.add('open')
}
function closeFocus() {
  focused = -1
  focus.classList.remove('open')
}

function frame() {
  if (data.audio && data.to !== undefined && (audio.currentTime >= data.to || audio.currentTime < (data.from ?? 0) - 0.05)) audio.currentTime = data.from ?? 0
  const t = nowMs()
  clock.textContent = `${(t / 1000).toFixed(1)} / ${data.loopSeconds} s`
  if (focused >= 0) draw(focusCanvas, data.options[focused].sequence, t)
  else for (const i of visible) if (cards[i].el.style.display !== 'none') draw(cards[i].canvas, data.options[i].sequence, t)
  requestAnimationFrame(frame)
}

// --- controls --------------------------------------------------------------------------------------------------

playBtn.addEventListener('click', togglePlay)
$('clear').addEventListener('click', () => { picked.clear(); save('picked', []); showCards(); savePicks() })
sizeSelect.value = load('size', '240px')
const applySize = () => { grid.style.setProperty('--card', sizeSelect.value); save('size', sizeSelect.value) }
sizeSelect.addEventListener('change', applySize)
applySize()
focus.addEventListener('click', closeFocus)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeFocus()
  if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'SELECT') { e.preventDefault(); togglePlay() }
})

if (SET !== '1') {
  const title = IS_SONG ? `${SET.replace(/_/g, ' ')} options` : `Background ${SET} Gallery`
  document.title = title
  document.querySelector('h1')!.textContent = title
}
showPlay()
fetch(OPTIONS_FILE).then(r => r.json()).then((d: Data) => {
  data = d
  if (d.audio) {
    audio.src = `/${d.audio}`
    if (d.from !== undefined) audio.addEventListener('loadedmetadata', () => { audio.currentTime = d.from! }, { once: true })
  }
  picked = new Set([...picked].filter(i => i < d.options.length))
  buildFilters()
  buildCards()
  requestAnimationFrame(frame)
})
