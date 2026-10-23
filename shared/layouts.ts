// Layout catalog (see docs/layout.md): every way to split the pixels into 1-4 groups, how each resolves per d1
// ring into a base group plus at most one split (see docs/coloring-layer.md), and ranking by balance / clustering.
import segmentsData from '../ui/src/segments.json'

// --- float functions, in the proto's JSON shape, evaluated like kivsee-render does --------------------------

export type FloatFn =
  | { const_value: { value: number } }
  | { linear: { start: number; end: number } }
  | { repeat: { numberOfTimes: number; funcToRepeat: FloatFn } }
  | { half: { f1: FloatFn; f2: FloatFn } }

export const K = (value: number): FloatFn => ({ const_value: { value } })
export const LINEAR = (start: number, end: number): FloatFn => ({ linear: { start, end } })
export const REPEAT = (n: number, f: FloatFn): FloatFn => ({ repeat: { numberOfTimes: n, funcToRepeat: f } })
export const HALF = (f1: FloatFn, f2: FloatFn): FloatFn => ({ half: { f1, f2 } })

export function evalFn(fn: FloatFn, x: number): number {
  if ('const_value' in fn) return fn.const_value.value
  if ('linear' in fn) return fn.linear.start + x * (fn.linear.end - fn.linear.start)
  if ('repeat' in fn) return evalFn(fn.repeat.funcToRepeat, (x * fn.repeat.numberOfTimes) % 1)
  return x < 0.5 ? evalFn(fn.half.f1, x * 2) : evalFn(fn.half.f2, (x - 0.5) * 2)
}

export function fnText(fn: FloatFn): string {
  if ('const_value' in fn) return String(+fn.const_value.value.toFixed(4))
  if ('linear' in fn) return `linear(${+fn.linear.start.toFixed(4)}, ${+fn.linear.end.toFixed(4)})`
  if ('repeat' in fn) return `repeat(${fn.repeat.numberOfTimes}, ${fnText(fn.repeat.funcToRepeat)})`
  return `half(${fnText(fn.half.f1)}, ${fnText(fn.half.f2)})`
}

/**
 * Replace a group function's leaves: 0 (base group) -> a, 1 (other group) -> b. Turns it into an overlay. A leaf
 * can be a value or a function; a `linear` leaf makes a gradient across just that group's part, because half and
 * repeat hand each part its own 0-1 input.
 */
export function mapLeaves(fn: FloatFn, a: number | FloatFn, b: number | FloatFn): FloatFn {
  if ('const_value' in fn) {
    const leaf = fn.const_value.value === 0 ? a : b
    return typeof leaf === 'number' ? K(leaf) : leaf
  }
  if ('linear' in fn) return fn
  if ('repeat' in fn) return REPEAT(fn.repeat.numberOfTimes, mapLeaves(fn.repeat.funcToRepeat, a, b))
  return HALF(mapLeaves(fn.half.f1, a, b), mapLeaves(fn.half.f2, a, b))
}

// --- segments: relPos of every physical pixel index 0-143, from segments.json (NaN = not in the segment) ----

const REL: Record<string, Float32Array> = {}
for (const seg of segmentsData.segments) {
  const arr = new Float32Array(144).fill(NaN)
  for (const p of seg.pixels) arr[p.index] = p.relPos
  REL[seg.name] = arr
}
export const relPos = (seg: string, index: number) => REL[seg][index]
/** Highest relPos in a segment (arc only reaches 6/7), so a gradient along it can end exactly on its last value. */
export const maxRelPos = (seg: string) => Math.max(...[...REL[seg]].filter(v => !Number.isNaN(v)))
/** Segments a whole-ring hue range can run along. */
export const GRADIENT_SEGMENTS = ['all', 'arc', 'centric', 'updown', 'ind', 'rad']

// --- options ------------------------------------------------------------------------------------------------

export type Level = 'most' | 'mid' | 'least'

interface D2Option { id: string; title: string; groups: number; level: Level; cluster: number; group: (r: number) => number }
interface D1Option { id: string; title: string; seg: string; fn: FloatFn; level: Level; cluster: number }

const H = HALF(K(0), K(1))
const INNER_OUTER = HALF(HALF(K(0), K(1)), HALF(K(1), K(0)))
// Uneven: B (value 1) is the accent at the start of each period, A takes the rest.
const ONE_OF_3 = REPEAT(4, HALF(HALF(K(1), K(0)), K(0)))
const ONE_OF_4 = REPEAT(3, HALF(HALF(K(1), K(0)), K(0)))

// Clustering score 0-1, scale aware: d2 splits 0.6-1, small-ring splits 0.3-0.55, pixel splits 0-0.25.
const d2Score = (k: number) => ({ 1: 0.6, 2: 0.8, 3: 1 } as Record<number, number>)[k]
const ringsWord = (k: number) => `${k} ring${k > 1 ? 's' : ''}`
const inSquare = (r: number) => r % 3 === 1
const inTriangle = (r: number) => (r - 1) % 4 === 0

const D2: D2Option[] = [
  ...[2, 3, 4].flatMap(G => [1, 2, 3].filter(k => 12 % (k * G) === 0).map(k => ({
    id: `alt${k}x${G}`, title: `alternate ${ringsWord(k)}`, groups: G, level: 'most' as Level, cluster: d2Score(k),
    group: (r: number) => Math.floor((r - 1) / k) % G,
  }))),
  ...[[3, 1], [3, 2], [4, 1], [4, 3]].map(([P, k]) => ({
    id: `alt${k}p${P}`, title: `alternate ${ringsWord(k)}, ${P === 3 ? 'A A B' : 'A A A B'}`, groups: 2,
    level: (P === 3 ? 'mid' : 'least') as Level, cluster: d2Score(k),
    group: (r: number) => (Math.floor((r - 1) / k) % P === P - 1 ? 1 : 0),
  })),
  { id: 'square', title: 'square + rest', groups: 2, level: 'mid', cluster: 0.6, group: r => (inSquare(r) ? 1 : 0) },
  { id: 'squarePairs', title: 'square + split pairs', groups: 3, level: 'most', cluster: 0.6, group: r => (r - 1) % 3 },
  { id: 'squareAxis', title: 'square + axis pairs', groups: 3, level: 'most', cluster: 0.8,
    group: r => (inSquare(r) ? 0 : [2, 3, 8, 9].includes(r) ? 1 : 2) },
  { id: 'triangle', title: 'triangle + rest', groups: 2, level: 'least', cluster: 0.6, group: r => (inTriangle(r) ? 1 : 0) },
]

const D1: D1Option[] = [
  { id: 'alt1', title: 'alternate 1', seg: 'ind', fn: REPEAT(6, H), level: 'most', cluster: 0.3 },
  { id: 'alt2', title: 'alternate 2', seg: 'ind', fn: REPEAT(3, H), level: 'most', cluster: 0.4 },
  { id: 'alt3', title: 'alternate 3', seg: 'ind', fn: REPEAT(2, H), level: 'most', cluster: 0.5 },
  { id: 'd1Sides', title: 'd1 half: sides', seg: 'ind', fn: H, level: 'most', cluster: 0.55 },
  { id: 'd1InnerOuter', title: 'd1 half: inner / outer', seg: 'ind', fn: INNER_OUTER, level: 'most', cluster: 0.55 },
  { id: 'd1Square', title: 'square + rest', seg: 'ind', fn: ONE_OF_3, level: 'mid', cluster: 0.3 },
  { id: 'd1Triangle', title: 'triangle + rest', seg: 'ind', fn: ONE_OF_4, level: 'least', cluster: 0.3 },
  { id: 'd0InnerOuter', title: 'half d0: inner / outer', seg: 'centric', fn: INNER_OUTER, level: 'most', cluster: 0.25 },
  { id: 'batch1', title: 'd0 batch 1', seg: 'centric', fn: REPEAT(6, H), level: 'most', cluster: 0.05 },
  { id: 'batch2', title: 'd0 batch 2', seg: 'centric', fn: REPEAT(3, H), level: 'most', cluster: 0.1 },
  { id: 'batch3', title: 'd0 batch 3', seg: 'centric', fn: REPEAT(2, H), level: 'most', cluster: 0.15 },
  { id: 'batch4', title: 'd0 batch 4', seg: 'centric', fn: REPEAT(1.5, H), level: 'mid', cluster: 0.2 },
  { id: 'batch6', title: 'd0 batch 6', seg: 'centric', fn: H, level: 'most', cluster: 0.25 },
  { id: 'oneOf3', title: 'd0 1 of 3', seg: 'centric', fn: ONE_OF_3, level: 'mid', cluster: 0.05 },
  { id: 'oneOf4', title: 'd0 1 of 4', seg: 'centric', fn: ONE_OF_4, level: 'least', cluster: 0.05 },
  { id: 'rand', title: 'random, balanced', seg: 'rand', fn: H, level: 'most', cluster: 0 },
  { id: 'randMid', title: 'random, mid', seg: 'rand', fn: HALF(K(0), HALF(HALF(K(0), K(1)), K(1))), level: 'mid', cluster: 0 },
  { id: 'randLeast', title: 'random, least', seg: 'rand', fn: HALF(K(0), HALF(K(0), K(1))), level: 'least', cluster: 0 },
  { id: 'arcHalf', title: 'arc half', seg: 'arc', fn: H, level: 'most', cluster: 0.25 },
  { id: 'arcStripes', title: 'arc stripes', seg: 'arc', fn: REPEAT(2, H), level: 'most', cluster: 0.1 },
  { id: 'dirHalf', title: 'same direction half', seg: 'updown', fn: H, level: 'most', cluster: 0.25 },
  { id: 'dirQuarters', title: 'same direction quarters', seg: 'updown', fn: REPEAT(2, H), level: 'most', cluster: 0.15 },
]

// --- layouts ------------------------------------------------------------------------------------------------

/** One d1 ring: its base group, and optionally another group placed where `fn` (on `seg`) is 1. */
export interface RingPlan { base: number; other?: number; seg?: string; fn?: FloatFn }

export type Category = 'same' | 'd2' | 'd1' | 'combo' | 'custom'

export interface Layout {
  id: string
  title: string
  category: Category
  groups: number
  level: Level
  /** Clustering: one score, or the d2 and d1 scores of a combined layout. */
  cluster?: number
  s2?: number
  s1?: number
  /** Plan for d1 ring r (1-12). */
  ring: (r: number) => RingPlan
  /** Pixels per group, of all 1728. */
  counts: number[]
}

export function groupAt(plan: RingPlan, i: number, p: number): number {
  if (plan.other === undefined || !plan.fn || !plan.seg) return plan.base
  return evalFn(plan.fn, relPos(plan.seg, i * 12 + p)) >= 0.5 ? plan.other : plan.base
}

function countGroups(G: number, ring: (r: number) => RingPlan): number[] {
  const counts = new Array(G).fill(0)
  for (let r = 1; r <= 12; r++) {
    const plan = ring(r)
    for (let i = 0; i < 12; i++) for (let p = 0; p < 12; p++) counts[groupAt(plan, i, p)]++
  }
  return counts
}

/** Balance from group sizes: smallest share / largest share, as one of three levels. */
export function balanceLevel(counts: number[]): Level {
  const b = Math.min(...counts) / Math.max(...counts)
  return b >= 0.75 ? 'most' : b >= 0.4 ? 'mid' : 'least'
}

function buildLayouts(): Layout[] {
  const out: Layout[] = []
  const add = (l: Omit<Layout, 'counts'>) => {
    const counts = countGroups(l.groups, l.ring)
    if (Math.min(...counts) === 0) return
    out.push({ ...l, counts })
  }
  add({ id: 'same', title: 'same: whole scene one group', category: 'same', groups: 1, level: 'most', ring: () => ({ base: 0 }) })
  for (const d2 of D2) {
    add({ id: `d2:${d2.id}`, title: d2.title, category: 'd2', groups: d2.groups, level: d2.level, cluster: d2.cluster,
      ring: r => ({ base: d2.group(r) }) })
  }
  for (const d1 of D1) {
    add({ id: `d1:${d1.id}`, title: d1.title, category: 'd1', groups: 2, level: d1.level, cluster: d1.cluster,
      ring: () => ({ base: 0, other: 1, seg: d1.seg, fn: d1.fn }) })
  }
  // Combined: a 2-group d2 layout splits the rings into X (group 0) and Y, and a d1 layout splits them further.
  const kinds: { kind: string; groups: number; x: [number, number?]; y: [number, number?] }[] = [
    { kind: 'checker', groups: 2, x: [0, 1], y: [1, 0] },
    { kind: 'accent in X', groups: 2, x: [0, 1], y: [0] },
    { kind: '3 groups', groups: 3, x: [0, 1], y: [2] },
    { kind: '4 groups', groups: 4, x: [0, 1], y: [2, 3] },
  ]
  for (const d2 of D2.filter(o => o.groups === 2)) {
    for (const d1 of D1) {
      for (const k of kinds) {
        const plan = ([base, other]: [number, number?]): RingPlan =>
          other === undefined ? { base } : { base, other, seg: d1.seg, fn: d1.fn }
        let ring = (r: number) => plan(d2.group(r) === 0 ? k.x : k.y)
        let counts = countGroups(k.groups, ring)
        if (Math.min(...counts) === 0) continue
        // With 2 groups A is always the larger one.
        if (k.groups === 2 && counts[1] > counts[0]) {
          const f = ring
          ring = r => { const p = f(r); return { ...p, base: 1 - p.base, other: p.other === undefined ? undefined : 1 - p.other } }
          counts = [counts[1], counts[0]]
        }
        out.push({
          id: `combo:${d2.id}+${d1.id}:${k.kind}`, title: `${d2.title} + ${d1.title} (${k.kind})`, category: 'combo',
          groups: k.groups, level: balanceLevel(counts), s2: d2.cluster, s1: d1.cluster, ring, counts,
        })
      }
    }
  }
  return out
}

export const LAYOUTS = buildLayouts()

/**
 * A layout built by hand instead of picked from the catalog: the base group of each d1 ring, and for some base
 * groups a split into another group with a d1 layout (by its id, without the "d1:" prefix).
 */
export interface CustomSpec {
  title: string
  /** Base group of d1 rings 1-12 (index 0 is ring 1). */
  base: number[]
  splits: { group: number; other: number; d1: string }[]
}

export function customLayout(spec: CustomSpec): Layout {
  const ring = (r: number): RingPlan => {
    const base = spec.base[r - 1]
    const split = spec.splits.find(s => s.group === base)
    const d1 = split && D1.find(o => o.id === split.d1)
    return d1 ? { base, other: split!.other, seg: d1.seg, fn: d1.fn } : { base }
  }
  const groups = 1 + Math.max(...spec.base, ...spec.splits.map(s => s.other))
  const counts = countGroups(groups, ring)
  return { id: 'custom', title: spec.title, category: 'custom', groups, level: balanceLevel(counts), ring, counts }
}
export const layoutById = (id: string) => LAYOUTS.find(l => l.id === id)

// --- ranking ------------------------------------------------------------------------------------------------

export const levelOf = (balance: number): Level => (balance >= 2 / 3 ? 'most' : balance >= 1 / 3 ? 'mid' : 'least')

/** Combined layouts: each level has its own target, and a high clustering weights the d2 match more. */
function comboCost(c: number, s2: number, s1: number) {
  const t2 = 0.6 + 0.4 * c, t1 = 0.5 * c
  const w2 = 0.25 + 0.5 * c, w1 = 1 - w2
  return w2 * Math.abs(t2 - s2) + w1 * Math.abs(t1 - s1)
}
export function clusterDistance(l: Layout, c: number) {
  if (l.category === 'combo') return comboCost(c, l.s2!, l.s1!)
  if (l.cluster === undefined) return 0
  return Math.abs(l.cluster - c)
}

export const SHOWN: Record<Category, number> = { same: 1, d2: 4, d1: 6, combo: 4, custom: 0 }

/** Layouts for these parameters: the closest few of each category, closest first. */
export function candidates(groups: number, balance: number, clustering: number): Layout[] {
  const level = levelOf(balance)
  const fit = LAYOUTS.filter(l => l.groups === groups && (l.category === 'same' || l.level === level))
  const out: Layout[] = []
  for (const cat of ['same', 'd2', 'd1', 'combo'] as Category[]) {
    out.push(...fit.filter(l => l.category === cat)
      .sort((a, b) => clusterDistance(a, clustering) - clusterDistance(b, clustering))
      .slice(0, SHOWN[cat]))
  }
  return out
}

/** The single best layout for these parameters (the closest one over all categories). */
export function bestLayout(groups: number, balance: number, clustering: number): Layout | undefined {
  return candidates(groups, balance, clustering)
    .sort((a, b) => clusterDistance(a, clustering) - clusterDistance(b, clustering))[0]
}
