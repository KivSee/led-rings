import { PIXELS_PER_RING, renderRing, type HSV, type Sequence } from '../player/render'
import { hsvRgb, PIXEL_POS } from '../player/geometry'
import { BAR, compose, HITS, PACE, mixPlacements, PALETTES, SPEEDS, TEXTURES, timingLabel, TRANSITIONS, VARIATIONS, withBlocks, type Hit, type LabContext, type Overlay, type SectionSpec, type Shape, type ShapePart, type Speed, type Texture, type Timing, type Transition } from './options'

// Section Lab: loop one section of a song and compare option cards side by side, each drawing what the rings
// would show, and try a mix of them taking turns with transitions. Every option plays at a speed, a hit timing and
// one of 8 variations (as in the Option Gallery), and blocks of the section can take their own option instead of
// the mix.
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
// which option set leads (textures with that `set`; the rest are under "options from other sections"), and the
// section's inner divisions (beats where the music changes), offered as start points for overlays
const optionSet = params.get('set') ?? (/chase/i.test(sectionName) ? 'chase' : 'starry')
// (from the URL, else as last opened)
let marks = (params.get('marks') ?? '').split(',').map(Number).filter(n => Number.isFinite(n) && n > 0)
const inSet = (t: Texture) => (t.set ?? 'starry') === optionSet
const isOverlay = (t: Texture) => /overlays/i.test(t.family)

const audio = $<HTMLAudioElement>('audio')
let beatMs = 400, offsetMs = 0

// --- state (kept in localStorage) ----------------------------------------------------------------------------------

// defaults per option set: starry middle sat on a dim bed with a build-up; the Chase runs at full color on the beat
let paletteId = optionSet === 'chase' ? 'after' : 'rebuild'
const mappingFor: Record<string, string> = {}
let picks: string[] = []
let shape: Shape = optionSet === 'chase'
  ? { buildUp: false, fadeOut: false, peak: false, peakOffset: 0, base: 1, pace: 0, overlays: [] }
  : { buildUp: true, fadeOut: true, peak: true, peakOffset: 0 }
type Choice = { id: string; mapping: string; timing?: Timing; palette?: string }
let mix: Choice[] = []
let mixBars = 2
let mixTransition: Transition = 'streak'
let shuffleColors = true
// the speed and hit timing every card plays at, and each card's own speed / hit / variation
let speedAll: Speed = 'medium'
let hitAll: Hit = 'beat'
const cardTiming: Record<string, Timing> = {}
// each card's own palette (else the section's)
const cardPalette: Record<string, string> = {}
// the blocks: at the section's marks, or every 4 or 8 bars; the options picked for them, by "from-to"
type BlockLayout = 'marks' | '4' | '8'
let blockLayout: BlockLayout = 'marks'
let blockPick: Record<string, Choice> = {}
// each block's own transition at its edges (else the mix's), by "from-to"
const blockTrans: Record<string, Transition> = {}

// the marks saved for this section (used when the URL has none)
let savedMarks: number[] | undefined
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(storeKey) ?? '{}')
    savedMarks = s.marks
    if (PALETTES.some(p => p.id === s.paletteId)) paletteId = s.paletteId
    Object.assign(mappingFor, s.mappingFor ?? {})
    if (Array.isArray(s.picks)) picks = s.picks
    if (s.shape) shape = { ...shape, ...s.shape }
    if (Array.isArray(s.mix)) mix = s.mix.filter((m: { id: string }) => TEXTURES.some(t => t.id === m.id))
    if ([1, 2, 3, 4, 8].includes(s.mixBars)) mixBars = s.mixBars
    if (TRANSITIONS.some(t => t.id === s.mixTransition)) mixTransition = s.mixTransition
    if (typeof s.shuffleColors === 'boolean') shuffleColors = s.shuffleColors
    if (SPEEDS.some(x => x.id === s.speedAll)) speedAll = s.speedAll
    if (HITS.some(x => x.id === s.hitAll)) hitAll = s.hitAll
    Object.assign(cardTiming, s.cardTiming ?? {})
    for (const [id, pal] of Object.entries((s.cardPalette ?? {}) as Record<string, string>)) if (PALETTES.some(x => x.id === pal)) cardPalette[id] = pal
    if (['marks', '4', '8'].includes(s.blockLayout)) blockLayout = s.blockLayout
    for (const [k, tr] of Object.entries((s.blockTrans ?? {}) as Record<string, Transition>)) if (TRANSITIONS.some(t => t.id === tr)) blockTrans[k] = tr
    if (s.blockPick && typeof s.blockPick === 'object')
      blockPick = Object.fromEntries(Object.entries(s.blockPick as Record<string, Choice>).filter(([, c]) => TEXTURES.some(t => t.id === c.id)))
  } catch { /* first visit or blocked storage */ }
  if (!params.has('marks') && Array.isArray(savedMarks)) marks = savedMarks.filter(n => typeof n === 'number' && n > 0)
  if (blockLayout === 'marks' && !marks.length) blockLayout = '4'
}
const save = () => {
  try {
    localStorage.setItem(storeKey, JSON.stringify({ paletteId, mappingFor, picks, shape, mix, mixBars, mixTransition, shuffleColors, speedAll, hitAll, cardTiming, cardPalette, blockLayout, blockPick, blockTrans, marks }))
  } catch { /* ignore */ }
}

// --- sequences -----------------------------------------------------------------------------------------------------

const palette = () => PALETTES.find(p => p.id === paletteId)!
const textureById = (id: string) => TEXTURES.find(t => t.id === id)!
const mappingOf = (t: Texture) => mappingFor[t.id] ?? t.mappings[0]
/** The card's timing: its own speed / hit if set, else the ones for all cards, and its variation (only what differs
 *  from medium, on the beat, original is kept). */
function timingOf(t: Texture, variation = cardTiming[t.id]?.variation ?? 0): Timing | undefined {
  const own = cardTiming[t.id] ?? {}
  const tm: Timing = {}
  const speed = own.speed ?? speedAll, hit = own.hit ?? hitAll
  if (speed !== 'medium') tm.speed = speed
  if (hit !== 'beat') tm.hit = hit
  if (variation) tm.variation = variation
  return Object.keys(tm).length ? tm : undefined
}
const paletteName = (id?: string) => PALETTES.find(x => x.id === id)?.name
/** "Name · mapping · fast, off-beat · Neon" (no timing = medium, on the beat, original; no palette = the section's) */
const describe = (t: Texture, mapping: string, timing: Timing | undefined, pal?: string) =>
  `${t.name} · ${mapping}${timingLabel(timing) ? ` · ${timingLabel(timing)}` : ''}${pal ? ` · ${paletteName(pal)}` : ''}`
const pickId = (t: Texture) => `${describe(t, mappingOf(t), timingOf(t))} · ${paletteName(cardPalette[t.id]) ?? palette().name}`
const choiceOf = (t: Texture, variation?: number): Choice => {
  const c: Choice = { id: t.id, mapping: mappingOf(t) }
  const timing = timingOf(t, variation)
  if (timing) c.timing = timing
  if (cardPalette[t.id]) c.palette = cardPalette[t.id]
  return c
}
const describeChoice = (c: Choice) => describe(textureById(c.id), c.mapping, c.timing, c.palette)
/** The blocks of the section, [from, to] beats. */
function blocks(): [number, number][] {
  const cuts = blockLayout === 'marks'
    ? [fromBeat, ...marks.filter(m => m > fromBeat && m < toBeat), toBeat]
    : (() => { const len = Number(blockLayout) * BAR, out: number[] = []; for (let b = fromBeat; b < toBeat; b += len) out.push(b); return [...out, toBeat] })()
  return cuts.slice(0, -1).map((b, k) => [b, cuts[k + 1]] as [number, number])
}
const blockKey = ([a, b]: [number, number]) => `${a}-${b}`
const pickedBlocks = () => blocks().filter(k => blockPick[blockKey(k)])
const ctx = (): LabContext => ({ fromBeat, toBeat, beatMs, offsetMs, palette: palette() })
const shapeKey = () => JSON.stringify(shape)

const cache = new Map<string, Sequence>()
function cardSequence(t: Texture, variation?: number): Sequence {
  const timing = timingOf(t, variation)
  const own = cardPalette[t.id]
  const key = `card|${t.id}|${mappingOf(t)}|${JSON.stringify(timing)}|${paletteId}|${own}|${shapeKey()}`
  let seq = cache.get(key)
  if (!seq) {
    seq = compose(ctx(), [{ texture: t, mapping: mappingOf(t), from: fromBeat, to: toBeat, amount: () => 1, timing, palette: own }], shape)
    cache.set(key, seq)
  }
  return seq
}
function mixSequence(): Sequence | null {
  const picked = pickedBlocks()
  if (!mix.length && !picked.length) return null
  const key = `mix|${JSON.stringify(mix)}|${JSON.stringify(picked.map(k => [blockPick[blockKey(k)], blockTrans[blockKey(k)]]))}|${blockLayout}|${mixBars}|${mixTransition}|${paletteId}|${shapeKey()}|${shuffleColors}`
  let seq = cache.get(key)
  if (!seq) {
    const items = mix.map(m => ({ texture: textureById(m.id), mapping: m.mapping, timing: m.timing, palette: m.palette }))
    const blockList = picked.map(([from, to]) => { const c = blockPick[`${from}-${to}`]; return { from, to, texture: textureById(c.id), mapping: c.mapping, timing: c.timing, palette: c.palette, transition: blockTrans[`${from}-${to}`] } })
    seq = compose(ctx(), withBlocks(ctx(), mixPlacements(ctx(), items, mixBars, mixTransition), blockList, mixTransition), shape, shuffleColors ? mixBars * BAR : 0)
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
    b.onclick = () => { paletteId = p.id; save(); renderPalettes(); renderOverlays(); refresh() }
    $('palettes').append(b)
  }
  $('paletteSource').textContent = `${palette().name}: ${palette().source}`
}

function renderCards() {
  // this section's options first; the other sections' options stay available, folded away
  const families = [...new Set([...TEXTURES.filter(inSet), ...TEXTURES.filter(t => !inSet(t))].map(t => t.family))]
  const other = document.createElement('details')
  other.className = 'other'
  other.innerHTML = `<summary>Options from other sections (${TEXTURES.filter(t => !inSet(t)).length})</summary>`
  const visibility = new IntersectionObserver(entries => {
    for (const e of entries) { const c = cards.find(x => x.canvas === e.target); if (c) c.visible = e.isIntersecting }
  })
  for (const family of families) {
    const section = document.createElement('div')
    section.className = 'family'
    section.innerHTML = `<h2>${family}</h2><div class="grid"></div>`
    const own = TEXTURES.some(t => t.family === family && inSet(t))
    if (own) $('families').append(section)
    else other.append(section)
    for (const texture of TEXTURES.filter(t => t.family === family)) {
      const el = document.createElement('div')
      el.className = 'card'
      el.innerHTML = `
        <div class="top"><h2>${texture.name}</h2><span><button class="add" title="Add to the mix">＋ mix</button><button class="star" title="Add to picks">★</button></span></div>
        <canvas></canvas>
        <p>${texture.description}</p>
        <div class="meta"><span class="muted">from ${texture.inspiration}</span>
          <label class="muted">mapping <select class="map">${texture.mappings.map(m => `<option>${m}</option>`).join('')}</select></label></div>
        <div class="timing">
          <select class="spd" title="Speed (— = the speed for all cards)"><option value="">speed —</option>${SPEEDS.map(x => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
          <select class="hit" title="Hit timing (— = the timing for all cards)"><option value="">hits —</option>${HITS.map(x => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
          <select class="var" title="Variation">${VARIATIONS.map((v, n) => `<option value="${n}">v${n + 1} ${v.name}</option>`).join('')}</select>
          <button class="show-vars" title="All 8 variations side by side">▦</button>
          <select class="pal-own" title="This option's palette (— = the section palette)"><option value="">palette —</option>${PALETTES.map(x => `<option value="${x.id}">${x.name}</option>`).join('')}</select>
          <span class="sw"></span>
        </div>
        <div class="use muted"></div>`
      const canvas = el.querySelector('canvas')!
      const select = el.querySelector<HTMLSelectElement>('.map')!
      select.value = mappingOf(texture)
      select.onchange = () => { mappingFor[texture.id] = select.value; save(); refresh() }
      const own = (k: keyof Timing, v: string | number | undefined) => {
        const t = { ...cardTiming[texture.id], [k]: v === '' || v === 0 ? undefined : v }
        cardTiming[texture.id] = JSON.parse(JSON.stringify(t))
        save(); refresh()
      }
      const spd = el.querySelector<HTMLSelectElement>('.spd')!, hit = el.querySelector<HTMLSelectElement>('.hit')!, vr = el.querySelector<HTMLSelectElement>('.var')!
      spd.onchange = () => own('speed', spd.value)
      hit.onchange = () => own('hit', hit.value)
      vr.onchange = () => own('variation', Number(vr.value))
      el.querySelector<HTMLButtonElement>('.show-vars')!.onclick = () => openVariations(texture)
      const palSel = el.querySelector<HTMLSelectElement>('.pal-own')!
      palSel.onchange = () => {
        if (palSel.value) cardPalette[texture.id] = palSel.value
        else delete cardPalette[texture.id]
        save(); refresh()
      }
      el.querySelector<HTMLButtonElement>('.star')!.onclick = () => {
        const id = pickId(texture)
        picks = picks.includes(id) ? picks.filter(p => p !== id) : [...picks, id]
        save(); refresh()
      }
      el.querySelector<HTMLButtonElement>('.add')!.onclick = () => { mix.push(choiceOf(texture)); save(); refresh() }
      canvas.onclick = () => { bigTexture = texture; $('big').hidden = false; $('bigCap').textContent = pickId(texture) }
      section.querySelector('.grid')!.append(el)
      const card = { texture, canvas, el, visible: true }
      cards.push(card)
      visibility.observe(canvas)
    }
  }
  if (other.childElementCount > 1) $('families').append(other)
}

/** "use for" block buttons: make this option (its current mapping and timing, or variation v) the pick of a block;
 *  again to take it off. */
function useButtons(el: HTMLElement, texture: Texture, variation?: number) {
  const box = el.querySelector<HTMLElement>('.use')!
  const choice = choiceOf(texture, variation)
  box.innerHTML = 'use for ' + blocks().map((k, n) => {
    const on = JSON.stringify(blockPick[blockKey(k)]) === JSON.stringify(choice)
    return `<button data-k="${blockKey(k)}" class="${on ? 'on' : ''}" title="beats ${k[0]}–${k[1]}">${n + 1}</button>`
  }).join('')
  box.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.onclick = () => {
    const k = b.dataset.k!
    if (JSON.stringify(blockPick[k]) === JSON.stringify(choice)) delete blockPick[k]
    else blockPick[k] = choice
    save(); refresh()
  })
}

// the variations view: one option in all 8 variations, playing along
let varsTexture: Texture | null = null
let varCards: { canvas: HTMLCanvasElement; el: HTMLElement }[] = []
function openVariations(texture: Texture) {
  varsTexture = texture
  $('varsTitle').textContent = `${texture.name} · ${mappingOf(texture)} — 8 variations`
  $('varsGrid').innerHTML = ''
  varCards = VARIATIONS.map((v, n) => {
    const el = document.createElement('div')
    el.className = 'card'
    el.innerHTML = `<div class="top"><h2>v${n + 1}</h2><span><button class="add" title="Add this variation to the mix">＋ mix</button></span></div>
      <canvas></canvas><p>${v.name}</p><div class="use muted"></div>`
    el.querySelector<HTMLButtonElement>('.add')!.onclick = () => { mix.push(choiceOf(texture, n)); save(); refresh() }
    $('varsGrid').append(el)
    return { canvas: el.querySelector('canvas')!, el }
  })
  $('vars').hidden = false
  refresh()
}
$('varsClose').onclick = () => { $('vars').hidden = true; varsTexture = null; varCards = [] }

function renderBlocks() {
  $('blockList').innerHTML = blocks().map((k, n) => {
    const c = blockPick[blockKey(k)]
    const own = blockTrans[blockKey(k)]
    // a picked block (not at the section start and end both) picks the transition at its edges
    const trans = c && (k[0] > fromBeat || k[1] < toBeat)
      ? ` <select class="btrans" title="The transition into this block and out of it (out of it into a block with its own option: that block's)">` +
        `<option value="">↔ mix's (${TRANSITIONS.find(t => t.id === mixTransition)!.name})</option>` +
        TRANSITIONS.map(t => `<option value="${t.id}"${own === t.id ? ' selected' : ''}>↔ ${t.name}</option>`).join('') + '</select>'
      : ''
    return `<li data-k="${blockKey(k)}"><b>${n + 1}</b> · ${k[0]}–${k[1]}: ${c ? describeChoice(c) + trans + ' <button title="Back to the mix">✕</button>' : '<span class="muted">the mix</span>'}</li>`
  }).join('')
}
$('blockList').onchange = ev => {
  const sel = ev.target as HTMLSelectElement, li = sel.closest('li')
  if (!li || !sel.classList.contains('btrans')) return
  if (sel.value) blockTrans[li.dataset.k!] = sel.value as Transition
  else delete blockTrans[li.dataset.k!]
  save(); refresh()
}
$('blockList').onclick = ev => {
  const li = (ev.target as HTMLElement).closest('li')
  if ((ev.target as HTMLElement).closest('button') && li) { delete blockPick[li.dataset.k!]; save(); refresh() }
}

/** The section's inner sections, [from, to] beats, cut at its marks. */
function sections(): [number, number][] {
  const cuts = [fromBeat, ...marks.filter(m => m > fromBeat && m < toBeat), toBeat]
  return cuts.slice(0, -1).map((b, k) => [b, cuts[k + 1]] as [number, number])
}

/** Puts overlay `id` on in the inner sections where `on` is true, adjacent ones kept as one overlay (fewer effects
 *  on the rings). */
function setOverlay(id: string, on: boolean[], tint: string | undefined) {
  const secs = sections(), runs: Overlay[] = []
  on.forEach((x, k) => {
    if (!x) return
    const [a, b] = secs[k], last = runs[runs.length - 1]
    if (last && last.to === a) last.to = b
    else runs.push({ id, from: a, to: b, ...(tint ? { tint } : {}) })
  })
  for (const o of runs) { if (o.from === fromBeat) delete o.from; if (o.to === toBeat) delete o.to }
  shape = { ...shape, overlays: [...(shape.overlays ?? []).filter(o => o.id !== id), ...runs] }
}
/** Which inner sections overlay `id` is on in: those it covers the start of. */
const overlayOn = (id: string) => sections().map(([a]) =>
  (shape.overlays ?? []).some(o => o.id === id && (o.from ?? fromBeat) <= a && a < (o.to ?? toBeat)))

// --- the shape per inner section ------------------------------------------------------------------------------------

type PartKey = 'buildUp' | 'fadeOut' | 'peak' | 'pace' | 'base'
/** One part per inner section with the whole section's settings: build-up and peaks all through, the fade-out only
 *  in the last part (as the whole section's shape plays). */
const partsFromShape = (): ShapePart[] => sections().map(([from, to]) => ({
  from, to, buildUp: shape.buildUp, fadeOut: shape.fadeOut && to === toBeat, peak: shape.peak !== false,
  pace: shape.pace ?? PACE, base: shape.base ?? 0.45,
}))
/** The parts snapped to the current inner sections (each takes the settings of the part covering its start); none
 *  while there is a single section. */
function snapParts() {
  const secs = sections()
  if (secs.length < 2 || !shape.parts?.length) { if (shape.parts) { const { parts: _, ...rest } = shape; shape = rest } return }
  const old = shape.parts, whole = partsFromShape()
  shape = { ...shape, parts: secs.map(([from, to], k) => ({ ...whole[k], ...(old.find(o => o.from <= from && from < o.to) ?? {}), from, to })) }
}
/** Set one setting in every part (the whole-section controls); fade-out goes to the last part only. */
function setAllParts(k: PartKey, value: boolean | number) {
  if (!shape.parts) return
  shape = { ...shape, parts: shape.parts.map(p => ({ ...p, [k]: k === 'fadeOut' ? value && p.to === toBeat : value })) }
}
const PART_ROWS: { k: PartKey; name: string; title: string }[] = [
  { k: 'buildUp', name: 'build-up', title: 'brightness rising through the part (adjacent parts with build-up rise as one)' },
  { k: 'fadeOut', name: 'fade-out', title: 'fading to black over the last 2 bars of the part' },
  { k: 'peak', name: 'peak accent', title: 'a slight brightening into every peak' },
  { k: 'pace', name: 'slow → fast', title: 'slow → fast motion into every peak' },
  { k: 'base', name: 'base color', title: 'brightness of the rings\' base color' },
]
const BASES: [number, string][] = [[0.45, 'dim'], [0.7, 'medium'], [1, 'full']]
/** The shape per inner section: a row per setting, a checkbox (base color: a select) per inner section. */
function renderShapeParts() {
  const secs = sections()
  $('shapePartsRow').hidden = secs.length < 2
  if (secs.length < 2) return
  snapParts()
  const parts = shape.parts ?? partsFromShape()
  $('shapeParts').innerHTML = PART_ROWS.map(({ k, name, title }) => `<div class="ov-row" data-k="${k}"><span class="ov-name" title="${title}">${name}</span>` +
    parts.map((p, n) => k === 'base'
      ? `<label class="ov-sec" title="beats ${p.from}–${p.to}">${n + 1} <select data-n="${n}">${BASES.map(([v, label]) => `<option value="${v}"${(p.base ?? 0.45) === v ? ' selected' : ''}>${label}</option>`).join('')}</select></label>`
      : `<label class="ov-sec" title="beats ${p.from}–${p.to}"><input type="checkbox" data-n="${n}"${(k === 'pace' ? p.pace !== 0 : p[k]) ? ' checked' : ''}> ${n + 1} <span class="muted">${p.from}–${p.to}</span></label>`).join('') +
    '</div>').join('') +
    (shape.parts ? '<button id="shapePartsReset" title="Back to the whole section\'s shape">✕ same for all</button>' : '')
}
$('shapeParts').onchange = ev => {
  const el = ev.target as HTMLInputElement | HTMLSelectElement, row = el.closest<HTMLElement>('.ov-row')
  if (!row) return
  const k = row.dataset.k as PartKey, n = Number(el.dataset.n)
  const parts = (shape.parts ?? partsFromShape()).map(p => ({ ...p }))
  if (k === 'base') parts[n].base = Number(el.value)
  else if (k === 'pace') parts[n].pace = (el as HTMLInputElement).checked ? PACE : 0
  else parts[n][k] = (el as HTMLInputElement).checked
  shape = { ...shape, parts }
  save(); refresh()
}
$('shapeParts').onclick = ev => {
  if ((ev.target as HTMLElement).id !== 'shapePartsReset') return
  const { parts: _, ...rest } = shape
  shape = rest
  save(); refresh()
}

/** Overlay toggles: each overlay of this section's set, on or off per inner section, with one tint per overlay. */
function renderOverlays() {
  const secs = sections()
  // snap overlays saved with other edges (e.g. before the marks moved) to the sections
  for (const id of new Set((shape.overlays ?? []).map(o => o.id))) setOverlay(id, overlayOn(id), shape.overlays!.find(o => o.id === id)!.tint)
  $('overlays').innerHTML = ''
  for (const t of TEXTURES.filter(x => isOverlay(x) && inSet(x))) {
    const mine = (shape.overlays ?? []).filter(o => o.id === t.id)
    const on = overlayOn(t.id)
    const row = document.createElement('div')
    row.className = 'ov-row'
    // a tintable overlay picks its color: white, each ring's next / third palette color, or one palette color for all
    const tints = t.tintable
      ? [['white', '○ white'], ['next', '◐ each ring\'s next color'], ['third', '◑ each ring\'s third color'],
        ...palette().colors.map((c, n) => { const [r, g, b] = hsvRgb(c); return [String(n), `■ color ${n + 1}`, `rgb(${r | 0},${g | 0},${b | 0})`] })]
      : []
    row.innerHTML = `<span class="ov-name${mine.length ? ' on' : ''}" title="${t.description.replace(/"/g, '&quot;')}">${t.name}</span>` +
      secs.map(([a, b], k) => `<label class="ov-sec" title="beats ${a}–${b}"><input type="checkbox" data-k="${k}"${on[k] ? ' checked' : ''}>${secs.length > 1 ? ` ${k + 1} <span class="muted">${a}–${b}</span>` : ' on'}</label>`).join('') +
      (tints.length ? ` <select class="tint" title="Wash color">${tints.map(([v, name, css]) => `<option value="${v}"${css ? ` style="color:${css}"` : ''}>${name}</option>`).join('')}</select>` : '')
    const boxes = [...row.querySelectorAll<HTMLInputElement>('.ov-sec input')], tintSel = row.querySelector<HTMLSelectElement>('.tint')
    if (tintSel) {
      tintSel.value = mine[0]?.tint ?? 'white'
      if (tintSel.value === '') tintSel.value = 'white' // a palette color past the end of a smaller palette
      tintSel.style.color = tintSel.selectedOptions[0]?.style.color ?? ''
    }
    const update = () => {
      setOverlay(t.id, boxes.map(x => x.checked), tintSel && tintSel.value !== 'white' ? tintSel.value : undefined)
      save(); renderOverlays(); refresh()
    }
    for (const box of boxes) box.onchange = update
    if (tintSel) tintSel.onchange = () => { if (!boxes.some(x => x.checked)) boxes.forEach(x => (x.checked = true)); update() }
    $('overlays').append(row)
  }
  if (!$('overlays').childElementCount) $('overlays').innerHTML = '<span class="muted hint">none for this section</span>'
}

function renderMix() {
  $('mixList').innerHTML = mix.map((m, n) => `<li data-n="${n}">${describeChoice(m)}
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
const sectionSpec = (): SectionSpec => {
  const extras = (c: Choice) => ({ ...(c.timing ? { timing: c.timing } : {}), ...(c.palette ? { palette: c.palette } : {}) })
  const spec: SectionSpec = { palette: paletteId, mix: mix.map(m => ({ texture: m.id, mapping: m.mapping, ...extras(m) })), barsEach: mixBars, transition: mixTransition, shape: { ...shape }, shuffleColors }
  const picked = pickedBlocks()
  if (picked.length) spec.blocks = picked.map(([from, to]) => { const c = blockPick[`${from}-${to}`]; const tr = blockTrans[`${from}-${to}`]; return { from, to, texture: c.id, mapping: c.mapping, ...extras(c), ...(tr ? { transition: tr } : {}) } })
  return spec
}
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
  box.onchange = () => { shape = { ...shape, [k]: box.checked }; setAllParts(k, box.checked); save(); refresh() }
}
const paceBox = $<HTMLInputElement>('shapePace'), baseSel = $<HTMLSelectElement>('shapeBase')
paceBox.onchange = () => { shape = { ...shape, pace: paceBox.checked ? undefined : 0 }; setAllParts('pace', paceBox.checked ? PACE : 0); save(); refresh() }
baseSel.onchange = () => { shape = { ...shape, base: Number(baseSel.value) }; setAllParts('base', Number(baseSel.value)); save(); refresh() }
const speedSel = $<HTMLSelectElement>('speedAll'), hitSel = $<HTMLSelectElement>('hitAll'), layoutSel = $<HTMLSelectElement>('blockLayout')
speedSel.innerHTML = SPEEDS.map(x => `<option value="${x.id}">${x.name}</option>`).join('')
hitSel.innerHTML = HITS.map(x => `<option value="${x.id}">${x.name}</option>`).join('')
speedSel.onchange = () => { speedAll = speedSel.value as Speed; save(); refresh() }
hitSel.onchange = () => { hitAll = hitSel.value as Hit; save(); refresh() }
layoutSel.onchange = () => { blockLayout = layoutSel.value as BlockLayout; save(); refresh() }

function refresh() {
  for (const { texture, el } of cards) {
    el.classList.toggle('starred', picks.includes(pickId(texture)))
    const own = cardTiming[texture.id] ?? {}
    el.querySelector<HTMLSelectElement>('.spd')!.value = own.speed ?? ''
    el.querySelector<HTMLSelectElement>('.hit')!.value = own.hit ?? ''
    el.querySelector<HTMLSelectElement>('.var')!.value = String(own.variation ?? 0)
    el.querySelector<HTMLSelectElement>('.pal-own')!.value = cardPalette[texture.id] ?? ''
    el.querySelector<HTMLElement>('.timing .sw')!.outerHTML = swatches(PALETTES.find(x => x.id === cardPalette[texture.id]) ?? palette())
    useButtons(el, texture)
  }
  if (varsTexture) varCards.forEach(({ el }, n) => useButtons(el, varsTexture!, n))
  speedSel.value = speedAll
  hitSel.value = hitAll
  layoutSel.value = blockLayout
  renderBlocks()
  const lines = [...picks]
  if (mix.length) lines.push(`MIX (${palette().name}, every ${mixBars} bars, ${TRANSITIONS.find(t => t.id === mixTransition)!.name.toLowerCase()}): ` +
    mix.map(describeChoice).join(' → '))
  const picked = pickedBlocks()
  if (picked.length) lines.push('BLOCKS: ' + picked.map(k => `${k[0]}–${k[1]} ${describeChoice(blockPick[blockKey(k)])}${blockTrans[blockKey(k)] ? ` (${TRANSITIONS.find(t => t.id === blockTrans[blockKey(k)])!.name.toLowerCase()})` : ''}`).join(' · '))
  $('picks').innerHTML = lines.map(p => `<li>${p}</li>`).join('') || '<li class="muted">none yet</li>'
  if (bigTexture) $('bigCap').textContent = pickId(bigTexture)
  bars.value = String(mixBars)
  $<HTMLInputElement>('mixShuffle').checked = shuffleColors
  trans.value = mixTransition
  $<HTMLInputElement>('shapeBuildUp').checked = shape.buildUp
  $<HTMLInputElement>('shapeFadeOut').checked = shape.fadeOut
  $<HTMLInputElement>('shapePeak').checked = shape.peak !== false
  peakSel.value = String(shape.peakOffset ?? 0)
  paceBox.checked = shape.pace !== 0
  baseSel.value = String(shape.base ?? 0.45)
  renderShapeParts()
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
  $('songBeat').textContent = String(fromBeat + Math.floor(beatInSection))
  $('beatOf').textContent = ` · ${Math.floor(beatInSection) + 1} / ${toBeat - fromBeat}`
  const beat = Math.floor(beatInSection) % BEATS_PER_BAR
  $('beats').querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', i === beat))
  for (const { texture, canvas, visible } of cards) if (visible) drawRings(canvas, cardSequence(texture), t)
  if (bigTexture) drawRings($<HTMLCanvasElement>('bigCanvas'), cardSequence(bigTexture), t)
  if (varsTexture) varCards.forEach(({ canvas }, n) => drawRings(canvas, cardSequence(varsTexture!, n), t))
  const beatNow = fromBeat + beatInSection
  $('blockList').querySelectorAll('li').forEach(li => { const [a, b] = li.dataset.k!.split('-').map(Number); li.classList.toggle('now', beatNow >= a && beatNow < b) })
  drawRings($<HTMLCanvasElement>('mixCanvas'), mixSequence(), t)
  const inBlock = pickedBlocks().find(([a, b]) => beatNow >= a && beatNow < b)
  if (inBlock) {
    $('mixNow').textContent = `now: block ${inBlock[0]}–${inBlock[1]} · ${describeChoice(blockPick[blockKey(inBlock)])}`
    $('mixList').querySelectorAll('li').forEach(li => li.classList.remove('now'))
  } else if (mix.length) {
    const n = Math.floor(beatInSection / (mixBars * BEATS_PER_BAR))
    const cur = mix[n % mix.length]
    $('mixNow').textContent = `now: ${describeChoice(cur)}`
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
  load()
  save()
  history.replaceState(null, '', `?song=${encodeURIComponent(songName)}&name=${encodeURIComponent(sectionName)}${marker ? '' : `&from=${fromBeat}&to=${toBeat}`}` +
    (params.has('set') ? `&set=${encodeURIComponent(optionSet)}` : '') + (marks.length ? `&marks=${marks.join(',')}` : ''))
  beatMs = 60000 / s.bpm
  offsetMs = s.startOffsetMs ?? 0
  pausedAt = startMs()
  $('songName').textContent = s.name
  $('sectionName').textContent = sectionName
  const nBars = (toBeat - fromBeat) / BEATS_PER_BAR
  $('sectionRange').textContent = `beats ${fromBeat}–${toBeat} · ${nBars} bars` + (marks.length ? ` · changes at ${marks.join(', ')}` : '')
  $('barOf').textContent = ` / ${nBars}`
  peakSel.innerHTML = [0, 1, 2, 3].map(o => { const first = fromBeat + (o === 0 ? BEATS_PER_BAR : o); return `<option value="${o}">${first}, ${first + BEATS_PER_BAR}, …</option>` }).join('')
  peakSel.value = String(shape.peakOffset ?? 0)
  const url = await audioUrl(s.audioFilePath ?? `${songName}.wav`)
  if (url) { audio.src = url; hasAudio = true; $('audioState').textContent = 'loops the section with the music' }
  else $('audioState').innerHTML = '<span class="warn">audio not found — plays without music</span>'
  renderPalettes()
  renderCards()
  renderOverlays()
  refresh()
  requestAnimationFrame(frame)
}

init()
