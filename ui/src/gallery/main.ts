import { PIXELS_PER_RING, renderRing, type HSV, type Sequence } from '../player/render'

// Option Gallery: many options for a part of a song (each a full sequence over the part), grouped in categories and
// played side by side in sync with the song's audio, so one can be picked for each block of the part. Every option
// comes at a few speeds, hit timings (when the beat-level hits fall) and variations; the dev server builds the
// sequences on request (/api/gallery, src/songs/shemesh-gallery-options.ts). "Your mix" plays the blocks with the
// candidates chosen for them, and the song as it is now (its exported sequence) for the others.
// Open at /gallery.html?part=<key> (chorus3, party5) while `yarn ui` is running.

interface Meta {
  song: string; part: string; title: string; audio: string; beats: number[]
  startBeat: number; endBeat: number; playFrom: number; playTo: number
  /** The blocks of the part, [start beat, end beat], each of which can take a candidate. */
  blocks: [number, number][]
  /** The song's exported sequence (ui/public), for the blocks without a candidate. */
  current: string
  parts: { key: string; title: string }[]
  speeds: string[]; hits: string[]; variations: string[]
  /** The styles to pick from ("full", "darker"), and the one to open with. */
  styles: string[]; style: string
  categories: string[]
  /** An option's style is one of the styles, or "any" (shown in every style). */
  options: { name: string; category: string; desc: string; style: string }[]
  /** The role overlays (shown on top of the part's mix), and the role patterns (the roles of every 4 bars). */
  overlays: { name: string; desc: string }[]
  roles: string[]
}

const BEATS_PER_BAR = 4
// Short labels for the hit timings on the cards.
const HIT_LABELS: Record<string, string> = { 'beat': 'beat', 'offbeat': 'off', 'twice a beat': '×2', 'two beats': '½' }
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const audio = $<HTMLAudioElement>('audio')
const grid = $('grid')
const scrub = $<HTMLInputElement>('scrub')
const playBtn = $<HTMLButtonElement>('play')
const focus = $('focus')
const params = new URLSearchParams(location.search)
// ?file= is the old address of a part (its data file then).
const partKey = params.get('part') ?? (params.get('file')?.match(/shemesh-(\w+)-options/)?.[1] ?? 'chorus3')

let g: Meta
const bar = (beat: number) => Math.floor(beat / BEATS_PER_BAR) + 1

// --- saved state, per part -------------------------------------------------------------------------------------

const KEY = (what: string) => `gallery:${partKey}:${what}`
const OLD_KEY = (what: string) => `gallery-${what}:shemesh-${partKey}-options`
function loadSaved<T>(what: string, oldWhat: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY(what)) ?? localStorage.getItem(OLD_KEY(oldWhat))
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
const save = (what: string, value: unknown) => { try { localStorage.setItem(KEY(what), JSON.stringify(value)) } catch { /* not saved */ } }

let picks = new Set<number>(loadSaved<number[]>('picks', 'picks', []))
// The speed and hit timing every card plays at, and the cards set to another speed.
let { speed, cardSpeed } = loadSaved('speeds', 'speeds', { speed: 'medium', cardSpeed: {} as Record<number, string> })
let hit: string = loadSaved('hit', 'hit', 'beat')
const speedOf = (i: number) => cardSpeed[i] ?? speed
// The cards set to their own hit timing (else the global one).
let cardHit: Record<number, string> = loadSaved('cardHits', 'cardHits', {})
const hitOf = (i: number) => cardHit[i] ?? hit
// A candidate is an option, or one of its variations (v), at a speed and hit timing.
type Pick = { i: number; v?: number; speed: string; hit?: string }
let blockPick: Record<number, Pick> = loadSaved('blocks', 'blocks', {})
let style = ''
// What the gallery shows: the options, or the role overlays on top of the mix; the role pattern; the overlay used.
let mode: string = loadSaved('mode', 'mode', 'options')
let roles: string = loadSaved('roles', 'roles', 'AAAB')
// The overlays used in each block (overlay indices by block index), at the role pattern `roles`. (Saved before as
// one list for the whole part, "overlay".)
let ovBlocks: Record<number, number[]> = loadSaved('overlays', 'overlays', {})
const oldOverlay = loadSaved<{ list?: number[]; i?: number; roles: string } | null>('overlay', 'overlay', null)
const anyOverlays = () => Object.values(ovBlocks).some(list => list.length > 0)

// --- sequences, built on request and kept ----------------------------------------------------------------------

const cache = new Map<string, Sequence | null>()
const keyOf = (i: number, v: number, sp: string, h: string) => `${i}|${v}|${sp}|${h}`
let wanted = new Map<string, { i: number; v: number; sp: string; h: string }>()
/** The sequence of option i (variation v) at a speed and hit timing, or undefined while it is being built. */
function seq(i: number, v = 0, sp = speedOf(i), h = hitOf(i)): Sequence | undefined {
  const k = keyOf(i, v, sp, h)
  const s = cache.get(k)
  if (s === undefined && !wanted.has(k)) wanted.set(k, { i, v, sp, h })
  return s ?? undefined
}
/** Ask the server for the sequences wanted since the last time, a batch per setting. */
function fetchWanted() {
  if (!wanted.size) return
  const groups = new Map<string, number[]>()
  wanted.forEach(({ i, v, sp, h }, k) => {
    cache.set(k, null)
    const gk = JSON.stringify([v, sp, h])
    groups.set(gk, [...(groups.get(gk) ?? []), i])
  })
  wanted = new Map()
  groups.forEach((indices, gk) => {
    const [v, sp, h] = JSON.parse(gk)
    for (let a = 0; a < indices.length; a += 40) {
      const chunk = indices.slice(a, a + 40)
      const q = new URLSearchParams({ part: partKey, op: 'build', indices: chunk.join(','), speed: sp, hit: h, variation: String(v) })
      fetch(`/api/gallery?${q}`).then(r => r.json()).then((seqs: Sequence[]) => {
        chunk.forEach((i, n) => cache.set(keyOf(i, v, sp, h), seqs[n] ?? {}))
      }).catch(() => chunk.forEach(i => cache.delete(keyOf(i, v, sp, h))))
    }
  })
}
const pickSeq = (p: Pick) => seq(p.i, p.v ?? 0, p.speed, p.hit ?? 'beat')
/** The part's picks by option name, as the song and the server take them. */
const mixOf = () => Object.fromEntries(Object.entries(blockPick).map(([k, p]) =>
  [k, { option: g.options[p.i]?.name, variation: p.v ?? 0, speed: p.speed, hit: p.hit ?? 'beat' }]))
// The overlays on top of the mix, built on request and kept (by overlay, role pattern and mix).
const ovCache = new Map<string, Sequence | null>()
let ovWanted = new Map<string, { i: number; r: string; mix: string; w: string }>()
/** Overlay i over the whole part (-1 for none) on top of the mix and the overlays used in each block, at role
 *  pattern r. */
function ovSeq(i: number, r = roles): Sequence | undefined {
  const mix = JSON.stringify(mixOf()), w = JSON.stringify(ovBlocks), k = `${i}|${r}|${mix}|${w}`
  const s = ovCache.get(k)
  if (s === undefined && !ovWanted.has(k)) ovWanted.set(k, { i, r, mix, w })
  return s ?? undefined
}
function fetchOverlays() {
  if (!ovWanted.size) return
  const groups = new Map<string, number[]>()
  // A batch per role pattern, mix and overlays used.
  ovWanted.forEach(({ i, r, mix, w }, k) => {
    ovCache.set(k, null)
    const gk = JSON.stringify([r, mix, w])
    groups.set(gk, [...(groups.get(gk) ?? []), i])
  })
  ovWanted = new Map()
  groups.forEach((indices, gk) => {
    const [r, mix, w] = JSON.parse(gk)
    const q = new URLSearchParams({ part: partKey, op: 'overlay', indices: indices.join(','), roles: r, mix, used: w })
    fetch(`/api/gallery?${q}`).then(res => res.json()).then((seqs: Sequence[]) => {
      indices.forEach((i, n) => ovCache.set(`${i}|${r}|${mix}|${w}`, seqs[n] ?? {}))
    }).catch(() => indices.forEach(i => ovCache.delete(`${i}|${r}|${mix}|${w}`)))
  })
}
const pickName = (p: Pick) =>
  `#${p.i + 1} ${g.options[p.i].name}${p.v ? ` · v${p.v + 1} ${g.variations[p.v]}` : ''} (${p.speed}, ${p.hit ?? 'beat'})`

// The song's sequence as it is now, and what "Your mix" plays at beat b.
let current: Sequence = {}
/** The block playing at beat b, or -1. */
const blockAt = (b: number) => g.blocks.findIndex(([s, e]) => b >= s && b < e)
function compSeq(b: number): Sequence | undefined {
  if (anyOverlays() && blockAt(b) >= 0) return ovSeq(-1)
  const p = blockPick[blockAt(b)]
  return p ? pickSeq(p) : current
}

// --- time ----------------------------------------------------------------------------------------------------

function timeAtBeat(b: number) {
  const n = g.beats.length, k = Math.max(0, Math.min(n - 2, Math.floor(b)))
  return g.beats[k] + (b - k) * (g.beats[k + 1] - g.beats[k])
}
function beatAt(t: number) {
  let lo = 0, hi = g.beats.length - 1
  if (t <= g.beats[0]) return 0
  if (t >= g.beats[hi]) return hi
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (g.beats[mid] <= t) lo = mid; else hi = mid }
  return lo + (t - g.beats[lo]) / (g.beats[hi] - g.beats[lo])
}
// The loop: the whole part (-1) or one block, from a beat before it.
let loop = -1
const fromMs = () => timeAtBeat(loop < 0 ? g.playFrom : g.blocks[loop][0] - 1)
const toMs = () => timeAtBeat(loop < 0 ? g.playTo : g.blocks[loop][1])
// Without audio the playhead runs on its own clock.
let clockAt = 0, clockStart = 0, clockRunning = false
const hasAudio = () => !!audio.getAttribute('src')
const nowMs = () => hasAudio() ? audio.currentTime * 1000 : clockRunning ? clockAt + performance.now() - clockStart : clockAt
const playing = () => hasAudio() ? !audio.paused : clockRunning
function seek(ms: number) {
  ms = Math.min(Math.max(fromMs(), ms), toMs())
  if (hasAudio()) audio.currentTime = ms / 1000
  else { clockAt = ms; clockStart = performance.now() }
}
function togglePlay() {
  if (hasAudio()) { if (audio.paused) audio.play(); else audio.pause() }
  else { clockAt = nowMs(); clockStart = performance.now(); clockRunning = !clockRunning }
}

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

/** Draw a sequence at time t; while it is still being built, the rings show dark. */
function draw(canvas: HTMLCanvasElement, s: Sequence | undefined, t: number) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  if (!w) return
  const px = Math.round(w * dpr)
  if (canvas.width !== px || canvas.height !== px) { canvas.width = px; canvas.height = px }
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, w)
  for (let r = 1; r <= 12; r++) renderRing(s?.[`ring${r}`], t, leds[r])
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
// Only the cards on screen are drawn (and built).
const visible = new Set<number>()
const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    const i = Number((e.target as HTMLElement).dataset.i)
    if (e.isIntersecting) visible.add(i); else visible.delete(i)
  }
}, { rootMargin: '300px' })
// The overlay cards, and the ones on screen.
let ovCards: HTMLCanvasElement[] = []
let ovEls: HTMLElement[] = []
const ovVisible = new Set<number>()
const ovObserver = new IntersectionObserver(entries => {
  for (const e of entries) {
    const i = Number((e.target as HTMLElement).dataset.ov)
    if (e.isIntersecting) ovVisible.add(i); else ovVisible.delete(i)
  }
}, { rootMargin: '300px' })
// The open view: -1 the grid, -2 "Your mix" big, -10 - i overlay i big, else an option big; and the option whose
// variations are open.
let focused = -1
let varsOf = -1
let varCards: HTMLCanvasElement[] = []

const useButtons = () =>
  `<div class="use">use for ${g.blocks.map(([s, e], k) => `<button data-block="${k}" title="Bars ${bar(s)}-${bar(e - 1)}">${k + 1}</button>`).join('')}</div>`

function frame() {
  let t = nowMs()
  if (t >= toMs() || t < fromMs()) { seek(fromMs()); t = fromMs() }
  const b = beatAt(t), whole = Math.floor(b)
  if (focused === -2) draw($<HTMLCanvasElement>('focusCanvas'), compSeq(b), t)
  else if (focused >= 0) draw($<HTMLCanvasElement>('focusCanvas'), seq(focused), t)
  else if (focused <= -10) draw($<HTMLCanvasElement>('focusCanvas'), ovSeq(-10 - focused), t)
  else if (varsOf >= 0) varCards.forEach((c, v) => draw(c, seq(varsOf, v), t))
  else if (mode === 'overlays') {
    ovCards.forEach((c, i) => { if (ovVisible.has(i)) draw(c, ovSeq(i), t) })
    draw($<HTMLCanvasElement>('compCanvas'), compSeq(b), t)
  } else {
    for (const i of visible) if (cards[i].el.style.display !== 'none') draw(cards[i].canvas, seq(i), t)
    draw($<HTMLCanvasElement>('compCanvas'), compSeq(b), t)
  }
  fetchWanted()
  fetchOverlays()
  const now = blockAt(b)
  document.querySelectorAll('#slots .slot').forEach((el, k) => el.classList.toggle('now', k === now))
  const roleBar = Math.floor((b - g.startBeat) / BEATS_PER_BAR), r = roles
  const role = b >= g.startBeat && b < g.endBeat ? ` · role ${r[roleBar % r.length]}` : ''
  $('barbeat').innerHTML = `bar ${bar(whole)} · beat ${(whole % BEATS_PER_BAR) + 1}${role} <span class="muted">(${b.toFixed(1)})</span>`
  document.querySelectorAll('#beats span').forEach((el, k) => {
    el.classList.toggle('on', k === whole % BEATS_PER_BAR && b - whole < 0.35)
    el.classList.toggle('down', k === 0)
  })
  if (document.activeElement !== scrub) scrub.value = String(b)
  playBtn.textContent = playing() ? '❚❚ Pause' : '▶ Play'
  requestAnimationFrame(frame)
}

function showPicks() {
  save('picks', [...picks])
  cards.forEach(({ el }, i) => el.classList.toggle('picked', picks.has(i)))
  const list = [...picks].sort((a, b) => a - b).map(i => `#${i + 1} ${g.options[i].name} (${speedOf(i)}, ${hitOf(i)})`)
  $('picked').textContent = list.length ? `★ Picked: ${list.join(' · ')}` : ''
}

/** Save the speeds and hit timings, mark each card's speed and hit buttons, and update the picks (they show
 *  them). */
function saveSpeeds() {
  save('speeds', { speed, cardSpeed })
  save('cardHits', cardHit)
  cards.forEach(({ el }, i) => {
    el.querySelectorAll<HTMLButtonElement>('.speeds button').forEach(b => {
      b.classList.toggle('on', b.dataset.speed === speedOf(i))
      b.classList.toggle('own', b.dataset.speed === speedOf(i) && i in cardSpeed)
    })
    el.querySelectorAll<HTMLButtonElement>('.hits button').forEach(b => {
      b.classList.toggle('on', b.dataset.hit === hitOf(i))
      b.classList.toggle('own', b.dataset.hit === hitOf(i) && i in cardHit)
    })
  })
  showPicks()
}

/** Save the blocks' candidates, show them in "Your mix", and mark the block buttons. */
function showBlocks() {
  save('blocks', blockPick)
  save('overlays', ovBlocks)
  // Also to the project (src/songs/shemesh-gallery-mix.json), for shemesh.ts: the picks by option name, and the
  // overlay.
  const mix: Record<string, unknown> = mixOf()
  if (anyOverlays()) mix.overlay = {
    roles, blocks: Object.fromEntries(Object.entries(ovBlocks).filter(([, l]) => l.length).map(([k, l]) => [k, l.map(i => g.overlays[i]?.name)])),
  }
  fetch(`/api/gallery-mix?part=${encodeURIComponent(partKey)}`, { method: 'POST', body: JSON.stringify(mix) }).catch(() => { /* not saved */ })
  const slots = $('slots')
  slots.innerHTML = ''
  g.blocks.forEach(([s, e], k) => {
    const p = blockPick[k]
    const el = document.createElement('div')
    el.className = 'slot'
    el.innerHTML = `<span class="bars">${k + 1} · bars ${bar(s)}-${bar(e - 1)}</span><span class="pick"></span>`
    const pick = el.querySelector<HTMLElement>('.pick')!
    if (p) {
      pick.textContent = pick.title = pickName(p)
      const clear = document.createElement('button')
      clear.textContent = '✕'
      clear.title = 'Back to the song as it is now'
      clear.addEventListener('click', () => { delete blockPick[k]; showBlocks() })
      el.appendChild(clear)
    } else { pick.textContent = 'as in the song now'; pick.classList.add('current') }
    slots.appendChild(el)
  })
  if (anyOverlays()) {
    const el = document.createElement('div')
    el.className = 'slot'
    el.innerHTML = `<span class="bars">overlays · roles ${roles}</span><span class="pick"></span>`
    const pick = el.querySelector<HTMLElement>('.pick')!
    pick.textContent = pick.title = g.blocks.map((_, k) => `${k + 1}: ${(ovBlocks[k] ?? []).map(i => `O${i + 1}`).join('+') || '–'}`).join(' · ')
    const clear = document.createElement('button')
    clear.textContent = '✕'
    clear.title = 'No overlays'
    clear.addEventListener('click', () => { ovBlocks = {}; showBlocks() })
    el.appendChild(clear)
    slots.appendChild(el)
  }
  ovEls.forEach((el, i) => {
    const inAll = g.blocks.every((_, k) => (ovBlocks[k] ?? []).includes(i))
    el.classList.toggle('picked', g.blocks.some((_, k) => (ovBlocks[k] ?? []).includes(i)))
    el.querySelectorAll<HTMLButtonElement>('.ov-blocks button').forEach(b =>
      b.classList.toggle('on', b.dataset.block === 'all' ? inAll : (ovBlocks[Number(b.dataset.block)] ?? []).includes(i)))
  })
  const mark = (root: ParentNode, i: number, v?: number) => root.querySelectorAll<HTMLButtonElement>('.use button').forEach(b => {
    const p = blockPick[Number(b.dataset.block)]
    b.classList.toggle('on', !!p && p.i === i && (p.v ?? 0) === (v ?? 0))
  })
  cards.forEach(({ el }, i) => mark(el, i))
  if (varsOf >= 0) document.querySelectorAll<HTMLElement>('#varsGrid .card').forEach((el, v) => mark(el, varsOf, v))
}

/** Make option i (or its variation v) the candidate of block k, at the option's speed and the hit timing; again to
 *  take it back off. */
function usePick(k: number, i: number, v = 0) {
  const p = blockPick[k]
  if (p && p.i === i && (p.v ?? 0) === v && p.speed === speedOf(i) && (p.hit ?? 'beat') === hitOf(i)) delete blockPick[k]
  else blockPick[k] = { i, v: v || undefined, speed: speedOf(i), hit: hitOf(i) }
  showBlocks()
}

/** Show the variations of option i, playing along, each with its block buttons. */
function openVariations(i: number) {
  varsOf = i
  $('varsTitle').textContent = `#${i + 1} ${g.options[i].name}`
  $('varsInfo').textContent = `${g.variations.length} variations · ${speedOf(i)}, hits on ${hitOf(i)} (the card's)`
  const gridEl = $('varsGrid')
  gridEl.innerHTML = ''
  varCards = g.variations.map((name, v) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.innerHTML = `<div class="head"><div><span class="num">v${v + 1}</span><span class="name"></span></div></div><canvas></canvas>${useButtons()}`
    el.querySelector('.name')!.textContent = name
    el.querySelectorAll<HTMLButtonElement>('.use button').forEach(b => b.addEventListener('click', () => usePick(Number(b.dataset.block), i, v)))
    gridEl.appendChild(el)
    return el.querySelector('canvas')!
  })
  $('vars').classList.add('open')
  showBlocks()
}
function closeVariations() {
  varsOf = -1
  $('vars').classList.remove('open')
}

function openFocus(i: number) {
  focused = i
  $('focusTitle').textContent = `#${i + 1} ${g.options[i].name} · ${speedOf(i)} · hits on ${hitOf(i)}`
  $('focusDesc').textContent = g.options[i].desc
  focus.classList.add('open')
}

// --- setup -----------------------------------------------------------------------------------------------------

/** A select filled with `values`, set to `value`, calling `onChange` with the new value. */
function picker(id: string, values: string[], value: string, onChange: (v: string) => void, label = (v: string) => v) {
  const sel = $<HTMLSelectElement>(id)
  sel.innerHTML = values.map(v => `<option value="${v}">${label(v)}</option>`).join('')
  sel.value = value
  sel.addEventListener('change', () => onChange(sel.value))
}

async function load() {
  const res = await fetch(`/api/gallery?part=${encodeURIComponent(partKey)}&op=meta`).catch(() => null)
  if (!res?.ok) { $('status').textContent = 'The gallery data comes from the dev server (/api/gallery); is `yarn ui` running?'; return }
  g = await res.json()
  // Overlays saved as one list for the whole part: into every block.
  if (!Object.keys(ovBlocks).length && oldOverlay) {
    const list = oldOverlay.list ?? (oldOverlay.i !== undefined ? [oldOverlay.i] : [])
    ovBlocks = Object.fromEntries(g.blocks.map((_, k) => [k, [...list]]))
    roles = oldOverlay.roles ?? roles
  }
  $('what').textContent = `${g.song} · bars ${bar(g.startBeat)}-${bar(g.endBeat - 1)} · ${g.options.length} options`
  scrub.min = String(g.playFrom)
  scrub.max = String(g.playTo)
  picker('part', g.parts.map(p => p.key), g.part, v => { location.search = `?part=${encodeURIComponent(v)}` },
    v => g.parts.find(p => p.key === v)!.title)

  // A section per category, in order, with a filter button each.
  const sections = new Map<string, HTMLElement>()
  for (const c of g.categories) {
    const sec = document.createElement('section')
    sec.innerHTML = `<h2></h2><div class="grid"></div>`
    sec.querySelector('h2')!.textContent = c
    grid.appendChild(sec)
    sections.set(c, sec)
  }
  // The style shown (or "all"), and the category: only the cards of both are shown, and only the categories with
  // cards in the style get a filter button.
  style = loadSaved('style', 'style', g.style)
  if (![...g.styles, 'all'].includes(style)) style = g.style
  let category = 'All'
  const inStyle = (i: number) => style === 'all' || g.options[i].style === style || g.options[i].style === 'any'
  const filters = $('filters')
  const showCards = () => {
    filters.innerHTML = ''
    const counts = new Map<string, number>()
    g.options.forEach((o, i) => { if (inStyle(i)) counts.set(o.category, (counts.get(o.category) ?? 0) + 1) })
    if (category !== 'All' && !counts.has(category)) category = 'All'
    for (const c of ['All', ...g.categories.filter(c => counts.has(c))]) {
      const b = document.createElement('button')
      b.textContent = c === 'All' ? `All (${[...counts.values()].reduce((a, n) => a + n, 0)})` : `${c} (${counts.get(c)})`
      b.classList.toggle('on', c === category)
      b.addEventListener('click', () => { category = c; showCards() })
      filters.appendChild(b)
    }
    cards.forEach(({ el }, i) => { el.style.display = inStyle(i) ? '' : 'none' })
    sections.forEach((sec, name) => { sec.style.display = counts.has(name) && (category === 'All' || category === name) ? '' : 'none' })
  }
  picker('style', [...g.styles, 'all'], style, v => { style = v; save('style', v); showCards() })
  picker('speed', g.speeds, speed, v => { speed = v; cardSpeed = {}; saveSpeeds() })
  if (!g.hits.includes(hit)) hit = g.hits[0]
  picker('hit', g.hits, hit, v => { hit = v; save('hit', v); cardHit = {}; saveSpeeds() })
  // The mode, the role pattern, and the overlay cards.
  const ovGrid = $('ovgrid')
  const showMode = () => {
    grid.style.display = mode === 'overlays' ? 'none' : ''
    $('filters').style.display = mode === 'overlays' ? 'none' : ''
    ovGrid.style.display = mode === 'overlays' ? '' : 'none'
    $('rolesLabel').style.display = mode === 'overlays' ? '' : 'none'
  }
  picker('mode', ['options', 'overlays'], mode, v => { mode = v; save('mode', v); showMode() })
  if (!g.roles.includes(roles)) roles = g.roles[0]
  picker('roles', g.roles, roles, v => { roles = v; save('roles', v); showBlocks() }, v => `${v} (every 4 bars)`)
  ovGrid.innerHTML = `<div class="ov-note muted">Every overlay plays over the whole part on top of your mix (the blocks with
    their candidates; the blocks without one are dark here) and the overlays already used in each block, so they can be
    combined. Use one in a block (1-${g.blocks.length}) or in all of them. The roles repeat every 4 bars from the start
    of the part.</div><div class="grid"></div>`
  ovEls = g.overlays.map((o, i) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.dataset.ov = String(i)
    el.innerHTML = `<div class="head"><div><span class="num">O${i + 1}</span><span class="name"></span></div></div><canvas></canvas>` +
      `<div class="use ov-blocks">use in ${g.blocks.map(([st, e], k) => `<button data-block="${k}" title="Bars ${bar(st)}-${bar(e - 1)}">${k + 1}</button>`).join('')}<button data-block="all" title="Every block">all</button></div><div class="desc"></div>`
    el.querySelector('.name')!.textContent = o.name
    el.querySelector('.desc')!.textContent = o.desc
    el.querySelector('canvas')!.addEventListener('click', () => {
      focused = -10 - i
      $('focusTitle').textContent = `${o.name} · roles ${roles}`
      $('focusDesc').textContent = o.desc
      focus.classList.add('open')
    })
    el.querySelectorAll<HTMLButtonElement>('.ov-blocks button').forEach(btn => btn.addEventListener('click', () => {
      // Toggle overlay i in a block, or in every block ("all": out of all if it is in all, else into all).
      const ks = btn.dataset.block === 'all' ? g.blocks.map((_, k) => k) : [Number(btn.dataset.block)]
      const take = ks.every(k => (ovBlocks[k] ?? []).includes(i))
      for (const k of ks) {
        const list = (ovBlocks[k] ?? []).filter(x => x !== i)
        ovBlocks[k] = take ? list : [...list, i]
      }
      showBlocks()
    }))
    ovGrid.querySelector('.grid')!.appendChild(el)
    ovObserver.observe(el)
    return el
  })
  ovCards = ovEls.map(el => el.querySelector('canvas')!)
  showMode()
  picker('loop', ['-1', ...g.blocks.map((_, k) => String(k))], '-1', v => { loop = Number(v); seek(fromMs()) },
    v => v === '-1' ? 'whole part' : `block ${Number(v) + 1}, bars ${bar(g.blocks[Number(v)][0])}-${bar(g.blocks[Number(v)][1] - 1)}`)

  g.options.forEach((o, i) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.dataset.i = String(i)
    el.innerHTML = `<div class="head"><div><span class="num">#${i + 1}</span><span class="name"></span></div><button class="star" title="Pick">★</button></div><canvas></canvas>` +
      `<div class="speeds">${g.speeds.map(sp => `<button data-speed="${sp}">${sp}</button>`).join('')}</div>` +
      `<div class="speeds hits">${g.hits.map(h => `<button data-hit="${h}" title="Hits on ${h}">${HIT_LABELS[h] ?? h}</button>`).join('')}</div>` +
      `<button class="vars-btn">${g.variations.length} variations</button>${useButtons()}<div class="desc"></div>`
    el.querySelector('.name')!.textContent = o.name
    el.querySelector('.desc')!.textContent = o.desc
    const canvas = el.querySelector('canvas')!
    canvas.addEventListener('click', () => openFocus(i))
    el.querySelector('.star')!.addEventListener('click', () => { if (picks.has(i)) picks.delete(i); else picks.add(i); showPicks() })
    el.querySelectorAll<HTMLButtonElement>('.use button').forEach(b => b.addEventListener('click', () => usePick(Number(b.dataset.block), i)))
    el.querySelector('.vars-btn')!.addEventListener('click', () => openVariations(i))
    el.querySelectorAll<HTMLButtonElement>('.speeds button[data-speed]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.speed === speed) delete cardSpeed[i]; else cardSpeed[i] = b.dataset.speed!
      saveSpeeds()
    }))
    el.querySelectorAll<HTMLButtonElement>('.hits button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.hit === hit) delete cardHit[i]; else cardHit[i] = b.dataset.hit!
      saveSpeeds()
    }))
    sections.get(o.category)!.querySelector('.grid')!.appendChild(el)
    cards.push({ canvas, el })
    observer.observe(el)
  })
  showCards()
  saveSpeeds()
  showBlocks()

  const cur = await fetch(`/${g.current}`).then(r => r.ok ? r.json() : null).catch(() => null)
  if (cur?.sequence) current = cur.sequence
  else $('status').textContent = `no /${g.current}: the blocks without a candidate play dark`
  const head = await fetch(`/${encodeURIComponent(g.audio)}`, { method: 'HEAD' }).catch(() => null)
  if (head?.ok && !(head.headers.get('content-type') ?? '').includes('text/html')) audio.src = `/${encodeURIComponent(g.audio)}`
  else $('status').textContent = `no audio (${g.audio} not in ui/public), playing silently`
  // Start where the part starts, so the paused view shows it.
  const startAt = () => seek(timeAtBeat(g.startBeat))
  if (hasAudio()) audio.addEventListener('loadedmetadata', startAt, { once: true })
  else startAt()
  requestAnimationFrame(frame)
}

focus.addEventListener('click', () => { focused = -1; focus.classList.remove('open') })
$('varsClose').addEventListener('click', closeVariations)
$('compCanvas').addEventListener('click', () => {
  focused = -2
  $('focusTitle').textContent = 'Your mix'
  $('focusDesc').textContent = g.blocks.map((_, k) => blockPick[k] ? `${k + 1}: ${pickName(blockPick[k])}` : `${k + 1}: as now`).join(' · ')
  focus.classList.add('open')
})
playBtn.addEventListener('click', togglePlay)
scrub.addEventListener('input', () => seek(timeAtBeat(Number(scrub.value))))
$<HTMLSelectElement>('size').addEventListener('change', e => document.body.style.setProperty('--card', (e.target as HTMLSelectElement).value))
window.addEventListener('keydown', e => {
  if (!g) return
  if (e.code === 'Space') { e.preventDefault(); togglePlay() }
  else if (e.key === 'Escape') {
    if (focused !== -1) { focused = -1; focus.classList.remove('open') }
    else closeVariations()
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    const b = Math.floor(beatAt(nowMs()) / BEATS_PER_BAR) * BEATS_PER_BAR + (e.key === 'ArrowRight' ? BEATS_PER_BAR : -BEATS_PER_BAR)
    seek(timeAtBeat(b))
  }
})
load()
