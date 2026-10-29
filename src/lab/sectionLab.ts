// Shared by the Section Lab page (ui/src/lab) and the song runtime (src/lab/labSection.ts), so a section placed
// in a song is built by exactly the code the lab previews. Keep it to ES2016 APIs: the runtime compiles to es2016.

export interface HSV { hue: number; sat: number; val: number }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FloatFn = Record<string, any>
export interface EffectConfig { segments: string; start_time: number; end_time: number; repeat_num?: number; repeat_start?: number; repeat_end?: number }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EffectJson = { effect_config: EffectConfig } & Record<string, any>
export interface ThingSequence { effects: EffectJson[]; duration_ms: number; num_repeats: number }
export type Sequence = Record<string, ThingSequence>

// Section Lab options, built directly in the renderer's format so the lab shows exactly what the rings draw.
//
// A section is a shared SHAPE (dim palette base, a build-up, an accent on every bar, a fade-out at the end) with
// TEXTURES on top. Textures only add light, color or white to the base and every one takes an `amount`, so two
// textures can cross-fade on the real rings: the amount scales their factors with comb2, which the renderer
// evaluates like any other function. Time-varying parts are written against absolute beats, so a texture can be
// cut into any whole-beat spans (for a transition) and continue seamlessly.

export interface Palette { id: string; name: string; source: string; colors: HSV[] }
export interface LabContext {
  fromBeat: number; toBeat: number; beatMs: number; offsetMs: number; palette: Palette
  /** a beat where a rise peaks: the slow-to-fast pace runs from peak to peak (default: the section start) */
  paceAnchor?: number
  /** how much snake heads speed up into each peak (0 = steady motion; default PACE) */
  pace?: number
  /** the speed, hit timing and variation the texture is built at (default: medium, on the beat, original) */
  timing?: Timing
  /** a tintable texture's color (see Tint) */
  tint?: Tint
  /** the colors a palette-color tint ('0', '1', …) picks from (default the palette) */
  tintColors?: HSV[]
}
/** The color a tintable overlay washes toward: white, each ring's next or third palette color, or palette color n
 *  ('0', '1', …) on every ring. */
export type Tint = 'white' | 'next' | 'third' | string

// --- speed, hit timing and variations (after the Option Gallery on main, shemesh-gallery-options.ts) -------------

export type Speed = 'slow' | 'medium' | 'fast'
export type Hit = 'beat' | 'offbeat' | 'twice' | 'two' | 'none'
/** How an option is played: its speed, when its beat-level hits fall, and which variation. */
export interface Timing { speed?: Speed; hit?: Hit; variation?: number }
/** Every cycle (turns, waves, bar patterns) takes `factor` times as long. */
export const SPEEDS: { id: Speed; name: string; factor: number }[] = [
  { id: 'slow', name: 'slow', factor: 2 }, { id: 'medium', name: 'medium', factor: 1 }, { id: 'fast', name: 'fast', factor: 0.5 },
]
/** The beat-level hits (cycles of a beat or less, steps, events of a beat or less) are `scale` beats apart, and the
 *  whole option is shifted `off` beats late. 'none' leaves the option's flashes and flicks of a beat or less out (to
 *  let something else carry the rhythm, e.g. a vocal). */
export const HITS: { id: Hit; name: string; scale: number; off: number }[] = [
  { id: 'beat', name: 'on the beat', scale: 1, off: 0 },
  { id: 'offbeat', name: 'off-beat', scale: 1, off: 0.5 },
  { id: 'twice', name: 'twice a beat', scale: 0.5, off: 0 },
  { id: 'two', name: 'every 2 beats', scale: 2, off: 0 },
  { id: 'none', name: 'no beat hits', scale: 1, off: 0 },
]
/** The same option turned the other way, moved round the installation, mirrored, phased differently across the
 *  rings, its colors nudged round the wheel. */
export const VARIATIONS: { name: string; dir?: number; rot?: number; mirror?: boolean; spread?: number; hue?: number }[] = [
  { name: 'original' },
  { name: 'turning back, colors a little on', dir: -1, hue: 0.03 },
  { name: 'rotated a quarter round', rot: 3, hue: 0.06 },
  { name: 'mirrored, colors a little back', mirror: true, hue: -0.03 },
  { name: 'rings phased the other way', spread: -1, hue: 0.05 },
  { name: 'from the opposite side', rot: 6, hue: 0.1 },
  { name: 'double twist across the rings', spread: 2, hue: -0.05 },
  { name: 'turning back, mirrored', dir: -1, mirror: true, hue: 0.08 },
]
function resolveTiming(t?: Timing) {
  const v = VARIATIONS[t?.variation ?? 0] ?? VARIATIONS[0]
  const hit = HITS.find(h => h.id === (t?.hit ?? 'beat')) ?? HITS[0]
  const speed = SPEEDS.find(s => s.id === (t?.speed ?? 'medium')) ?? SPEEDS[1]
  return { speed: speed.factor, hit: hit.scale, off: hit.off, hits: hit.id !== 'none', dir: v.dir ?? 1, rot: v.rot ?? 0, mirror: !!v.mirror, spread: v.spread ?? 1, hue: v.hue ?? 0 }
}
/** "fast, off-beat, v3" — the parts that differ from the defaults. */
export function timingLabel(t?: Timing): string {
  const parts: string[] = []
  if (t?.speed && t.speed !== 'medium') parts.push(t.speed)
  if (t?.hit && t.hit !== 'beat') parts.push(HITS.find(h => h.id === t.hit)!.name)
  if (t?.variation) parts.push(`v${t.variation + 1}`)
  return parts.join(', ')
}

/** One texture over one span of whole beats, at a constant amount, for one ring. */
export interface TexCtx {
  /** the ring's palette color, the next one and the one after it; i is its place clockwise from the top (0-11) as
   *  the variation sees it, ring the big ring at that place, x/y where it sits (-1..1, y down); tint the color a
   *  tintable texture goes toward (null = white) */
  ctx: LabContext; i: number; ring: number; x: number; y: number; c: HSV; next: HSV; third: HSV; tint: HSV | null; mapping: string
  from: number; to: number; amount: number
  /** the timing's factors: beats per cycle-level step (speed: 0.5 fast … 2 slow) and per beat-level hit; hits false
   *  when the option plays without beat hits (cycle() then leaves out events of a beat or less) */
  speed: number; hit: number; hits: boolean
  /** an effect over the span (or a part of it) */
  fx: (seg: string, body: Record<string, unknown>, opts?: { from?: number; to?: number; every?: number; window?: [number, number] }) => EffectJson
  /** scale an increase / hue factor, or a decrease factor, by the amount */
  inc: (f: FloatFn) => FloatFn
  dec: (f: FloatFn) => FloatFn
  /** a cyclic snake head that turns once every `every` beats, continuous across spans */
  head: (every: number, phase?: number, reverse?: boolean) => FloatFn
  /** sin over absolute time with a period in beats, continuous across spans */
  sinWave: (min: number, max: number, periodBeats: number, phase?: number) => FloatFn
  /** call fn for every beat of the span, with the beat's position in its bar (0-3) and a context for just that beat */
  perBeat: (fn: (beat: number, k: number, beatCtx: TexCtx) => EffectJson[]) => EffectJson[]
  /** steady sin over absolute time (no bar pacing), continuous across spans */
  wave: (min: number, max: number, periodBeats: number, phase?: number) => FloatFn
  /** effects whose cyclic snake head jumps one step on every hit, a full turn every `beatsPerTurn` beats; `bodyOf`
   *  makes the effect body from the head (up to 3 effects: a held step before the first hit and after the last) */
  stepped: (seg: string, beatsPerTurn: number, phase: number, bodyOf: (head: FloatFn) => Record<string, unknown>) => EffectJson[]
  /** effects of a non-cyclic snake on the small rings (ind), lighting `rings` of them (the head's and the ones behind
   *  it), stepping one small ring every beat (scaled by the speed, turning with the variation's direction) from small
   *  ring `start` at the option's start; split where it wraps from the last small ring to the first. (A cyclic snake
   *  can't do this: ind puts the first small ring at 0 and the last at 1, the same point for a cyclic head.) */
  smallRingSteps: (start: number, rings: number, bodyOf: (head: FloatFn, tail: FloatFn) => Record<string, unknown>) => EffectJson[]
  /** body active from beat `on` for `length` beats of every `period`-beat cycle counted from the section start
   *  (one repeating effect, two when the span starts inside the active part) */
  cycle: (seg: string, period: number, on: number, length: number, body: Record<string, unknown>) => EffectJson[]
}
export interface Texture {
  id: string; name: string; family: string; inspiration: string; description: string
  /** which section's option set it belongs to (default 'starry') */
  set?: string
  /** takes a Tint (white or a palette color), chosen where it is used as an overlay */
  tintable?: boolean
  mappings: string[]
  build: (t: TexCtx) => EffectJson[]
}

const hsv = (hue: number, sat: number, val: number): HSV => ({ hue, sat, val })

export const PALETTES: Palette[] = [
  { id: 'rebuild', name: 'Echo of 144', source: 'the 144–224 section this one mirrors musically (Cool II B1 + B2 blue)',
    colors: [hsv(0.5, 0.85, 1), hsv(0.63, 0.95, 0.95), hsv(0.84, 1, 0.95), hsv(0.556, 1, 1)] },
  { id: 'before', name: 'Loop night', source: 'the section before (272–324)',
    colors: [hsv(0.743, 0.717, 0.62), hsv(0.493, 0.717, 0.62), hsv(0.997, 0.717, 0.62)] },
  { id: 'loop-finale', name: 'Loop finale', source: 'the loop song from 1049: violet snakes, orange flashes, coral, lavender ending',
    colors: [hsv(0.743, 0.717, 0.62), hsv(0.077, 1, 0.81), hsv(0.041, 0.605, 0.78), hsv(0.752, 0.656, 0.97)] },
  { id: 'loop-steps', name: 'Loop steps', source: 'the loop song 1371–1433: coral stepped a quarter hue turn at a time',
    colors: [hsv(0.041, 0.605, 0.78), hsv(0.291, 0.605, 0.78), hsv(0.541, 0.605, 0.78), hsv(0.791, 0.605, 0.78)] },
  { id: 'after', name: 'Chase I', source: 'the Chase as it is (280–328): magenta split with cyan, gold B1 snake',
    colors: [hsv(0.86, 1, 1), hsv(0.49, 1, 1), hsv(0.149, 1, 1)] },
  { id: 'chase2', name: 'Chase II', source: 'the Chase from 328: cyan split with gold, pink B1 snake',
    colors: [hsv(0.49, 1, 1), hsv(0.12, 1, 1), hsv(0.92, 1, 1)] },
  { id: 'chase-both', name: 'Chase I + II', source: 'all five Chase colors: magenta, cyan, gold, pink, orange',
    colors: [hsv(0.86, 1, 1), hsv(0.49, 1, 1), hsv(0.149, 1, 1), hsv(0.92, 1, 1), hsv(0.07, 1, 1)] },
  { id: 'neon', name: 'Neon', source: 'electric: hot pink, electric blue, violet, mint',
    colors: [hsv(0.93, 1, 1), hsv(0.62, 1, 1), hsv(0.78, 1, 1), hsv(0.44, 0.9, 1)] },
  { id: 'sunset', name: 'Sunset', source: 'warm: pink, orange, gold with a violet counterpoint',
    colors: [hsv(0.95, 1, 1), hsv(0.06, 1, 1), hsv(0.13, 1, 1), hsv(0.8, 1, 0.9)] },
  { id: 'ice-fire', name: 'Ice and fire', source: 'two opposites: cyan and blue against orange',
    colors: [hsv(0.5, 1, 1), hsv(0.07, 1, 1), hsv(0.62, 1, 1)] },
  { id: 'into-finale', name: 'Into the Finale', source: 'the section after (Finale, 392): magenta arc, violet, pink',
    colors: [hsv(0.86, 1, 1), hsv(0.75, 1, 1), hsv(0.92, 0.85, 1)] },
  { id: 'from-starry', name: 'From the stars', source: 'the section before (Echo of 144 blues) meeting the Chase magenta',
    colors: [hsv(0.5, 0.9, 1), hsv(0.63, 1, 1), hsv(0.86, 1, 1)] },
  { id: 'bridge', name: 'Bridge', source: 'violet from before, magenta from after, cyan shared by both',
    colors: [hsv(0.743, 0.8, 0.8), hsv(0.86, 0.9, 0.9), hsv(0.493, 0.8, 0.8)] },
  { id: 'night', name: 'Night sky', source: 'neutral starry: indigo and deep blue with cyan',
    colors: [hsv(0.68, 0.85, 0.5), hsv(0.62, 0.95, 0.45), hsv(0.52, 0.7, 0.75)] },
  { id: 'finale-bloom', name: 'Finale bloom', source: 'Into the Finale with an orange spark and a cyan counterpoint, for the drop',
    colors: [hsv(0.86, 1, 1), hsv(0.75, 1, 1), hsv(0.06, 1, 1), hsv(0.5, 1, 1)] },
  { id: 'dusk', name: 'Dusk', source: 'the breakdown: violet and rose over deep blue',
    colors: [hsv(0.75, 0.9, 0.9), hsv(0.95, 0.75, 0.9), hsv(0.64, 1, 0.85)] },
]

// rings clockwise from the top, and an irregular color layout over them (no two neighbours alike)
const ORDER = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const LAYOUT = [0, 1, 2, 0, 2, 1, 0, 1, 2, 1, 0, 3]
/** beats per bar (4/4; inequal is 100 BPM since 2026-10-28, its timeline used to count at 150) */
export const BAR = 4
/** Pace within each bar (the music rises in each bar): snake heads move at (1 ± PACE)x their average speed, slowest
 *  mid-bar and fastest PEAK_U bars before each peak, covering the same distance per bar. */
export const PACE = 0.5
const PEAK_U = -0.125
/** the bar-paced clock that sinWave follows: (1 - PACE)·u + PACE·(1 - cos(πu/2)) of the bar's progress u */
const warp = (u: number) => (1 - PACE) * u + PACE * (1 - Math.cos((Math.PI * u) / 2))

// --- functions -------------------------------------------------------------------------------------------------------

const cnst = (value: number): FloatFn => ({ const_value: { value } })
const lin = (start: number, end: number): FloatFn => ({ linear: { start, end } })
const half = (f1: FloatFn, f2: FloatFn): FloatFn => ({ half: { f1, f2 } })
const win = (start: number, end: number, func: FloatFn, outside = 0): FloatFn =>
  ({ fixed_window: { start, end, outside_value: outside, func } })
const comb = (f1: FloatFn, a1: number, f2: FloatFn, a2: number): FloatFn => ({ comb2: { f1, amount1: a1, f2, amount2: a2 } })
/** Shortest hue step from a to b. */
const hueStep = (a: number, b: number) => ((((b - a) % 1) + 1.5) % 1) - 0.5
const r4 = (x: number) => Math.round(x * 1e4) / 1e4
/** positions and phases keep 6 decimals so a texture cut into spans lines up with the uncut one */
const r6 = (x: number) => Math.round(x * 1e6) / 1e6

function effect(ctx: LabContext, segments: string, from: number, to: number, body: Record<string, unknown>,
  every?: number, window?: [number, number]): EffectJson {
  const effect_config: EffectJson['effect_config'] = {
    segments,
    start_time: Math.round(ctx.offsetMs + from * ctx.beatMs),
    end_time: Math.round(ctx.offsetMs + to * ctx.beatMs),
  }
  if (every) {
    effect_config.repeat_num = (to - from) / every
    effect_config.repeat_start = window?.[0] ?? 0
    effect_config.repeat_end = window?.[1] ?? 1
  }
  return { effect_config, ...body } as EffectJson
}

function texCtx(ctx: LabContext, i: number, c: HSV, next: HSV, mapping: string, from: number, to: number, amount: number): TexCtx {
  const tm = resolveTiming(ctx.timing)
  // the option's own clock starts `off` beats after the section (off-beat timing)
  const S = ctx.fromBeat + tm.off
  const A = (ctx.paceAnchor ?? ctx.fromBeat) + tm.off
  const pace = ctx.pace ?? PACE
  const cols = ctx.palette.colors
  const third = cols[(cols.indexOf(next) + 1) % cols.length] ?? next
  // the ring's place as the variation sees it: phased across the rings by `spread`, rotated, mirrored
  let vi = (((i * tm.spread + tm.rot) % 12) + 12) % 12
  if (tm.mirror) vi = (12 - vi) % 12
  const ring = ORDER[vi], angle = ((ring + 0.5) * Math.PI) / 6
  const tintCols = ctx.tintColors ?? cols
  const tint = !ctx.tint || ctx.tint === 'white' ? null : ctx.tint === 'next' ? next : ctx.tint === 'third' ? third : tintCols[Number(ctx.tint) % tintCols.length] ?? null
  return {
    ctx, i: vi, ring, x: r4(Math.sin(angle)), y: r4(-Math.cos(angle)), c, next, third, tint, mapping, from, to, amount, speed: tm.speed, hit: tm.hit, hits: tm.hits,
    fx: (seg, body, o = {}) => effect(ctx, seg, o.from ?? from, o.to ?? to, body, o.every, o.window),
    inc: f => (amount >= 1 ? f : comb(f, amount, cnst(0), 1)),
    dec: f => (amount >= 1 ? f : comb(f, amount, cnst(1), r4(1 - amount))),
    head: (turn, phase = 0, back = false) => {
      const every = turn * tm.speed, reverse = back !== tm.dir < 0
      // heads stay positive (the renderer wraps negative cyclic heads differently): forward heads start one whole turn
      // in, reversed heads count down from a whole number past the section's length
      const top = Math.ceil((ctx.toBeat - S) / every) + 2
      // smooth pace over any span: speed (1 + PACE·cos(2π(u - PEAK_U))) / every, u = bars from the anchor, so motion is
      // slowest mid-bar and fastest just before each peak; the speed-up part is a sin, so one effect spans many bars
      const a = phase + (from - S) / every, b = phase + (to - S) / every
      const amp = r6((BAR / every) * pace / (2 * Math.PI))
      if (amp === 0) return reverse ? lin(r6(top - a), r6(top - b)) : lin(r6(1 + a), r6(1 + b))
      const p0 = (from - A) / BAR - PEAK_U
      const ease: FloatFn = { sin: { min: -amp, max: amp, phase: r6(((p0 % 1) + 1) % 1), repeats: r6((to - from) / BAR) } }
      return reverse
        ? comb(lin(r6(top - a), r6(top - b)), 1, ease, -1)
        : comb(lin(r6(1 + a), r6(1 + b)), 1, ease, 1)
    },
    sinWave: (min, max, periodBeats, phase = 0) => {
      const paced = (x: number) => { const bar = Math.floor((x - A) / BAR + 1e-9); return A - S + bar * BAR + BAR * warp((x - A) / BAR - bar) }
      const a = phase + paced(from) / periodBeats, b = phase + paced(Math.min(to, A + (Math.floor((from - A) / BAR + 1e-9) + 1) * BAR - 1e-9)) / periodBeats
      return { sin: { min, max, phase: r6(a), repeats: r6(b - a) } }
    },
    perBeat: fn => {
      const out: EffectJson[] = []
      for (let b = from; b < to; b++)
        out.push(...fn(b, (((b - S) % BAR) + BAR) % BAR, texCtx(ctx, i, c, next, mapping, b, b + 1, amount)))
      return out
    },
    wave: (min, max, periodBeats, phase = 0) => {
      const period = periodBeats * tm.speed
      const p0 = phase + (from - S) / period
      return { sin: { min, max, phase: r6(((p0 % 1) + 1) % 1), repeats: r6((to - from) / period) } }
    },
    stepped: (seg, beatsPerTurn, phase, bodyOf) => {
      // a step every `h` beats from the option's clock; step k's head is base + dir·k·h/turn
      const h = tm.hit, turn = beatsPerTurn * tm.speed
      const base = tm.dir > 0 ? 1 + phase : Math.ceil((ctx.toBeat - S) / turn) + 2 + phase
      const headAt = (k: number) => r6(base + (tm.dir * k * h) / turn)
      const k0 = Math.ceil((from - S) / h - 1e-9), first = S + k0 * h
      const n = Math.max(0, Math.floor((to - first) / h + 1e-9)), last = first + n * h
      const out: EffectJson[] = []
      if (first > from + 1e-9) out.push(effect(ctx, seg, from, Math.min(first, to), bodyOf(cnst(headAt(k0 - 1)))))
      if (n > 0) out.push(effect(ctx, seg, first, last, bodyOf({ steps: { num_steps: n, diff_per_step: r6((tm.dir * h) / turn), first_step_value: headAt(k0) } })))
      if (n > 0 && last < to - 1e-9) out.push(effect(ctx, seg, last, to, bodyOf(cnst(headAt(k0 + n)))))
      return out
    },
    smallRingSteps: (start, rings, bodyOf) => {
      const h = tm.speed, dir = tm.dir
      const ringAt = (k: number) => ((((start + dir * k) % 12) + 12) % 12)
      // small ring r sits at r/11 on ind; a head a hair past it with a tail just short of the next one back
      const head = (r: number) => r6(r / 11 + 0.01), tail = cnst(r6((rings - 1) / 11 + 0.02))
      const out: EffectJson[] = []
      let a = from, k = Math.floor((from - S) / h + 1e-9)
      while (a < to - 1e-9) {
        const stepEnd = Math.min(to, S + (k + 1) * h)
        if (a > S + k * h + 1e-9) {
          // the span starts inside step k: hold it
          out.push(effect(ctx, 'ind', a, stepEnd, bodyOf(cnst(head(ringAt(k))), tail)))
          a = stepEnd; k++
          continue
        }
        // whole steps from k up to the wrap (or the span's end), then whatever is left of a step is held next round
        const r = ringAt(k), run = dir > 0 ? 12 - r : r + 1
        const n = Math.min(run, Math.floor((to - a) / h + 1e-9))
        if (n === 0) { out.push(effect(ctx, 'ind', a, to, bodyOf(cnst(head(r)), tail))); break }
        const b = r6(a + n * h)
        out.push(effect(ctx, 'ind', a, b, bodyOf(n === 1 ? cnst(head(r)) : { steps: { num_steps: n, diff_per_step: r6(dir / 11), first_step_value: head(r) } }, tail)))
        a = b; k += n
      }
      return out
    },
    cycle: (seg, periodBeats, onBeat, lengthBeats, body) => {
      if (!tm.hits && lengthBeats <= 1) return []
      // beat-level cycles and events follow the hit timing, longer ones the speed
      const k = periodBeats <= 1 ? tm.hit : tm.speed
      const period = periodBeats * k, on = onBeat * k
      const length = Math.min(period, lengthBeats * (lengthBeats <= 1 ? tm.hit : k))
      // where the span starts inside the cycle, and the active part relative to that
      const p = (((from - S) % period) + period) % period
      const s = (((on - p) % period) + period) % period
      const part = (a: number, z: number) => effect(ctx, seg, from, to, body, period, [r6(a / period), r6(z / period)])
      return s + length <= period + 1e-9 ? [part(s, s + length)] : [part(s, period), part(0, s + length - period)]
    },
  }
}

// --- textures ----------------------------------------------------------------------------------------------------------

/** White-ish twinkles: a short snake over the mapping, brightening and desaturating toward its head. */
function stars(t: TexCtx, seg: string, every: number, phase: number, tail: number, amount = 1, white = 0.25): EffectJson[] {
  const head = t.head(every, phase)
  return [
    t.fx(seg, { snake_brightness: { head, tail_length: cnst(tail), cyclic: true, mult_factor_increase: t.inc(lin(0, amount)) } }),
    t.fx(seg, { snake_saturation: { head, tail_length: cnst(tail), cyclic: true, mult_factor_decrease: t.dec(lin(1, white)) } }),
  ]
}
const ph = (i: number, k: number) => (i * k) % 1
/** Dim the whole ring to `level` (scaled by the amount), so a pattern can light parts of it back up on a full base. */
const dimAll = (t: TexCtx, level: number) => t.fx('all', { timed_brightness: { mult_factor_decrease: t.dec(cnst(level)) } })
/** Hue offset from the ring's color to another palette color (the short way round). */
const toward = (t: TexCtx, target: HSV) => r4(hueStep(t.c.hue, target.hue))
/** The right half of the big circle (ring 12 at the top, clockwise). */
const RIGHT_HALF = [12, 1, 2, 3, 4, 5]
/** Big-ring group patterns: a cycle of n beats, `on(t, k)` whether the ring is lit on beat k of it. */
const RING_GROUPS: { id: string; name: string; desc: string; n: number; overlay?: boolean; on: (t: TexCtx, k: number) => boolean }[] = [
  { id: 'three-chase', name: 'Three-ring chase', desc: '3 neighbouring rings lit, the group stepping a ring clockwise on every beat', n: 12, overlay: true,
    on: (t, k) => (k - t.i + 12) % 12 < 3 },
  { id: 'lr-pingpong', name: 'Left-right ping-pong', desc: 'a band of rings swinging from the left side to the right and back every 2 bars', n: 8, overlay: true,
    on: (t, k) => Math.abs(t.x + Math.cos((Math.PI * k) / 4)) < 0.5 },
  { id: 'tb-pingpong', name: 'Top-bottom ping-pong', desc: 'a band of rings swinging from the top to the bottom and back every 2 bars', n: 8,
    on: (t, k) => Math.abs(t.y + Math.cos((Math.PI * k) / 4)) < 0.5 },
  { id: 'opposite', name: 'Opposite pairs', desc: 'an opposite pair of rings lit, the next pair on every beat', n: 6, on: (t, k) => t.i % 6 === k },
  { id: 'squares', name: 'Squares turn', desc: 'every third ring lit, the next square on every beat', n: 3, on: (t, k) => t.i % 3 === k },
  { id: 'triangles', name: 'Triangles turn', desc: 'every fourth ring lit, the next triangle on every beat', n: 4, on: (t, k) => t.i % 4 === k },
  { id: 'halves', name: 'Halves swap', desc: 'the right half for 2 beats, then the left half', n: 4, on: (t, k) => (k < 2) === RIGHT_HALF.includes(t.ring) },
]

// --- Finale helpers: several mappings at once, and zones ------------------------------------------------------------

/** The mappings of a combined option ('ind × centric'): each of its snakes runs on one of them. */
const maps = (t: TexCtx) => t.mapping.split(' × ')
/** A part of the ring's pixels, as a window on one mapping: `w(inside, outside)` is `inside` on the zone. */
interface Zone { seg: string; w: (inside: FloatFn, outside: number) => FloatFn }
/** The low and high half of a mapping (inner/outer on rad, the two vertical halves on updown, a random half on rand). */
const halves = (seg: string): [Zone, Zone] => [
  { seg, w: (f, o) => win(0, 0.5, f, o) },
  { seg, w: (f, o) => win(0.5, 1.01, f, o) },
]
/** The odd small rings (small ring k sits at k/11 on ind). */
const ODD_SMALL: Zone = { seg: 'ind', w: (f, o) => rep(5.5, win(0.25, 0.75, f, o)) }
/** Clear a zone to a flat glow: whatever lit it before is gone, so what is drawn there next has it to itself. */
const clearZone = (t: TexCtx, z: Zone, level: number) => [
  t.fx(z.seg, { position_brightness: { mult_factor_decrease: t.dec(z.w(cnst(0), 1)) } }),
  t.fx(z.seg, { position_brightness: { mult_factor_increase: t.inc(z.w(cnst(level), 0)) } }),
]
/** Every third pixel (b1) cleared to a flat glow: the b1 pixels are a segment of their own, so timed effects on them
 *  play apart from the other two thirds (b2). */
const clearB1 = (t: TexCtx, level: number) => [
  t.fx('b1', { timed_brightness: { mult_factor_decrease: t.dec(cnst(0)) } }),
  t.fx('b1', { timed_brightness: { mult_factor_increase: t.inc(cnst(level)) } }),
]
/** The Finale's vocal phrase, found in the audio (center-channel harmonics, 300–3000 Hz, per phrase): 16 beats from
 *  408 to 504 (song beats) — a held C# from beat 0, a held F# from beat 4, then a falling C#–B–G# figure on beats 9,
 *  9.5 and 10, answered on 13, 13.5 and 14. Each note turns a few big rings' hue (`shift`, a third of the way round
 *  the color wheel: magenta goes cyan) and lets it glide back: 3 and 2 rings on the held notes' entrances, one per
 *  note of the figure (stepping clockwise, the answer back). The rings are placed from `a`, which alternates between
 *  two places phrase by phrase. */
const VOCAL = { from: 408, to: 504, phrase: 16, shift: -0.33, places: [0, 2] }
const VOCAL_NOTES: { at: number; len: number; held?: boolean; rings: (a: number) => number[] }[] = [
  { at: 0, len: 4, held: true, rings: a => [a, a + 4, a + 8] },
  { at: 4, len: 4, held: true, rings: a => [a + 1, a + 7] },
  { at: 9, len: 0.5, rings: a => [a + 2] },
  { at: 9.5, len: 0.5, rings: a => [a + 3] },
  { at: 10, len: 1, rings: a => [a + 4] },
  { at: 13, len: 0.5, rings: a => [a + 10] },
  { at: 13.5, len: 0.5, rings: a => [a + 9] },
  { at: 14, len: 1, rings: a => [a + 8] },
]
/** The vocal notes that light this ring and start in the span: [from, to, held], song beats. */
function vocalNotes(t: TexCtx): [number, number, boolean][] {
  const out: [number, number, boolean][] = []
  for (let p = VOCAL.from, n = 0; p < VOCAL.to; p += VOCAL.phrase, n++) {
    const a = VOCAL.places[n % VOCAL.places.length]
    for (const v of VOCAL_NOTES) {
      const from = p + v.at
      if (from < t.from || from >= t.to || !v.rings(a).some(r => r % 12 === t.i)) continue
      out.push([from, Math.min(from + v.len, t.to), !!v.held])
    }
  }
  return out
}
/** A vocal note on this ring: its hue jumps by VOCAL.shift and glides back over the note (a held note holds it for the
 *  first half), with a lift of `lift` (to `rest` by the end). */
const vocalNote = (t: TexCtx, [from, to, held]: [number, number, boolean], lift: number, rest: number) => {
  const s = VOCAL.shift
  return [
    t.fx('all', { timed_hue: { offset_factor: t.inc(held ? half(cnst(s), lin(s, 0)) : lin(s, 0)) } }, { from, to }),
    t.fx('all', { timed_brightness: { mult_factor_increase: t.inc(lin(lift, rest)) } }, { from, to }),
  ]
}
/** A white-tipped snake: brightness over the tail, saturation drained at the head. */
const whiteSnake = (t: TexCtx, seg: string, head: FloatFn, tail: number, lift: number, cyclic = true) => [
  t.fx(seg, { snake_brightness: { head, tail_length: cnst(tail), cyclic, mult_factor_increase: t.inc(lin(0, lift)) } }),
  t.fx(seg, { snake_saturation: { head, tail_length: cnst(r4(tail / 3)), cyclic, mult_factor_decrease: t.dec(lin(1, 0.25)) } }),
]

export const TEXTURES: Texture[] = [
  // stars
  { id: 'stars-fine', name: 'Fine stars', family: 'Stars', inspiration: '144–224 sparkle / Drift Sparkle',
    description: 'Sparse white twinkles drifting through the ring, one layer every bar and one every 2 bars.',
    mappings: ['rand', 'ind', 'centric'],
    build: t => [...stars(t, t.mapping, BAR, ph(t.i, 0.37), 0.05), ...stars(t, t.mapping, 2 * BAR, ph(t.i, 0.61) + 0.5, 0.04, 0.8)] },
  { id: 'stars-dense', name: 'Dense stars', family: 'Stars', inspiration: 'Shimmer Glitter',
    description: 'A thick field of twinkles, one pass per bar.',
    mappings: ['rand', 'ind', 'centric'],
    build: t => stars(t, t.mapping, BAR, ph(t.i, 0.43), 0.14) },
  { id: 'stars-shuffle', name: 'Beat-shuffled stars', family: 'Stars', inspiration: 'Rebuild flash steps',
    description: 'The star field jumps to new pixels on every beat instead of drifting.',
    mappings: ['rand', 'ind'],
    build: t => t.perBeat(b => {
      const head: FloatFn = cnst(r4((ph(t.i, 0.29) + (b - t.ctx.fromBeat) * 0.37) % 1))
      return [
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.12), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }, { from: b, to: b + 1 }),
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.12), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.3)) } }, { from: b, to: b + 1 }),
      ]
    }) },
  { id: 'stars-tinted', name: 'Tinted stars', family: 'Stars', inspiration: 'Shimmer Hue Chase',
    description: 'Twinkles take the next palette color instead of white.',
    mappings: ['rand', 'ind', 'centric'],
    build: t => {
      const head = t.head(BAR, ph(t.i, 0.53))
      return [
        t.fx(t.mapping, { snake_hue: { head, tail_length: cnst(0.09), cyclic: true, offset_factor: t.inc(cnst(r4(hueStep(t.c.hue, t.next.hue)))) } }),
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.09), cyclic: true, mult_factor_increase: t.inc(lin(0.2, 0.9)) } }),
      ]
    } },
  { id: 'stars-rain', name: 'Star rain', family: 'Stars', inspiration: 'Drift ripple, centric',
    description: 'Twinkles flowing through the ring in centric order, twice per bar.',
    mappings: ['centric', 'rad', 'updown'],
    build: t => stars(t, t.mapping, BAR / 2, ph(t.i, 0.17), 0.08, 0.9) },
  { id: 'stars-burst', name: 'Bar bursts', family: 'Stars', inspiration: '144 Step Flash',
    description: 'On each bar the star field bursts wide on the downbeat and thins out until the next bar.',
    mappings: ['rand', 'ind'],
    build: t => t.perBeat((_b, k, bt) => {
      const head = bt.head(BAR, ph(t.i, 0.37))
      const tail = cnst(r4(0.3 * Math.pow(0.6, k)))
      return [
        bt.fx(t.mapping, { snake_brightness: { head, tail_length: tail, cyclic: true, mult_factor_increase: bt.inc(lin(0, 1)) } }),
        bt.fx(t.mapping, { snake_saturation: { head, tail_length: tail, cyclic: true, mult_factor_decrease: bt.dec(lin(1, 0.3)) } }),
      ]
    }) },
  { id: 'glitter-white', name: 'White glitter', family: 'Stars', inspiration: 'Spin Flash / Chase Glint',
    description: 'Flecks of white over full color: the twinkles only drain saturation, so the ring keeps its brightness.',
    mappings: ['rand', 'ind'],
    build: t => {
      const head = t.head(2 * BAR, ph(t.i, 0.71))
      return [
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.1), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0)) } }),
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.1), cyclic: true, mult_factor_increase: t.inc(cnst(0.5)) } }),
      ]
    } },
  { id: 'b2-stars', name: 'B2 stars, B1 glow', family: 'Stars', inspiration: '144 B1/B2 split',
    description: 'B1 glows steadily brighter while the stars twinkle only on B2.',
    mappings: ['b2'],
    build: t => [
      t.fx('b1', { timed_brightness: { mult_factor_increase: t.inc(cnst(0.35)) } }),
      ...stars(t, 'b2', BAR, ph(t.i, 0.37), 0.1),
    ] },

  // streaks
  { id: 'shooting', name: 'Shooting stars', family: 'Streaks', inspiration: 'Chase Glint',
    description: 'A streak crosses each ring once per bar, on a different beat per ring.',
    mappings: ['arc', 'centric', 'rad', 'updown'],
    build: t => t.perBeat((b, k) => k !== (t.i * 5) % BAR ? [] : [
      t.fx(t.mapping, { snake_brightness: { head: lin(-0.1, 1.25), tail_length: cnst(0.3), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }, { from: b, to: b + 1 }),
      t.fx(t.mapping, { snake_saturation: { head: lin(-0.1, 1.25), tail_length: cnst(0.3), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.2)) } }, { from: b, to: b + 1 }),
    ]) },
  { id: 'meteor', name: 'Meteor shower', family: 'Streaks', inspiration: 'Spin Flash',
    description: 'Every ring streaks together on the downbeat of each bar, over a faint twinkle.',
    mappings: ['rad', 'centric', 'updown', 'arc'],
    build: t => [
      ...stars(t, 'rand', 2 * BAR, ph(t.i, 0.41), 0.04, 0.6),
      ...t.perBeat((b, k) => k !== 0 ? [] : [
        t.fx(t.mapping, { snake_brightness: { head: lin(-0.1, 1.3), tail_length: cnst(0.35), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }, { from: b, to: b + 1 }),
        t.fx(t.mapping, { snake_saturation: { head: lin(-0.1, 1.3), tail_length: cnst(0.35), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.3)) } }, { from: b, to: b + 1 }),
      ]),
    ] },
  { id: 'comet', name: 'Comet orbit', family: 'Streaks', inspiration: 'Drift Snake',
    description: 'A comet with a white head circles each ring once per bar, offset around the circle.',
    mappings: ['arc', 'centric'],
    build: t => {
      const head = t.head(BAR, t.i / 12)
      return [
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.08), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.2)) } }),
      ]
    } },
  { id: 'twin-comets', name: 'Twin comets', family: 'Streaks', inspiration: 'Spin Snake (top/bottom)',
    description: 'Two short comets circling in opposite directions, crossing twice per bar.',
    mappings: ['arc', 'centric'],
    build: t => [
      t.fx(t.mapping, { snake_brightness: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.15), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.9)) } }),
      t.fx(t.mapping, { snake_brightness: { head: t.head(BAR, t.i / 12, true), tail_length: cnst(0.15), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.9)) } }),
    ] },

  // windows
  { id: 'reveal', name: 'Reveal quarters', family: 'Windows', inspiration: 'shemesh position windows',
    description: 'Each bar the ring lights up a quarter more on every beat; alternate rings reveal from the other end.',
    mappings: ['centric', 'rad', 'arc', 'updown'],
    build: t => t.perBeat((b, k) => {
      const size = (k + 1) / BAR
      const w = t.i % 2 ? win(1 - size, 1, cnst(0.8)) : win(0, size, cnst(0.8))
      return [t.fx(t.mapping, { position_brightness: { mult_factor_increase: t.inc(w) } }, { from: b, to: b + 1 })]
    }) },
  { id: 'bloom', name: 'Center bloom', family: 'Windows', inspiration: 'shemesh windows on rad',
    description: 'Light grows out from the middle of the mapping, a step per beat, filling the ring by the end of each bar.',
    mappings: ['rad', 'updown', 'centric'],
    build: t => t.perBeat((b, k) => {
      const r = (k + 1) / (2 * BAR)
      return [t.fx(t.mapping, { position_brightness: { mult_factor_increase: t.inc(win(0.5 - r, 0.5 + r, cnst(0.8))) } }, { from: b, to: b + 1 })]
    }) },
  { id: 'beat-halves', name: 'Beat halves', family: 'Windows', inspiration: 'Shimmer Arc Halves',
    description: 'One half of each ring brightens on even beats, the other on odd beats.',
    mappings: ['updown', 'rad', 'arc'],
    build: t => t.perBeat(b => {
      const w = (b - t.ctx.fromBeat + t.i) % 2 ? win(0, 0.5, cnst(0.6)) : win(0.5, 1, cnst(0.6))
      return [t.fx(t.mapping, { position_brightness: { mult_factor_increase: t.inc(w) } }, { from: b, to: b + 1 })]
    }) },
  { id: 'ladder', name: 'Ladder steps', family: 'Windows', inspiration: 'Chase Ind Steps',
    description: 'Two bright blocks step a quarter of the ring on every beat, offset per ring.',
    mappings: ['ind', 'centric', 'arc'],
    build: t => t.perBeat((b, k) => {
      const base = ((t.i % BAR) + k) / BAR
      return [
        t.fx(t.mapping, { snake_brightness: { head: cnst(r4((base + 0.25) % 1)), tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(cnst(0.85)) } }, { from: b, to: b + 1 }),
        t.fx(t.mapping, { snake_brightness: { head: cnst(r4((base + 0.75) % 1)), tail_length: cnst(0.12), cyclic: true, mult_factor_increase: t.inc(cnst(0.5)) } }, { from: b, to: b + 1 }),
      ]
    }) },

  // pulses
  { id: 'circle-wave', name: 'Circle wave', family: 'Pulses', inspiration: '144 slow pulse',
    description: 'A glow wave travels around the circle once per bar.',
    mappings: ['all'],
    build: t => t.perBeat((_b, _k, bt) => [bt.fx('all', { timed_brightness: { mult_factor_increase: bt.inc(bt.sinWave(0, 0.6, BAR, t.i / 12)) } })]) },
  { id: 'heartbeat', name: 'Heartbeat', family: 'Pulses', inspiration: 'Rebuild flashes',
    description: 'A double pulse on the start of every bar (beat 1 and the half beat after).',
    mappings: ['all', 'b1', 'b2'],
    build: t => t.perBeat((b, k) => k !== 0 ? [] : [
      t.fx(t.mapping, { timed_brightness: { mult_factor_increase: t.inc(lin(0.7, 0)) } }, { from: b, to: b + 1, every: 0.5, window: [0, 0.7] }),
    ]) },
  { id: 'beat-ripple', name: 'Beat ripple', family: 'Pulses', inspiration: 'gallery: el_jaguar part 18',
    description: 'A ripple runs out through every ring on every beat.',
    mappings: ['centric', 'rad', 'arc'],
    build: t => t.perBeat(b => [
      t.fx(t.mapping, { snake_brightness: { head: lin(0, 1.2), tail_length: cnst(0.2), cyclic: false, mult_factor_increase: t.inc(lin(0, 0.7)) } }, { from: b, to: b + 1 }),
    ]) },
  { id: 'in-out', name: 'In and out', family: 'Pulses', inspiration: 'snakeInOut (Finale Arc)',
    description: 'A soft band breathes out and back once per bar.',
    mappings: ['rad', 'centric', 'updown'],
    build: t => t.perBeat((b, k) => {
      // out over the first half of the bar, back over the second
      const tri = (f: number) => 1 - Math.abs(2 * f - 1)
      const [a, z] = [tri(k / BAR), tri((k + 1) / BAR)]
      return [t.fx(t.mapping, { snake_brightness: { head: lin(a + 0.15, z + 0.15), tail_length: cnst(0.3), cyclic: false, mult_factor_increase: t.inc(cnst(0.7)) } }, { from: b, to: b + 1 })]
    }) },

  // color
  { id: 'color-band', name: 'Color band', family: 'Color', inspiration: 'Mix segments (272)',
    description: 'A band of the next palette color turns around each ring once per bar.',
    mappings: ['arc', 'centric'],
    build: t => [
      t.fx(t.mapping, { snake_hue: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.35), cyclic: true, offset_factor: t.inc(cnst(r4(hueStep(t.c.hue, t.next.hue)))) } }),
      ...stars(t, 'rand', 2 * BAR, ph(t.i, 0.29), 0.03, 0.6),
    ] },
  { id: 'split-glitter', name: 'Split + glitter', family: 'Color', inspiration: 'Chase Updown Split (420+)',
    description: 'Each ring split into its color and the next one, with fine glitter on top. A lead-in to Chase.',
    mappings: ['updown', 'rad', 'arc'],
    build: t => [
      t.fx(t.mapping, { position_hue: { offset_factor: t.inc(half(cnst(0), cnst(r4(hueStep(t.c.hue, t.next.hue))))) } }),
      ...stars(t, 'rand', BAR, ph(t.i, 0.37), 0.05, 0.9),
    ] },
  { id: 'galaxy', name: 'Galaxy arm', family: 'Color', inspiration: 'part 18 rotating snake + Drift',
    description: 'Colors blend into the next palette color along the mapping, with a bright arm turning once per bar.',
    mappings: ['centric', 'arc', 'rad'],
    build: t => [
      t.fx(t.mapping, { position_hue: { offset_factor: t.inc(lin(0, r4(hueStep(t.c.hue, t.next.hue)))) } }),
      t.fx(t.mapping, { snake_brightness: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.6), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.7)) } }),
      ...stars(t, 'rand', 2 * BAR, ph(t.i, 0.29), 0.03, 0.7),
    ] },
  { id: 'nebula', name: 'Nebula two-tone', family: 'Color', inspiration: 'Drift inner/outer split (252)',
    description: 'One half of each ring (along the mapping) in the next palette color, with a slow glow wave and stars.',
    mappings: ['rad', 'updown', 'centric'],
    build: t => [
      t.fx(t.mapping, { position_hue: { offset_factor: t.inc(win(0.5, 1, cnst(r4(hueStep(t.c.hue, t.next.hue))))) } }),
      ...t.perBeat((_b, _k, bt) => [bt.fx('all', { timed_brightness: { mult_factor_increase: bt.inc(bt.sinWave(0, 0.35, 2 * BAR, t.i / 12)) } })]),
      ...stars(t, 'rand', 2 * BAR, ph(t.i, 0.53), 0.04, 0.9),
    ] },

  // --- shapes. The mappings, measured on the ring geometry: centric = position around each small ring (the same
  // on all 12), ind = which small ring (a clock around the ring), arc = inner/outer band of the ring, rad = distance
  // from the installation's center (one picture across all rings), updown = vertical, 0-11 = one small ring each.

  // rosettes (centric)
  { id: 'rosette', name: 'Rosette petals', family: 'Rosettes · centric', inspiration: 'shemesh centric windows',
    description: 'Every small ring shows three petals that click round a step on each beat.',
    mappings: ['centric'],
    build: t => t.perBeat((b, _k, bt) => {
      const o = r6((((b - t.ctx.fromBeat) % BAR) / BAR + (t.i % 3) / 12) % 1)
      return [bt.fx('centric', { position_brightness: { mult_factor_increase: bt.inc(rep(3, winC(o, 0.45, cnst(0.85)))) } })]
    }) },
  { id: 'pinwheel', name: 'Pinwheel', family: 'Rosettes · centric', inspiration: 'shemesh ind/centric snakes',
    description: 'Two arms spin around every small ring at once, a turn per bar.',
    mappings: ['centric'],
    build: t => [
      t.fx('centric', { snake_brightness: { head: t.head(BAR, t.i / 24), tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.9)) } }),
      t.fx('centric', { snake_brightness: { head: t.head(BAR, t.i / 24 + 0.5), tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.55)) } }),
    ] },
  { id: 'rosette-two-tone', name: 'Two-tone rosettes', family: 'Rosettes · centric', inspiration: 'el_jaguar centric snake_hue',
    description: 'Half of every small ring takes the next palette color; the halves turn an eighth on each beat.',
    mappings: ['centric'],
    build: t => t.perBeat((b, _k, bt) => {
      const o = r6((((b - t.ctx.fromBeat) % (2 * BAR)) / (2 * BAR)) % 1)
      return [
        bt.fx('centric', { position_hue: { offset_factor: bt.inc(rep(2, winC(o, 0.5, cnst(r4(hueStep(t.c.hue, t.next.hue)))))) } }),
        bt.fx('centric', { position_brightness: { mult_factor_increase: bt.inc(rep(2, winC(o, 0.5, cnst(0.35)))) } }),
      ]
    }) },
  { id: 'orbit-dots', name: 'Orbit dots', family: 'Rosettes · centric', inspiration: 'Twin comets, small scale',
    description: 'Two white dots circle every small ring in opposite directions, crossing twice per half bar.',
    mappings: ['centric'],
    build: t => {
      const out: EffectJson[] = []
      for (const rev of [false, true]) {
        const head = t.head(BAR / 2, t.i / 12, rev)
        out.push(
          t.fx('centric', { snake_brightness: { head, tail_length: cnst(0.1), cyclic: true, mult_factor_increase: t.inc(lin(0.3, 1)) } }),
          t.fx('centric', { snake_saturation: { head, tail_length: cnst(0.1), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.2)) } }),
        )
      }
      return out
    } },
  { id: 'starburst', name: 'Starburst', family: 'Rosettes · centric', inspiration: '144 Step Flash, shaped',
    description: 'Four bright petals on every small ring flare on the downbeat and dim through the bar.',
    mappings: ['centric'],
    build: t => t.perBeat((_b, k, bt) => [
      bt.fx('centric', { position_brightness: { mult_factor_increase: bt.inc(rep(4, winC(0.4, 0.25, cnst(r4(0.95 * Math.pow(0.62, k)))))) } }),
    ]) },

  // clock (ind)
  { id: 'clock-hand', name: 'Clock hand', family: 'Clock · ind', inspiration: 'shemesh ind snakes',
    description: 'A bright hand of small rings sweeps around each ring once per bar, with a white tip.',
    mappings: ['ind'],
    build: t => {
      const head = t.head(BAR, t.i / 12)
      return [
        t.fx('ind', { snake_brightness: { head, tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx('ind', { snake_saturation: { head, tail_length: cnst(0.08), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.2)) } }),
      ]
    } },
  { id: 'clock-fill', name: 'Clock fill', family: 'Clock · ind', inspiration: 'shemesh ind windows',
    description: 'Small rings light up around each ring a quarter more on every beat, each ring starting at a different hour.',
    mappings: ['ind'],
    build: t => t.perBeat((_b, k, bt) => [
      bt.fx('ind', { position_brightness: { mult_factor_increase: bt.inc(winC((t.i % 4) / 4, (k + 1) / BAR, cnst(0.8))) } }),
    ]) },
  { id: 'checker', name: 'Checker', family: 'Clock · ind', inspiration: 'Shimmer Arc Halves',
    description: 'Every other small ring lights, swapping on each beat.',
    mappings: ['ind'],
    build: t => t.perBeat((b, _k, bt) => [
      bt.fx('ind', { position_brightness: { mult_factor_increase: bt.inc(rep(6, winC((b - t.ctx.fromBeat) % 2 ? 0.5 : 0, 0.5, cnst(0.7)))) } }),
    ]) },
  { id: 'spiral', name: 'Spiral', family: 'Clock · ind', inspiration: 'Drift snake phase across rings',
    description: 'A long glowing arm sweeps around each ring every 2 bars, a twelfth later on each ring, so the arms form a spiral across the installation.',
    mappings: ['ind'],
    build: t => [t.fx('ind', { snake_brightness: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(0.45), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.85)) } })] },

  // small rings (segments 0-11)
  { id: 'small-chase', name: 'Small-ring chase', family: 'Small rings · 0–11', inspiration: 'the 0–11 segments, one per small ring',
    description: 'Whole small rings light two at a time, stepping around the ring on every beat (all 12 per bar).',
    mappings: ['0–11'],
    build: t => t.perBeat((_b, k, bt) => [0, 1].map(j => bt.fx(String((k * 2 + j + t.i) % 12), { timed_brightness: { mult_factor_increase: bt.inc(lin(0.9, 0.4)) } }))) },
  { id: 'small-twinkle', name: 'Small-ring twinkle', family: 'Small rings · 0–11', inspiration: 'rand twinkles, whole small rings',
    description: 'Two whole small rings per ring flash and fade on every beat, at scattered places.',
    mappings: ['0–11'],
    build: t => t.perBeat((b, _k, bt) => {
      const n = b - t.ctx.fromBeat
      return [(t.i * 5 + n * 7) % 12, (t.i * 11 + n * 3 + 6) % 12].map(s =>
        bt.fx(String(s), { timed_brightness: { mult_factor_increase: bt.inc(lin(0.95, 0)) } }))
    }) },

  // halo (arc)
  { id: 'halo-pulse', name: 'Halo pulse', family: 'Halo · arc', inspiration: 'shemesh arc windows',
    description: 'The inner and outer bands of each ring glow in turn, swapping on every beat.',
    mappings: ['arc'],
    build: t => t.perBeat((_b, k, bt) => [bt.fx('arc', { position_brightness: { mult_factor_increase: bt.inc(k % 2 ? win(0.5, 1, cnst(0.75)) : win(0, 0.5, cnst(0.75))) } })]) },
  { id: 'halo-ripple', name: 'Halo ripple', family: 'Halo · arc', inspiration: 'jamaican_bam_bam arc snake',
    description: 'A ripple runs from the inner edge of each ring to the outer edge on every beat.',
    mappings: ['arc'],
    build: t => t.perBeat((_b, _k, bt) => [bt.fx('arc', { snake_brightness: { head: lin(0, 1.3), tail_length: cnst(0.35), cyclic: false, mult_factor_increase: bt.inc(lin(0, 0.75)) } })]) },

  // whole installation (rad)
  { id: 'horizon', name: 'Horizon', family: 'Whole installation · rad', inspiration: 'shemesh rad snakes',
    description: 'A thin white circle expands from the center across the whole installation once per bar.',
    mappings: ['rad'],
    build: t => {
      const head = t.head(BAR, 0)
      return [
        t.fx('rad', { snake_brightness: { head, tail_length: cnst(0.14), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx('rad', { snake_saturation: { head, tail_length: cnst(0.14), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.15)) } }),
      ]
    } },
  { id: 'rad-stripes', name: 'Rad stripes', family: 'Whole installation · rad', inspiration: 'shemesh rad windows (repeated)',
    description: 'Three concentric stripes across the installation, stepping inward on every beat.',
    mappings: ['rad'],
    build: t => t.perBeat((b, _k, bt) => {
      const o = r6(1 - (((b - t.ctx.fromBeat) % BAR) / BAR))
      return [bt.fx('rad', { position_brightness: { mult_factor_increase: bt.inc(rep(3, winC(o % 1, 0.3, cnst(0.75)))) } })]
    }) },
  { id: 'rad-tide', name: 'Inner/outer tide', family: 'Whole installation · rad', inspiration: 'Drift purple half (252)',
    description: 'The outer part of the installation takes the next palette color; the border moves outward each beat and resets every bar.',
    mappings: ['rad'],
    build: t => t.perBeat((_b, k, bt) => [
      bt.fx('rad', { position_hue: { offset_factor: bt.inc(win(r4(0.25 + 0.11 * k), 1, cnst(r4(hueStep(t.c.hue, t.next.hue))))) } }),
      bt.fx('rad', { position_brightness: { mult_factor_increase: bt.inc(win(r4(0.25 + 0.11 * k), r4(0.31 + 0.11 * k), cnst(0.8))) } }),
    ]) },

  // vertical (updown)
  { id: 'venetian', name: 'Venetian stripes', family: 'Vertical · updown', inspiration: 'jamaican_bam_bam updown',
    description: 'Four horizontal stripes per ring slide down a step on every beat.',
    mappings: ['updown'],
    build: t => t.perBeat((b, _k, bt) => [
      bt.fx('updown', { position_brightness: { mult_factor_increase: bt.inc(rep(4, winC((((b - t.ctx.fromBeat) % BAR) / BAR), 0.45, cnst(0.65)))) } }),
    ]) },
  { id: 'drip', name: 'Drips', family: 'Vertical · updown', inspiration: 'peter_the_wolf updown snakes',
    description: 'Short white drips fall down each ring twice per bar, at scattered heights.',
    mappings: ['updown'],
    build: t => stars(t, 'updown', BAR / 2, ph(t.i, 0.31), 0.1, 0.9, 0.2) },

  // ===== Chase (280–392): full color, driven by the beat. Most patterns dim the ring and light parts of it back up,
  // so they read on a full base; overlays are meant to be laid over any option (Shape.overlays).

  // split colors
  { id: 'chase-now', set: 'chase', name: 'Chase as it is', family: 'Chase · split colors', inspiration: 'the current 280–392 timeline',
    description: 'Today\'s Chase: each ring split top/bottom into its color and the next, mostly dark except a lit quarter stepping round the small rings, a third-color snake on B1, a glint every 3 beats, odd and even rings flashing on alternate half bars.',
    mappings: ['updown'],
    build: t => [
      t.fx('updown', { position_hue: { offset_factor: t.inc(half(cnst(0), cnst(toward(t, t.next)))) } }),
      t.fx('b1', { timed_hue: { offset_factor: t.inc(cnst(toward(t, t.third))) } }),
      // the Ind Steps snake masks everything but a quarter of the small rings, stepping each beat (12 per turn)
      dimAll(t, 0.12),
      ...t.stepped('ind', 12, 0, head => ({ snake_brightness: { head, tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(cnst(1)) } })),
      t.fx('b1', { timed_brightness: { mult_factor_decrease: t.dec(cnst(0.15)) } }),
      t.fx('b1', { snake_brightness: { head: t.head(BAR, 0.25), tail_length: cnst(0.15), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
      t.fx('all', { snake_brightness: { head: t.head(3, 0), tail_length: cnst(0.15), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
      ...t.cycle('all', BAR, t.i % 2 ? 0 : 2, 1, { timed_brightness: { mult_factor_increase: t.inc(lin(0.9, 0)) } }),
    ] },
  { id: 'split-swap', set: 'chase', name: 'Split swap', family: 'Chase · split colors', inspiration: 'Chase Updown Split',
    description: 'Each ring split into its color and the next; the halves swap colors every 2 beats.',
    mappings: ['updown', 'rad', 'arc', 'centric', 'ind'],
    build: t => {
      const d = toward(t, t.next)
      return [
        ...t.cycle(t.mapping, BAR, 0, 2, { position_hue: { offset_factor: t.inc(half(cnst(0), cnst(d))) } }),
        ...t.cycle(t.mapping, BAR, 2, 2, { position_hue: { offset_factor: t.inc(half(cnst(d), cnst(0))) } }),
      ]
    } },
  { id: 'split-spin', set: 'chase', name: 'Spinning split', family: 'Chase · split colors', inspiration: 'Chase split + Drift snake',
    description: 'Half of each ring in the next color, the half turning around once per bar, a twelfth later on each ring.',
    mappings: ['ind', 'centric', 'arc'],
    build: t => [t.fx(t.mapping, { snake_hue: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.5), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } })] },
  { id: 'tri-sector', set: 'chase', name: 'Three sectors', family: 'Chase · split colors', inspiration: 'Chase Ind Steps (12 steps)',
    description: 'Three color sectors per ring (its color, the next, the third) clicking round a twelfth on every beat.',
    mappings: ['ind', 'centric'],
    build: t => [
      ...t.stepped(t.mapping, 12, t.i / 12, head => ({ snake_hue: { head, tail_length: cnst(r4(1 / 3)), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } })),
      ...t.stepped(t.mapping, 12, t.i / 12 + 1 / 3, head => ({ snake_hue: { head, tail_length: cnst(r4(1 / 3)), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.third))) } })),
    ] },
  { id: 'ring-alternate', set: 'chase', name: 'Alternating rings', family: 'Chase · split colors', inspiration: 'Chase Beat Flash (odd/even)',
    description: 'Odd rings take the next color for a bar while even rings keep theirs, then they swap.',
    mappings: ['all'],
    build: t => [...t.cycle('all', 2 * BAR, (t.i % 2) * BAR, BAR, { timed_hue: { offset_factor: t.inc(cnst(toward(t, t.next))) } })] },
  { id: 'inside-out', set: 'chase', name: 'Inside / outside', family: 'Chase · split colors', inspiration: 'Drift inner/outer split (252)',
    description: 'The inner part of the installation in the next color; the border breathes out and in every 2 bars.',
    mappings: ['rad', 'updown', 'arc'],
    build: t => [t.fx(t.mapping, { snake_hue: { head: t.wave(0.3, 0.75, 2 * BAR, 0.75), tail_length: cnst(1), cyclic: false, offset_factor: t.inc(cnst(toward(t, t.next))) } })] },

  // color motion
  { id: 'color-wheel', set: 'chase', name: 'Color wheel', family: 'Chase · color motion', inspiration: 'shemesh hue snakes',
    description: 'A blend from the ring\'s color to the next and back, all the way round, turning once every 2 bars.',
    mappings: ['ind', 'centric', 'arc'],
    build: t => {
      const d = toward(t, t.next)
      return [t.fx(t.mapping, { snake_hue: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(1), cyclic: true, offset_factor: t.inc(half(lin(0, d), lin(d, 0))) } })]
    } },
  { id: 'color-kick', set: 'chase', name: 'Color kick', family: 'Chase · color motion', inspiration: 'Rebuild flash steps',
    description: 'On every beat the ring jumps to the next color and slides back before the next beat.',
    mappings: ['all', 'b1', 'b2'],
    build: t => [...t.cycle(t.mapping, 1, 0, 0.6, { timed_hue: { offset_factor: t.inc(lin(toward(t, t.next), 0)) } })] },
  { id: 'helix', set: 'chase', name: 'Double helix', family: 'Chase · color motion', inspiration: 'Spin Snake (top/bottom)',
    description: 'Two colored arms circle each ring in opposite directions, one in the next color, one in the third.',
    mappings: ['ind', 'centric', 'arc'],
    build: t => {
      const out: EffectJson[] = [dimAll(t, 0.35)]
      for (const [rev, target] of [[false, t.next], [true, t.third]] as [boolean, HSV][]) {
        const head = t.head(BAR, t.i / 12, rev)
        out.push(
          t.fx(t.mapping, { snake_hue: { head, tail_length: cnst(0.3), cyclic: true, offset_factor: t.inc(cnst(toward(t, target))) } }),
          t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0.2, 1)) } }),
        )
      }
      return out
    } },
  { id: 'confetti', set: 'chase', name: 'Confetti', family: 'Chase · color motion', inspiration: 'Shimmer Hue Chase',
    description: 'Scattered pixels in the next and third colors drifting through each ring.',
    mappings: ['rand', 'ind'],
    build: t => [
      t.fx(t.mapping, { snake_hue: { head: t.head(BAR, ph(t.i, 0.37)), tail_length: cnst(0.2), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
      t.fx(t.mapping, { snake_hue: { head: t.head(2 * BAR, ph(t.i, 0.61) + 0.5), tail_length: cnst(0.15), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.third))) } }),
    ] },

  // motion
  { id: 'step-chase', set: 'chase', name: 'Step chase', family: 'Chase · motion', inspiration: 'Chase Ind Steps',
    description: 'A lit quarter of the ring jumps a twelfth on every beat, a full turn every 3 bars; the rest stays dim.',
    mappings: ['ind', 'centric', 'arc'],
    build: t => [
      dimAll(t, 0.3),
      ...t.stepped(t.mapping, 12, t.i / 12, head => ({ snake_brightness: { head, tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(cnst(1)) } })),
    ] },
  { id: 'around', set: 'chase', name: 'Around the installation', family: 'Chase · motion', inspiration: 'Spiral, at ring scale',
    description: 'A flash runs around the big circle once per bar, ring after ring, over a dimmed base.',
    mappings: ['all'],
    build: t => [dimAll(t, 0.35), ...t.cycle('all', BAR, r4((t.i * BAR) / 12), 1, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } })] },
  { id: 'stadium', set: 'chase', name: 'Stadium wave', family: 'Chase · motion', inspiration: 'Circle wave, doubled',
    description: 'A fast wave runs around the big circle twice per bar.',
    mappings: ['all'],
    build: t => [dimAll(t, 0.4), ...t.cycle('all', 2, r4((t.i * 2) / 12), 0.6, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } })] },
  { id: 'ping-pong', set: 'chase', name: 'Ping-pong', family: 'Chase · motion', inspiration: 'snakeInOut (Finale Arc)',
    description: 'A bright band bounces between the inner and outer end of the mapping every 2 beats.',
    mappings: ['rad', 'updown', 'arc'],
    build: t => [
      dimAll(t, 0.25),
      t.fx(t.mapping, { snake_brightness: { head: t.wave(0.15, 1.05, 2, 0.75), tail_length: cnst(0.3), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
    ] },
  { id: 'scanner', set: 'chase', name: 'Scanner', family: 'Chase · motion', inspiration: 'peter_the_wolf updown snakes',
    description: 'A band with a white core sweeps up and down each ring once per bar.',
    mappings: ['updown', 'rad'],
    build: t => {
      const head = t.wave(0.05, 1.15, BAR, 0.75)
      return [
        dimAll(t, 0.25),
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.25), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.06), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.2)) } }),
      ]
    } },
  { id: 'triangle-spin', set: 'chase', name: 'Triangle spin', family: 'Chase · motion', inspiration: 'Small-ring chase',
    description: 'Three small rings a third of the way apart light in the next color and step round on every beat.',
    mappings: ['0–11'],
    // three snakes on the small rings, a third of the way apart, stepping a small ring every beat (scaled by the
    // speed), each small ring lit for a hit (two neighbours at once when the steps are faster than the hits); at the
    // start small rings ≡ -i (mod 4) are lit
    build: t => {
      const out: EffectJson[] = [dimAll(t, 0.25)]
      const rings = Math.max(1, Math.round(t.hit / t.speed)), hue = t.inc(cnst(toward(t, t.next))), lift = t.inc(cnst(0.7))
      for (let j = 0; j < 3; j++) {
        const start = (((-t.i % 4) + 4) % 4) + 4 * j
        out.push(...t.smallRingSteps(start, rings, (head, tail_length) => ({ snake_brightness: { head, tail_length, cyclic: false, mult_factor_increase: lift } })))
        out.push(...t.smallRingSteps(start, rings, (head, tail_length) => ({ snake_hue: { head, tail_length, cyclic: false, offset_factor: hue } })))
      }
      return out
    } },
  { id: 'petal-flicker', set: 'chase', name: 'Petal flicker', family: 'Chase · motion', inspiration: 'Rosette petals',
    description: 'Four petals on every small ring flick between two positions on every beat.',
    mappings: ['centric'],
    build: t => [
      dimAll(t, 0.3),
      ...t.cycle('centric', 2, 0, 1, { position_brightness: { mult_factor_increase: t.inc(rep(4, winC(0, 0.4, cnst(0.9)))) } }),
      ...t.cycle('centric', 2, 1, 1, { position_brightness: { mult_factor_increase: t.inc(rep(4, winC(0.5, 0.4, cnst(0.9)))) } }),
    ] },
  { id: 'ricochet', set: 'chase', name: 'Ricochet', family: 'Chase · motion', inspiration: 'Halo pulse',
    description: 'The two halves of the mapping trade colors on every beat, with a punch on each beat.',
    mappings: ['arc', 'updown', 'rad'],
    build: t => {
      const d = toward(t, t.next)
      return [
        ...t.cycle(t.mapping, 2, 0, 1, { position_hue: { offset_factor: t.inc(half(cnst(0), cnst(d))) } }),
        ...t.cycle(t.mapping, 2, 1, 1, { position_hue: { offset_factor: t.inc(half(cnst(d), cnst(0))) } }),
        ...t.cycle('all', 1, 0, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(lin(1, 0.55)) } }),
      ]
    } },

  // beat
  { id: 'bar-drop', set: 'chase', name: 'Bar drop', family: 'Chase · beat', inspiration: 'Rebuild flashes, inverted',
    description: 'The rings go dark through the last half beat of every bar and slam back on the downbeat.',
    mappings: ['all'],
    build: t => [...t.cycle('all', BAR, 3.5, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(lin(1, 0.1)) } })] },
  { id: 'offbeat', set: 'chase', name: 'Offbeat pump', family: 'Chase · beat', inspiration: 'Heartbeat',
    description: 'Brightness pumps on the off-beats: dim on every beat, full between them.',
    mappings: ['all'],
    build: t => [...t.cycle('all', 1, 0, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(lin(0.35, 1)) } })] },

  // ring groups: patterns at the scale of the big circle, from where the rings sit (after the Option Gallery's
  // beat patterns); one dims the rest, the overlay versions flash the group toward white over any option
  ...RING_GROUPS.map(g => ({
    id: `group-${g.id}`, set: 'chase', name: g.name, family: 'Chase · ring groups', inspiration: 'Option Gallery beat patterns (shemesh)',
    description: `${g.desc}; the other rings stay dim.`,
    mappings: ['all'],
    build: (t: TexCtx) => {
      const out: EffectJson[] = [dimAll(t, 0.12)]
      for (let k = 0; k < g.n; k++) if (g.on(t, k)) out.push(...t.cycle('all', g.n, k, 1, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0.8)) } }))
      return out
    },
  } as Texture)),
  ...RING_GROUPS.filter(g => g.overlay).map(g => ({
    id: `ov-group-${g.id}`, set: 'chase', name: `${g.name} flash`, family: 'Chase · overlays', inspiration: 'Option Gallery beat patterns (shemesh)',
    description: `${g.desc}, flashing toward white over whatever plays.`,
    mappings: ['all'],
    build: (t: TexCtx) => {
      const out: EffectJson[] = []
      for (let k = 0; k < g.n; k++) if (g.on(t, k)) out.push(
        ...t.cycle('all', g.n, k, 1, { timed_saturation: { mult_factor_decrease: t.dec(lin(0.3, 1)) } }),
        ...t.cycle('all', g.n, k, 1, { timed_brightness: { mult_factor_increase: t.inc(lin(0.8, 0)) } }))
      return out
    },
  } as Texture)),

  // overlays: lay these over any option with the lab's Overlays row
  { id: 'ov-alt-flash', set: 'chase', name: 'Odd/even flash', family: 'Chase · overlays', inspiration: 'Chase Beat Flash',
    description: 'Odd rings flash toward white on the downbeat, even rings on beat 3, fading over the beat.',
    mappings: ['all'],
    build: t => {
      const on = t.i % 2 ? 0 : 2
      return [
        ...t.cycle('all', BAR, on, 1, { timed_brightness: { mult_factor_increase: t.inc(lin(0.9, 0)) } }),
        ...t.cycle('all', BAR, on, 1, { timed_saturation: { mult_factor_decrease: t.dec(lin(0.35, 1)) } }),
      ]
    } },
  { id: 'ov-accent3', set: 'chase', name: 'Accent on the new sound', family: 'Chase · overlays', inspiration: 'the sound that joins at 312, 3 beats into every bar (315, 319, …)',
    description: 'A white-hot flash 3 beats into every bar, where the sound that joins at 312 hits.',
    mappings: ['all'],
    build: t => [
      ...t.cycle('all', BAR, 3, 1, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } }),
      ...t.cycle('all', BAR, 3, 1, { timed_saturation: { mult_factor_decrease: t.dec(lin(0.25, 1)) } }),
    ] },
  { id: 'ov-strobe', set: 'chase', name: 'White strobe', family: 'Chase · overlays', inspiration: 'Spin Flash',
    description: 'A short white flash on every beat.',
    mappings: ['all', 'b1', 'b2'],
    build: t => [
      ...t.cycle(t.mapping, 1, 0, 0.25, { timed_saturation: { mult_factor_decrease: t.dec(lin(0.1, 1)) } }),
      ...t.cycle(t.mapping, 1, 0, 0.25, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } }),
    ] },
  { id: 'ov-glint', set: 'chase', name: 'Glint', family: 'Chase · overlays', inspiration: 'Chase Glint',
    description: 'A white glint runs round every ring every 3 beats, across the bars.',
    mappings: ['all', 'ind', 'arc'],
    build: t => [
      t.fx(t.mapping, { snake_brightness: { head: t.head(3, 0), tail_length: cnst(0.15), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
      t.fx(t.mapping, { snake_saturation: { head: t.head(3, 0), tail_length: cnst(0.05), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.3)) } }),
    ] },
  { id: 'ov-glitter', set: 'chase', name: 'Glitter', family: 'Chase · overlays', inspiration: 'Chase Glint / White glitter',
    description: 'Flecks of white sparkling over the color.',
    mappings: ['rand', 'ind'],
    build: t => {
      const head = t.head(2 * BAR, ph(t.i, 0.71))
      return [
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.08), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0)) } }),
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.08), cyclic: true, mult_factor_increase: t.inc(cnst(0.6)) } }),
      ]
    } },
  { id: 'ov-bar-wash', set: 'chase', name: 'Bar wash', family: 'Chase · overlays', inspiration: 'Chase Saturation Steps',
    description: 'Every downbeat washes the rings toward white (or a palette color), the ring\'s own color coming back over the bar.',
    mappings: ['all'], tintable: true,
    build: t => t.tint
      // toward a color: the hue jumps to it on the downbeat and slides back over the bar
      ? [...t.cycle('all', BAR, 0, BAR, { timed_hue: { offset_factor: t.inc(lin(toward(t, t.tint), 0)) } })]
      : [...t.cycle('all', BAR, 0, BAR, { timed_saturation: { mult_factor_decrease: t.dec(lin(0.35, 1)) } })] },
  { id: 'ov-hue-drift', set: 'chase', name: 'Hue drift', family: 'Chase · overlays', inspiration: 'Finale Hue Sweep',
    description: 'All colors drift slowly round the color wheel over the section (a tenth of the wheel in all).',
    mappings: ['all'],
    build: t => {
      const S = t.ctx.fromBeat, len = t.ctx.toBeat - S
      return [t.fx('all', { timed_hue: { offset_factor: t.inc(lin(r4((0.1 * (t.from - S)) / len), r4((0.1 * (t.to - S)) / len))) } })]
    } },

  // ===== Finale (392–504): a color bed through the breakdown (392–408) and the rise, full color on the drop (440).
  // Snakes on several mappings at once, and zones: a window on one mapping clears part of the pixels so another
  // pattern plays there alone. Combined options name their mappings 'first × second'.

  // the vocal phrase (408–504): a guide showing only its events, and the overlay that plays them over the section
  { id: 'fin-vocal-guide', set: 'finale', name: 'Vocal guide', family: 'Finale · vocal', inspiration: 'the vocal phrase found in the audio (408–504)',
    description: 'Only the vocal notes, on black, to check them against the music: the held notes light 3 rings (408, 424, …) and then 2 (412, 428, …), the short notes of the falling figure one ring each (417, 417.5, 418 clockwise, answered on 421, 421.5, 422); each lit ring turns a third of the way round the color wheel and glides back. Two sets of rings, taking turns phrase by phrase. Dark before 408.',
    mappings: ['all'],
    build: t => [dimAll(t, 0), ...vocalNotes(t).reduce<EffectJson[]>((out, note) => out.concat(vocalNote(t, note, 1, note[2] ? 0.3 : 0.15)), [])] },

  // on the bed: color moving, little dimming
  { id: 'fin-orbit-tide', set: 'finale', name: 'Orbit and tide', family: 'Finale · bed', inspiration: 'Drift inner/outer split + Comet orbit',
    description: 'The next color washes in and out along the first mapping every 2 bars while a soft comet circles on the second.',
    mappings: ['rad × ind', 'updown × ind', 'arc × centric', 'rad × centric'],
    build: t => {
      const [m1, m2] = maps(t)
      return [
        t.fx(m1, { snake_hue: { head: t.wave(0.25, 0.85, 2 * BAR, 0.75), tail_length: cnst(1), cyclic: false, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
        dimAll(t, 0.7),
        t.fx(m2, { snake_brightness: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(0.35), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.7)) } }),
      ]
    } },
  { id: 'fin-aurora', set: 'finale', name: 'Aurora', family: 'Finale · bed', inspiration: 'shemesh ind hue snakes',
    description: 'A curtain blending to the next color and back drifts along the first mapping, with a soft shimmer wandering through the pixels.',
    mappings: ['updown × rand', 'rad × rand', 'centric × rand', 'arc × rand'],
    build: t => {
      const [m1, m2] = maps(t), d = toward(t, t.next)
      return [
        t.fx(m1, { snake_hue: { head: t.head(4 * BAR, t.i / 12), tail_length: cnst(1), cyclic: true, offset_factor: t.inc(half(lin(0, d), lin(d, 0))) } }),
        dimAll(t, 0.7),
        t.fx(m2, { snake_brightness: { head: t.head(2 * BAR, ph(t.i, 0.37)), tail_length: cnst(0.5), cyclic: true, mult_factor_increase: t.inc(half(lin(0, 0.55), lin(0.55, 0))) } }),
      ]
    } },
  { id: 'fin-sky-sea', set: 'finale', name: 'Sky and sea', family: 'Finale · bed', inspiration: 'shemesh rad windows',
    description: 'Two halves of the mapping doing different things: stars twinkle in one, the other takes the next color with waves rolling through it every 2 beats.',
    mappings: ['updown', 'rad', 'arc'],
    build: t => {
      const [, sea] = halves(t.mapping)
      return [
        ...stars(t, 'rand', BAR, ph(t.i, 0.37), 0.07, 0.9),
        ...clearZone(t, sea, 0.55),
        t.fx(t.mapping, { position_hue: { offset_factor: t.inc(sea.w(cnst(toward(t, t.next)), 0)) } }),
        ...t.cycle(t.mapping, 2, 0, 2, { snake_brightness: { head: lin(0.7, 1.2), tail_length: cnst(0.2), cyclic: false, mult_factor_increase: t.inc(lin(0, 0.7)) } }),
      ]
    } },
  { id: 'fin-core-rim', set: 'finale', name: 'Core and rim', family: 'Finale · bed', inspiration: 'Pinwheel + Halo ripple',
    description: 'In one half of the mapping the small rings spin a two-armed pinwheel in the next color; in the other half ripples run outward on every beat.',
    mappings: ['rad', 'arc', 'updown'],
    build: t => {
      const [core, rim] = halves(t.mapping)
      return [
        t.fx('centric', { snake_brightness: { head: t.head(BAR / 2, t.i / 24), tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.8)) } }),
        t.fx('centric', { snake_brightness: { head: t.head(BAR / 2, t.i / 24 + 0.5), tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.8)) } }),
        t.fx(t.mapping, { position_hue: { offset_factor: t.inc(core.w(cnst(toward(t, t.next)), 0)) } }),
        ...clearZone(t, rim, 0.5),
        ...t.cycle(t.mapping, 1, 0, 1, { snake_brightness: { head: lin(0.6, 1.15), tail_length: cnst(0.1), cyclic: false, mult_factor_increase: t.inc(lin(0, 0.8)) } }),
      ]
    } },
  { id: 'fin-lanterns', set: 'finale', name: 'Lanterns', family: 'Finale · bed', inspiration: 'Option Gallery ind windows (el_jaguar)',
    description: 'The odd small rings are lanterns in the next color, glowing up every other beat; on the even ones a slow comet circles each small ring.',
    mappings: ['ind'],
    build: t => [
      t.fx('centric', { snake_brightness: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.4), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.7)) } }),
      ...clearZone(t, ODD_SMALL, 0.45),
      t.fx('ind', { position_hue: { offset_factor: t.inc(ODD_SMALL.w(cnst(toward(t, t.next)), 0)) } }),
      ...t.cycle('ind', 2, 0, 1, { position_brightness: { mult_factor_increase: t.inc(ODD_SMALL.w(cnst(0.6), 0)) } }),
    ] },
  { id: 'fin-breath', set: 'finale', name: 'Two-color breath', family: 'Finale · pixel weave', inspiration: 'Option Gallery b1/b2 colors (el_jaguar)',
    description: 'Every third pixel breathes toward the third color while the rest breathe toward the next one, half a cycle apart, every 2 bars: the pixels shimmer between colors.',
    mappings: ['b1 × b2'],
    build: t => [
      t.fx('b2', { timed_hue: { offset_factor: t.inc(t.wave(0, toward(t, t.next), 2 * BAR, 0.75)) } }),
      t.fx('b1', { timed_hue: { offset_factor: t.inc(t.wave(0, toward(t, t.third), 2 * BAR, 0.25)) } }),
      t.fx('b1', { timed_brightness: { mult_factor_increase: t.inc(t.wave(0, 0.4, 2 * BAR, 0.25)) } }),
    ] },

  // woven snakes: one snake per mapping, crossing
  { id: 'fin-woven', set: 'finale', name: 'Woven snakes', family: 'Finale · woven snakes', inspiration: 'shemesh ind + centric snakes',
    description: 'A long glow sweeps round on the first mapping every 2 bars while short white-tipped snakes run the other way on the second, twice a bar; where they cross it flares.',
    mappings: ['ind × centric', 'rad × centric', 'updown × ind', 'arc × centric'],
    build: t => {
      const [m1, m2] = maps(t)
      return [
        dimAll(t, 0.55),
        t.fx(m1, { snake_brightness: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(0.45), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.6)) } }),
        ...whiteSnake(t, m2, t.head(BAR / 2, t.i / 12, true), 0.2, 0.85),
      ]
    } },
  { id: 'fin-braid', set: 'finale', name: 'Color braid', family: 'Finale · woven snakes', inspiration: 'Double helix, across two mappings',
    description: 'A band of the next color turns one way on the first mapping, a band of the third color the other way on the second; white heads lead the second.',
    mappings: ['centric × ind', 'arc × rad', 'updown × centric', 'ind × rad'],
    build: t => {
      const [m1, m2] = maps(t), h2 = t.head(BAR, t.i / 12, true)
      return [
        t.fx(m1, { snake_hue: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.35), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
        t.fx(m2, { snake_hue: { head: h2, tail_length: cnst(0.3), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.third))) } }),
        t.fx(m2, { snake_saturation: { head: h2, tail_length: cnst(0.06), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.3)) } }),
      ]
    } },
  { id: 'fin-mesh', set: 'finale', name: 'Three-way mesh', family: 'Finale · woven snakes', inspiration: 'bam bam rand snakes + shemesh ind',
    description: 'Three snakes, three mappings, three channels: light drifting through the pixels (rand), a white sweep round the small rings (ind) and a color band spinning in each small ring (centric).',
    mappings: ['rand × ind × centric'],
    build: t => [
      dimAll(t, 0.6),
      t.fx('rand', { snake_brightness: { head: t.head(BAR, ph(t.i, 0.41)), tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.6)) } }),
      t.fx('ind', { snake_saturation: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(0.12), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.2)) } }),
      t.fx('centric', { snake_hue: { head: t.head(BAR / 2, t.i / 12, true), tail_length: cnst(0.3), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
    ] },
  { id: 'fin-crossfire', set: 'finale', name: 'Crossfire', family: 'Finale · woven snakes', inspiration: 'Ping-pong × Scanner',
    description: 'Two bands bounce along two mappings, one every 2 beats in the next color, one every 3 beats in the third: three against two, meeting every 6 beats.',
    mappings: ['updown × rad', 'arc × updown', 'rad × arc'],
    build: t => {
      const [m1, m2] = maps(t)
      return [
        dimAll(t, 0.3),
        t.fx(m1, { snake_brightness: { head: t.wave(0.1, 1.1, 2, 0.75), tail_length: cnst(0.25), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(m1, { snake_hue: { head: t.wave(0.1, 1.1, 2, 0.75), tail_length: cnst(0.25), cyclic: false, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
        t.fx(m2, { snake_brightness: { head: t.wave(0.1, 1.1, 3, 0.25), tail_length: cnst(0.25), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(m2, { snake_hue: { head: t.wave(0.1, 1.1, 3, 0.25), tail_length: cnst(0.25), cyclic: false, offset_factor: t.inc(cnst(toward(t, t.third))) } }),
      ]
    } },
  { id: 'fin-cascade', set: 'finale', name: 'Cascade', family: 'Finale · woven snakes', inspiration: 'peter_the_wolf updown snakes, phased',
    description: 'Colored snakes fall down each ring once a bar, each ring a twelfth later, so the fall rolls round the circle; a slow white sweep crosses them on the second mapping.',
    mappings: ['updown × ind', 'rad × centric', 'arc × ind'],
    build: t => {
      const [m1, m2] = maps(t), head = t.head(BAR, t.i / 12)
      return [
        dimAll(t, 0.35),
        t.fx(m1, { snake_brightness: { head, tail_length: cnst(0.4), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(m1, { snake_hue: { head, tail_length: cnst(0.4), cyclic: true, offset_factor: t.inc(lin(toward(t, t.next), 0)) } }),
        t.fx(m2, { snake_saturation: { head: t.head(4 * BAR, 0), tail_length: cnst(0.15), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.3)) } }),
      ]
    } },

  // zones: a window on one mapping, something different on each side of it
  { id: 'fin-half-sparkle', set: 'finale', name: 'Half spin, half sparkle', family: 'Finale · zones', inspiration: 'bam bam rand snakes',
    description: 'A random half of the pixels takes the next color and sparkles; the other half spins with the small rings.',
    mappings: ['rand'],
    build: t => {
      const [a] = halves('rand')
      return [
        t.fx('centric', { snake_brightness: { head: t.head(BAR / 2, t.i / 12), tail_length: cnst(0.35), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.9)) } }),
        ...clearZone(t, a, 0.3),
        t.fx('rand', { position_hue: { offset_factor: t.inc(a.w(cnst(toward(t, t.next)), 0)) } }),
        // a snake through the random order of zone a only: sparkles that stay on its pixels
        ...t.cycle('rand', BAR, 0, BAR, { snake_brightness: { head: lin(0, 0.56), tail_length: cnst(0.06), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
        ...t.cycle('rand', BAR, 0, BAR, { snake_saturation: { head: lin(0, 0.56), tail_length: cnst(0.03), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.3)) } }),
      ]
    } },
  { id: 'fin-odd-even', set: 'finale', name: 'Odd and even', family: 'Finale · zones', inspiration: 'Checker + Clock hand',
    description: 'The odd small rings flash in the third color on every beat; across the even ones a white-tipped hand sweeps round once a bar.',
    mappings: ['ind'],
    build: t => [
      dimAll(t, 0.35),
      ...whiteSnake(t, 'ind', t.head(BAR, t.i / 12), 0.3, 1),
      ...clearZone(t, ODD_SMALL, 0.15),
      t.fx('ind', { position_hue: { offset_factor: t.inc(ODD_SMALL.w(cnst(toward(t, t.third)), 0)) } }),
      ...t.cycle('ind', 1, 0, 0.5, { position_brightness: { mult_factor_increase: t.inc(ODD_SMALL.w(cnst(0.9), 0)) } }),
    ] },
  { id: 'fin-shutter', set: 'finale', name: 'Shutter', family: 'Finale · zones', inspiration: 'shemesh rad masks',
    description: 'A dark shade covers half of each ring and turns once every 2 bars; under it white stars, outside it the small rings spin.',
    mappings: ['ind', 'centric', 'updown'],
    build: t => [
      t.fx('centric', { snake_brightness: { head: t.head(BAR / 2, t.i / 12), tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.9)) } }),
      t.fx(t.mapping, { snake_brightness: { head: t.head(2 * BAR, t.i / 12, true), tail_length: cnst(0.5), cyclic: true, mult_factor_decrease: t.dec(cnst(0.12)) } }),
      ...stars(t, 'rand', BAR, ph(t.i, 0.37), 0.06, 0.9),
    ] },
  { id: 'fin-iris', set: 'finale', name: 'Iris', family: 'Finale · zones', inspiration: 'shemesh rad snakes (masks)',
    description: 'An iris opens and closes along the mapping every 2 bars: outside it dark, inside a color helix turning.',
    mappings: ['rad', 'updown', 'arc'],
    build: t => {
      const out: EffectJson[] = []
      for (const [rev, target] of [[false, t.next], [true, t.third]] as [boolean, HSV][]) {
        const head = t.head(BAR, t.i / 12, rev)
        out.push(
          t.fx('centric', { snake_hue: { head, tail_length: cnst(0.3), cyclic: true, offset_factor: t.inc(cnst(toward(t, target))) } }),
          t.fx('centric', { snake_brightness: { head, tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0.2, 0.9)) } }),
        )
      }
      // the shade: from the edge (1.2) in to between 0.85 and 0.25 of the mapping
      out.push(t.fx(t.mapping, { snake_brightness: { head: cnst(1.2), tail_length: t.wave(0.35, 0.95, 2 * BAR, 0.75), cyclic: false, mult_factor_decrease: t.dec(cnst(0.1)) } }))
      return out
    } },
  { id: 'fin-spotlight', set: 'finale', name: 'Spotlight', family: 'Finale · zones', inspiration: 'Chase Ind Steps, as a mask',
    description: 'Only a quarter of each ring is lit, stepping a twelfth on every beat; inside it the small rings spin white-tipped arms.',
    mappings: ['ind', 'centric'],
    build: t => [
      ...whiteSnake(t, 'centric', t.head(BAR / 2, t.i / 12), 0.3, 1),
      ...t.stepped(t.mapping, 12, t.i / 12, head => ({ snake_brightness: { head, tail_length: cnst(0.75), cyclic: true, mult_factor_decrease: t.dec(cnst(0.1)) } })),
    ] },

  // pixel weave: every third pixel (b1) against the rest (b2)
  { id: 'fin-weave-pulse', set: 'finale', name: 'Weave pulse', family: 'Finale · pixel weave', inspiration: 'Option Gallery b1/b2 colors (el_jaguar)',
    description: 'A snake runs the mapping on two thirds of the pixels; every third pixel holds the third color and pulses on every beat.',
    mappings: ['centric', 'ind', 'rad', 'updown'],
    build: t => [
      dimAll(t, 0.45),
      t.fx(t.mapping, { snake_brightness: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.4), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
      // (without beat hits every third pixel glows steadily instead)
      ...clearB1(t, t.hits ? 0.2 : 0.55),
      t.fx('b1', { timed_hue: { offset_factor: t.inc(cnst(toward(t, t.third))) } }),
      ...t.cycle('b1', 1, 0, 0.6, { timed_brightness: { mult_factor_increase: t.inc(lin(0.9, 0)) } }),
    ] },
  { id: 'fin-weave-glitter', set: 'finale', name: 'Weave glitter', family: 'Finale · pixel weave', inspiration: 'White glitter, on b1',
    description: 'A color wheel turns slowly through the ring while every third pixel flicks white on the off-beats.',
    mappings: ['ind', 'centric', 'arc', 'rad'],
    build: t => {
      const d = toward(t, t.next)
      return [
        t.fx(t.mapping, { snake_hue: { head: t.head(2 * BAR, t.i / 12), tail_length: cnst(1), cyclic: true, offset_factor: t.inc(half(lin(0, d), lin(d, 0))) } }),
        ...t.cycle('b1', 1, 0.5, 0.35, { timed_saturation: { mult_factor_decrease: t.dec(lin(0, 1)) } }),
        ...t.cycle('b1', 1, 0.5, 0.35, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } }),
      ]
    } },
  { id: 'fin-pulse-grid', set: 'finale', name: 'Pulse grid', family: 'Finale · pixel weave', inspiration: 'Offbeat pump, split by pixel',
    description: 'Every third pixel in the next color pumps on the beat; the rest pump on the off-beat.',
    mappings: ['b1 × b2'],
    build: t => [
      t.fx('b1', { timed_hue: { offset_factor: t.inc(cnst(toward(t, t.next))) } }),
      ...t.cycle('b1', 1, 0, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(lin(1, 0.3)) } }),
      ...t.cycle('b1', 1, 0.5, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(cnst(0.3)) } }),
      ...t.cycle('b2', 1, 0, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(cnst(0.35)) } }),
      ...t.cycle('b2', 1, 0.5, 0.5, { timed_brightness: { mult_factor_decrease: t.dec(lin(1, 0.35)) } }),
    ] },
  { id: 'fin-weave-steps', set: 'finale', name: 'Weave steps', family: 'Finale · pixel weave', inspiration: 'bam bam hue steps',
    description: 'Two thirds of the pixels step through the palette on every beat (own, next, third, next); every third pixel holds the ring\'s own color, a little brighter.',
    mappings: ['b1 × b2'],
    build: t => [
      ...t.cycle('b2', BAR, 0, BAR, { timed_hue: { offset_factor: t.inc(half(half(cnst(0), cnst(toward(t, t.next))), half(cnst(toward(t, t.third)), cnst(toward(t, t.next))))) } }),
      t.fx('b1', { timed_brightness: { mult_factor_increase: t.inc(cnst(0.3)) } }),
    ] },

  // the drop
  { id: 'fin-supernova', set: 'finale', name: 'Supernova', family: 'Finale · drop', inspiration: 'Meteor shower + Pinwheel + b1 flashes',
    description: 'On every downbeat a white ring bursts out across the installation; between them the small rings spin and every third pixel flashes on the off-beats.',
    mappings: ['rad', 'updown'],
    build: t => [
      dimAll(t, 0.45),
      t.fx('centric', { snake_brightness: { head: t.head(BAR / 2, t.i / 24), tail_length: cnst(0.3), cyclic: true, mult_factor_increase: t.inc(lin(0, 0.85)) } }),
      ...t.cycle('b1', 1, 0.5, 0.5, { timed_brightness: { mult_factor_increase: t.inc(lin(0.8, 0)) } }),
      ...t.cycle(t.mapping, BAR, 0, 1, { snake_brightness: { head: lin(-0.1, 1.3), tail_length: cnst(0.3), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
      ...t.cycle(t.mapping, BAR, 0, 1, { snake_saturation: { head: lin(-0.1, 1.3), tail_length: cnst(0.3), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.15)) } }),
    ] },
  { id: 'fin-hyperspin', set: 'finale', name: 'Hyperspin', family: 'Finale · drop', inspiration: 'Orbit dots, sped up',
    description: 'Two arms whirl round every small ring twice a beat, while a band of the next color sweeps round the big ring once a bar.',
    mappings: ['centric × ind', 'centric × rad', 'arc × ind'],
    build: t => {
      const [m1, m2] = maps(t)
      return [
        dimAll(t, 0.35),
        t.fx(m1, { snake_brightness: { head: t.head(0.5, t.i / 12), tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(m1, { snake_brightness: { head: t.head(0.5, t.i / 12 + 0.5), tail_length: cnst(0.25), cyclic: true, mult_factor_increase: t.inc(lin(0, 1)) } }),
        t.fx(m2, { snake_hue: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.35), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
      ]
    } },
  { id: 'fin-kaleido', set: 'finale', name: 'Kaleidoscope', family: 'Finale · drop', inspiration: 'Rosette petals + Spinning split',
    description: 'Six petals on every small ring flick between two positions on every beat, over a sector of the next color turning round the big ring once a bar.',
    mappings: ['centric × ind', 'centric × rad'],
    build: t => {
      const [, m2] = maps(t)
      return [
        t.fx(m2, { snake_hue: { head: t.head(BAR, t.i / 12), tail_length: cnst(0.5), cyclic: true, offset_factor: t.inc(cnst(toward(t, t.next))) } }),
        dimAll(t, 0.3),
        // without beat hits the petals hold still
        ...(t.hits ? [] : [t.fx('centric', { position_brightness: { mult_factor_increase: t.inc(rep(6, winC(0, 0.45, cnst(1)))) } })]),
        ...t.cycle('centric', 2, 0, 1, { position_brightness: { mult_factor_increase: t.inc(rep(6, winC(0, 0.45, cnst(1)))) } }),
        ...t.cycle('centric', 2, 1, 1, { position_brightness: { mult_factor_increase: t.inc(rep(6, winC(0.5, 0.45, cnst(1)))) } }),
      ]
    } },
  { id: 'fin-lighthouse', set: 'finale', name: 'Lighthouse', family: 'Finale · drop', inspiration: 'shemesh ind snakes + Glint',
    description: 'A wide beam with a white core turns round each ring once a bar; outside the beam, every third pixel glows in the third color.',
    mappings: ['ind', 'updown', 'rad'],
    build: t => {
      const head = t.head(BAR, t.i / 12)
      return [
        dimAll(t, 0.25),
        t.fx('b1', { timed_hue: { offset_factor: t.inc(cnst(toward(t, t.third))) } }),
        t.fx('b1', { timed_brightness: { mult_factor_increase: t.inc(cnst(0.35)) } }),
        t.fx(t.mapping, { snake_brightness: { head, tail_length: cnst(0.35), cyclic: true, mult_factor_increase: t.inc(half(lin(0, 1), cnst(1))) } }),
        t.fx(t.mapping, { snake_saturation: { head, tail_length: cnst(0.08), cyclic: true, mult_factor_decrease: t.dec(lin(1, 0.15)) } }),
      ]
    } },
  { id: 'fin-twin-zones', set: 'finale', name: 'Twin zones', family: 'Finale · drop', inspiration: 'Ricochet, by zone',
    description: 'The two halves of the mapping trade places every 2 beats: one half dark with a white snake racing round the small rings, the other in full next color.',
    mappings: ['updown', 'rad', 'arc', 'rand'],
    build: t => {
      const [a, b] = halves(t.mapping), d = toward(t, t.next)
      const out: EffectJson[] = [...whiteSnake(t, 'centric', t.head(BAR / 4, t.i / 12), 0.25, 1)]
      for (const [on, z, other] of [[0, a, b], [2, b, a]] as [number, Zone, Zone][]) {
        out.push(
          ...t.cycle(z.seg, BAR, on, 2, { position_brightness: { mult_factor_decrease: t.dec(other.w(cnst(0.25), 1)) } }),
          ...t.cycle(z.seg, BAR, on, 2, { position_hue: { offset_factor: t.inc(z.w(cnst(d), 0)) } }),
          ...t.cycle(z.seg, BAR, on, 2, { position_brightness: { mult_factor_increase: t.inc(z.w(cnst(1), 0)) } }),
        )
      }
      return out
    } },

  // overlays (lay these over any option with the lab's Overlays row)
  { id: 'ov-fin-vocal', set: 'finale', name: 'Vocal phrase', family: 'Finale · overlays', inspiration: 'the vocal phrase found in the audio (408–504)',
    description: 'Follows the vocal from 408 on a few rings at a time: each held note turns 3 rings, then 2, a third of the way round the color wheel (magenta goes cyan), holding it and gliding back; each note of the falling figure (417, 417.5, 418, answered on 421, …) does it on one ring. Two sets of rings, taking turns phrase by phrase.',
    mappings: ['all'],
    build: t => vocalNotes(t).reduce<EffectJson[]>((out, note) => out.concat(vocalNote(t, note, note[2] ? 0.5 : 0.35, 0)), []) },
  { id: 'ov-fin-burst', set: 'finale', name: 'Downbeat burst', family: 'Finale · overlays', inspiration: 'Meteor shower',
    description: 'A white ring bursts out from the center across the installation on every downbeat.',
    mappings: ['rad'],
    build: t => [
      ...t.cycle('rad', BAR, 0, 1, { snake_brightness: { head: lin(-0.1, 1.3), tail_length: cnst(0.3), cyclic: false, mult_factor_increase: t.inc(lin(0, 1)) } }),
      ...t.cycle('rad', BAR, 0, 1, { snake_saturation: { head: lin(-0.1, 1.3), tail_length: cnst(0.3), cyclic: false, mult_factor_decrease: t.dec(lin(1, 0.15)) } }),
    ] },
  { id: 'ov-fin-pixel-sparkle', set: 'finale', name: 'Pixel sparkle', family: 'Finale · overlays', inspiration: 'White glitter, on b1',
    description: 'Every third pixel flicks white on the off-beats.',
    mappings: ['b1'],
    build: t => [
      ...t.cycle('b1', 1, 0.5, 0.3, { timed_saturation: { mult_factor_decrease: t.dec(lin(0, 1)) } }),
      ...t.cycle('b1', 1, 0.5, 0.3, { timed_brightness: { mult_factor_increase: t.inc(lin(1, 0)) } }),
    ] },
  { id: 'ov-fin-shade', set: 'finale', name: 'Turning shade', family: 'Finale · overlays', inspiration: 'Shutter',
    description: 'A soft shade over half of each ring, turning once every 2 bars.',
    mappings: ['ind', 'updown', 'rad'],
    build: t => [t.fx(t.mapping, { snake_brightness: { head: t.head(2 * BAR, t.i / 12, true), tail_length: cnst(0.5), cyclic: true, mult_factor_decrease: t.dec(cnst(0.35)) } })] },
  { id: 'ov-fin-tint-wash', set: 'finale', name: 'Rising tint', family: 'Finale · overlays', inspiration: 'Finale Hue Sweep',
    description: 'Each bar the rings slide toward the tint color and snap back on the downbeat.',
    mappings: ['all'], tintable: true,
    build: t => t.tint
      ? [...t.cycle('all', BAR, 0, BAR, { timed_hue: { offset_factor: t.inc(lin(0, toward(t, t.tint))) } })]
      : [...t.cycle('all', BAR, 0, BAR, { timed_saturation: { mult_factor_decrease: t.dec(lin(1, 0.4)) } })] },
]

function rep(n: number, f: FloatFn): FloatFn { return { repeat: { numberOfTimes: n, funcToRepeat: f } } }
/** A window that wraps around 1 (for patterns that rotate). */
function winC(start: number, width: number, func: FloatFn, outside = 0): FloatFn {
  return { fixed_window: { start: r6(start), end: r6(start + width), cyclic: true, outside_value: outside, func } }
}

// --- the section shape and composition ----------------------------------------------------------------------------------

export interface Shape {
  buildUp: boolean; fadeOut: boolean
  /** fading in from black over the first 4 bars (in parts: over each fading-in part, up to 4 bars) */
  fadeIn?: boolean
  /** a slight brightening rising into every peak (on unless false) */
  peak?: boolean
  /** where the rises peak, in beats after the section start (mod a bar; 0 = on the bar lines) */
  peakOffset?: number
  /** brightness of the rings' base color (default 0.45: a dim bed under the textures; 1 = full color) */
  base?: number
  /** slow-to-fast speed-up of snake heads into each peak (default PACE; 0 = steady motion) */
  pace?: number
  /** textures laid over the whole section (or from/to beats), on top of whatever option is playing */
  overlays?: Overlay[]
  /** the shape per inner section: each part's settings (unset = the section's) over its beats instead of the
   *  section's; adjacent parts with build-up rise as one, and peaks run on through adjacent parts */
  parts?: ShapePart[]
}
export interface ShapePart { from: number; to: number; buildUp?: boolean; fadeIn?: boolean; fadeOut?: boolean; peak?: boolean; base?: number; pace?: number }
export interface Overlay { id: string; mapping?: string; from?: number; to?: number; tint?: Tint }
/** One texture placed over [from, to) beats; amount(beat) gives its strength per beat (1 = full). */
export interface Placement {
  texture: Texture; mapping: string; from: number; to: number; amount: (beat: number) => number; timing?: Timing; tint?: Tint
  /** the option's own palette (an id in PALETTES); default the section's */
  palette?: string
}

/** Color layouts per period: the first is LAYOUT; each next one reshuffles the rings' colors (deterministic, no two
 *  neighbours alike, most rings change). */
function colorLayouts(count: number, seed: number): number[][] {
  let state = (seed >>> 0) || 1
  const rand = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296 }
  const layouts = [LAYOUT.slice()]
  for (let n = 1; n < count; n++) {
    const prev = layouts[n - 1]
    let best = prev.slice(), bestScore = -1
    for (let attempt = 0; attempt < 300; attempt++) {
      const cand = prev.slice()
      for (let k = cand.length - 1; k > 0; k--) { const r = Math.floor(rand() * (k + 1)); const tmp = cand[k]; cand[k] = cand[r]; cand[r] = tmp }
      let neighbours = 0, changed = 0
      for (let k = 0; k < cand.length; k++) {
        if (cand[k] === cand[(k + 1) % cand.length]) neighbours++
        if (cand[k] !== prev[k]) changed++
      }
      const score = (neighbours === 0 ? 100 : 0) + changed
      if (score > bestScore) { best = cand; bestScore = score }
      if (neighbours === 0 && changed >= 9) break
    }
    layouts.push(best)
  }
  return layouts
}

/** The parts in order, clipped to [S, E), with the gaps between them filled by parts with the section's settings
 *  (fading out only at the section end). */
function fillParts(given: ShapePart[], S: number, E: number, fadeOut: boolean): ShapePart[] {
  const out: ShapePart[] = []
  let at = S
  for (const p of given.filter(x => x.to > S && x.from < E).sort((x, y) => x.from - y.from)) {
    const from = Math.max(at, p.from), to = Math.min(E, p.to)
    if (to <= from) continue
    if (from > at) out.push({ from: at, to: from, fadeOut: false })
    out.push({ ...p, from, to })
    at = to
  }
  if (at < E) out.push({ from: at, to: E, fadeOut })
  return out
}

/** Compose the section: base, placed textures (split into spans of equal amount), then the shape. With
 *  `shuffleEvery` (beats) the rings swap colors at every multiple of it from the section start. */
export function compose(ctx: LabContext, placements: Placement[], shape: Shape, shuffleEvery = 0, seed = 7): Sequence {
  const seq: Sequence = {}
  const S = ctx.fromBeat, E = ctx.toBeat
  const duration = Math.round(ctx.offsetMs + E * ctx.beatMs) + 1
  const period = shuffleEvery > 0 ? shuffleEvery : E - S
  const periods = Math.ceil((E - S) / period)
  const layouts = shuffleEvery > 0 ? colorLayouts(periods, seed) : [LAYOUT]
  const periodOf = (beat: number) => Math.min(periods - 1, Math.floor((beat - S) / period))
  const anchor = S + ((((shape.peakOffset ?? 0) % BAR) + BAR) % BAR)
  const pctx: LabContext = { ...ctx, paceAnchor: anchor, pace: shape.pace }
  // the shape per inner section (if any): the part playing at a beat, its base level and pace
  const parts = shape.parts?.length ? fillParts(shape.parts, S, E, shape.fadeOut) : null
  const partAt = (beat: number) => parts?.find(p => beat >= p.from && beat < p.to)
  const baseAt = (beat: number) => partAt(beat)?.base ?? shape.base ?? 0.45
  const paceAt = (beat: number) => partAt(beat)?.pace ?? shape.pace
  // the palette playing at a beat: the strongest option there (its own palette, else the section's)
  const paletteOf = (id?: string) => (id ? PALETTES.find(p => p.id === id) ?? ctx.palette : ctx.palette)
  const options = placements.filter(p => p.texture.family !== 'transition')
  const paletteAt = (beat: number): Palette => {
    let best: Placement | null = null, bestAmount = 0.001
    for (const p of options) {
      if (beat < p.from || beat >= p.to) continue
      const a = p.amount(beat)
      if (a >= bestAmount) { best = p; bestAmount = a }
    }
    return paletteOf(best?.palette)
  }
  ORDER.forEach((r, i) => {
    const colorAt = (beat: number, pal: Palette = paletteAt(beat)) => {
      const pc = pal.colors
      const idx = layouts[Math.min(layouts.length - 1, periodOf(beat))][i]
      return { c: pc[idx % pc.length], next: pc[(idx + 1) % pc.length] }
    }
    const fx: EffectJson[] = []
    // the base color, per color period, also cut where the palette playing or the base level changes
    for (let n = 0; n < periods; n++) {
      const from = S + n * period, to = Math.min(E, from + period)
      let segFrom = from
      for (let b = from + 1; b <= to; b++) {
        if (b < to && paletteAt(b) === paletteAt(segFrom) && baseAt(b) === baseAt(segFrom)) continue
        const { c } = colorAt(segFrom)
        fx.push(effect(ctx, 'all', segFrom, b, { const_color: { color: { ...c, val: r4(c.val * baseAt(segFrom)) } } }))
        segFrom = b
      }
    }
    // textures first; transition streaks go after the build-up so they read at full strength (see below)
    const addPlacement = (p: Placement) => {
      // spans of constant amount, also cut where the ring's colors change
      let spanFrom = p.from
      for (let b = p.from + 1; b <= p.to; b++) {
        // a color swap cuts the span too (the texture's colors change) -- except the transition streak, which is
        // centred on the switch, does not use the ring colors and must stay in one piece
        const colorCut = shuffleEvery > 0 && b > S && (b - S) % period === 0 && p.texture.family !== 'transition'
        // an option without a palette of its own (an overlay) follows the palette playing, so it is cut where that changes
        const paletteCut = !p.palette && p.texture.family !== 'transition' && b < p.to && paletteAt(b) !== paletteAt(spanFrom)
        // and where the pace changes between inner sections
        const paceCut = !!parts && b < p.to && paceAt(b) !== paceAt(spanFrom)
        const cut = b === p.to || p.amount(b) !== p.amount(spanFrom) || colorCut || paletteCut || paceCut
        if (!cut) continue
        const amount = p.amount(spanFrom)
        if (amount > 0.001) {
          const pal = p.palette ? paletteOf(p.palette) : paletteAt(Math.max(spanFrom, S))
          const { c, next } = colorAt(Math.max(spanFrom, S), pal)
          const sctx = parts ? { ...pctx, pace: paceAt(Math.max(spanFrom, S)) } : pctx
          const pc = p.timing || p.tint || pal !== ctx.palette
            ? { ...sctx, timing: p.timing, tint: p.tint, palette: pal, tintColors: ctx.palette.colors } : sctx
          fx.push(...p.texture.build(texCtx(pc, i, c, next, p.mapping, spanFrom, b, amount)))
          // the variation's color nudge
          const hue = resolveTiming(p.timing).hue
          if (hue) fx.push(effect(ctx, 'all', spanFrom, b, { timed_hue: { offset_factor: cnst(r4(hue * Math.min(1, amount))) } }))
        }
        spanFrom = b
      }
    }
    for (const p of placements) if (p.texture.family !== 'transition') addPlacement(p)
    const fadeBeats = 2 * BAR
    const fadeOf = (p: ShapePart) => Math.min(fadeBeats, p.to - p.from)
    const fades = (p: ShapePart) => p.fadeOut ?? shape.fadeOut
    /** runs of adjacent parts with `on` (a part's fade-out ends its run), each ending before that fade-out */
    const runs = (on: (p: ShapePart) => boolean) => {
      const out: [number, number][] = []
      parts!.forEach((p, k) => {
        if (!on(p)) return
        const end = p.to - (fades(p) ? fadeOf(p) : 0), prev = parts![k - 1]
        if (out.length && prev && prev.to === p.from && on(prev) && !fades(prev)) out[out.length - 1][1] = end
        else out.push([p.from, end])
      })
      return out.filter(([a, b]) => b > a)
    }
    if (!parts) { if (shape.buildUp) fx.push(effect(ctx, 'all', S, E - fadeBeats, { timed_brightness: { mult_factor_decrease: lin(0.55, 1) } })) }
    else for (const [a, b] of runs(p => p.buildUp ?? shape.buildUp)) fx.push(effect(ctx, 'all', a, b, { timed_brightness: { mult_factor_decrease: lin(0.55, 1) } }))
    // overlays: on top of every option, under the transition streaks
    for (const o of shape.overlays ?? []) {
      const texture = TEXTURES.find(t => t.id === o.id)
      const from = Math.max(S, o.from ?? S), to = Math.min(E, o.to ?? E)
      if (texture && to > from) addPlacement({ texture, mapping: o.mapping ?? texture.mappings[0], from, to, amount: () => 1, tint: o.tint })
    }
    for (const p of placements) if (p.texture.family === 'transition') addPlacement(p)
    // the peak: a slight brightening rising over the last beat of each bar, dropping on the downbeat
    // the peaks: a slight brightening rising over the beat before every peak, dropping right after it
    // one effect repeating every bar from its start, lit only in the beat before each peak
    const peaks = (a: number, b: number) => {
      const w0 = ((((anchor - 1 - a) % BAR) + BAR) % BAR) / BAR
      fx.push(effect(ctx, 'all', a, b, { timed_brightness: { mult_factor_increase: lin(0, 0.22) } }, BAR, [r6(w0), r6(w0 + 1 / BAR)]))
    }
    const fadeOut = (a: number, len: number) =>
      fx.push(effect(ctx, 'all', a, a + len, { timed_brightness: { mult_factor_decrease: { steps: { num_steps: len, diff_per_step: r4(-1 / len), first_step_value: r4(1 - 1 / len) } } } }))
    // the fade-in: smooth from black, over everything (textures, overlays, transitions)
    const fadeInBeats = 4 * BAR
    const fadeIn = (a: number, len: number) => fx.push(effect(ctx, 'all', a, a + len, { timed_brightness: { mult_factor_decrease: lin(0, 1) } }))
    if (!parts) { if (shape.fadeIn) fadeIn(S, Math.min(fadeInBeats, E - S)) }
    else for (const p of parts) if (p.fadeIn ?? (shape.fadeIn && p.from === S)) fadeIn(p.from, Math.min(fadeInBeats, p.to - p.from))
    if (!parts) {
      if (shape.peak !== false && E - fadeBeats > S) peaks(S, E - fadeBeats)
      if (shape.fadeOut) fadeOut(E - fadeBeats, fadeBeats)
    } else {
      for (const [a, b] of runs(p => p.peak ?? shape.peak !== false)) if (b - a >= BAR) peaks(a, a + Math.floor((b - a) / BAR) * BAR)
      for (const p of parts) if (fades(p)) fadeOut(p.to - fadeOf(p), fadeOf(p))
    }
    seq[`ring${r}`] = { effects: fx, duration_ms: duration, num_repeats: 1 }
  })
  return seq
}

export type Transition = 'streak' | 'streak-in' | 'cut' | 'blend-bar' | 'blend-2' | 'dip' | 'black' | 'flash' | 'strobe' | 'spin' | 'rainbow'
export const TRANSITIONS: { id: Transition; name: string; description: string }[] = [
  { id: 'streak', name: 'Rad streak', description: 'a white ring sweeps out from the center across the installation (like the meteor shower); the options swap as it passes' },
  { id: 'streak-in', name: 'Rad streak inward', description: 'a white ring closes in from the edge of the installation to its center; the options swap as it passes' },
  { id: 'cut', name: 'Cut on the bar', description: 'switch straight on the downbeat' },
  { id: 'blend-bar', name: 'Blend over a bar', description: 'the next option fades in over the last bar while this one fades out, a step per beat' },
  { id: 'blend-2', name: 'Blend over 2 beats', description: 'a quick half-and-half cross-fade on the last 2 beats' },
  { id: 'dip', name: 'Dip', description: 'this option fades out over its last beat, the next starts on the downbeat' },
  { id: 'black', name: 'Fade to black', description: 'everything fades to black over the last beat; the next option cuts in on the downbeat' },
  { id: 'flash', name: 'White flash', description: 'all rings flash white on the downbeat and fade back into the next option over a beat' },
  { id: 'strobe', name: 'Strobe roll', description: 'four quick white strobes on the last beat, then the switch' },
  { id: 'spin', name: 'Spin wipe', description: 'a white flash runs clockwise round the rings over the last beat; the options swap as it completes' },
  { id: 'rainbow', name: 'Rainbow spin', description: 'every color turns once round the rainbow over the 2 beats around the switch (like the loop song at 1177)' },
]

/** beats over which the leaving option fades out before a switch */
const blendOf = (tr: Transition) => (tr === 'blend-bar' ? BAR : tr === 'blend-2' ? 2 : tr === 'dip' ? 1 : 0)
/** beats before a switch that the arriving option starts */
const leadOf = (tr: Transition) => (tr === 'dip' ? 0 : blendOf(tr))
/** strength of the option leaving at `edge` at beat b (0 from the edge on) */
function outgoing(tr: Transition, b: number, edge: number): number {
  const blend = blendOf(tr)
  if (b >= edge) return 0
  if (b < edge - blend) return 1
  if (tr === 'dip') return 0.35
  if (tr === 'blend-2') return 0.5
  return (edge - b) / (blend + 1)
}
/** strength of the option arriving at `edge` at beat b */
function incoming(tr: Transition, b: number, edge: number): number {
  const lead = leadOf(tr)
  if (b >= edge) return 1
  if (b < edge - lead) return 0
  if (tr === 'blend-2') return 0.5
  return (b - (edge - lead) + 1) / (lead + 1)
}
/** what a transition lays over the switch at `edge` (2 beats centred on it), if anything */
function markerAt(tr: Transition, edge: number): Placement[] {
  const texture = MARKERS[tr]
  return texture ? [{ texture, mapping: texture.mappings[0], from: edge - 1, to: edge + 1, amount: () => 1 }] : []
}

/** A mix: the chosen options take turns every `barsEach` bars through the section, joined by the transition. */
export function mixPlacements(ctx: LabContext, items: { texture: Texture; mapping: string; timing?: Timing; palette?: string }[], barsEach: number, transition: Transition): Placement[] {
  if (!items.length) return []
  const S = ctx.fromBeat, E = ctx.toBeat, len = barsEach * BAR
  const out: Placement[] = []
  for (let n = 0, from = S; from < E; n++, from += len) {
    const item = items[n % items.length]
    const to = Math.min(from + len, E)
    const isFirst = from === S, isLast = to >= E
    out.push({
      texture: item.texture, mapping: item.mapping, from: isFirst ? from : from - leadOf(transition), to, timing: item.timing, palette: item.palette,
      amount: b => Math.min(isFirst ? 1 : incoming(transition, b, from), isLast ? 1 : outgoing(transition, b, to)),
    })
    if (!isFirst) out.push(...markerAt(transition, from))
  }
  return out
}

/** A block of the section with its own option, played instead of the mix there, and the transition at its edges
 *  (default the mix's). */
export interface Block { from: number; to: number; texture: Texture; mapping: string; timing?: Timing; palette?: string; transition?: Transition }

/** The mix with blocks cut out of it: the mix makes way inside the blocks and each block plays its own option. A
 *  block edge switches with the transition of the block arriving there, else of the block leaving (default the
 *  mix's); the mix's own switches inside blocks or on their edges are dropped. */
export function withBlocks(ctx: LabContext, placements: Placement[], blocks: Block[], transition: Transition): Placement[] {
  if (!blocks.length) return placements
  const S = ctx.fromBeat, E = ctx.toBeat
  const sorted = [...blocks].sort((x, y) => x.from - y.from)
  const trOf = (k: Block) => k.transition ?? transition
  const startsAt = (edge: number) => sorted.find(k => k.from === edge)
  // the mix: fading out into each block, and back in where a block hands back to it
  const gate = (b: number) => {
    let g = 1
    for (const k of sorted) {
      if (b < k.from) { if (k.from > S) g = Math.min(g, outgoing(trOf(k), b, k.from)) }
      else if (b < k.to) g = Math.min(g, k.to < E && !startsAt(k.to) ? incoming(trOf(k), b, k.to) : 0)
    }
    return g
  }
  const edges = new Set(sorted.flatMap(k => [k.from, k.to]))
  const out: Placement[] = []
  for (const p of placements) {
    if (p.texture.family === 'transition') {
      // a switch marker is centred on its switch: kept only where the mix still switches
      const centre = p.from + 1
      if (!edges.has(centre) && !sorted.some(k => centre >= k.from && centre < k.to)) out.push(p)
      continue
    }
    const amount = p.amount
    out.push({ ...p, amount: b => amount(b) * gate(b) })
  }
  for (const k of sorted) {
    const next = startsAt(k.to)
    const tin = trOf(k), tout = next ? trOf(next) : tin
    out.push({
      texture: k.texture, mapping: k.mapping, from: k.from > S ? k.from - leadOf(tin) : k.from, to: k.to, timing: k.timing, palette: k.palette,
      amount: b => Math.min(k.from > S ? incoming(tin, b, k.from) : 1, k.to < E ? outgoing(tout, b, k.to) : 1),
    })
    if (k.from > S) out.push(...markerAt(tin, k.from))
    if (k.to < E && !next) out.push(...markerAt(tout, k.to))
  }
  return out
}

/** A switch marker: 2 beats centred on the switch, built only from its first beat (it may be cut into spans). */
const marker = (id: string, name: string, build: (t: TexCtx, edge: number) => EffectJson[], mapping = 'all'): Texture => ({
  id: `transition-${id}`, name, family: 'transition', inspiration: '', description: '', mappings: [mapping],
  build: t => (t.to - t.from < 2 ? [] : build(t, t.from + 1)),
})
const whiteFlash = (t: TexCtx, from: number, to: number, opts: { every?: number; window?: [number, number] } = {}) => [
  t.fx('all', { timed_saturation: { mult_factor_decrease: lin(0, 1) } }, { from, to, ...opts }),
  t.fx('all', { timed_brightness: { mult_factor_increase: lin(1, 0) } }, { from, to, ...opts }),
]
/** The rad streak, half a beat either side of the switch, out from the center or in to it. */
const streak = (start: number, end: number) => (t: TexCtx, edge: number) => [
  t.fx('rad', { snake_brightness: { head: lin(start, end), tail_length: cnst(0.35), cyclic: false, mult_factor_increase: lin(0, 1) } }, { from: edge - 0.5, to: edge + 0.5 }),
  t.fx('rad', { snake_saturation: { head: lin(start, end), tail_length: cnst(0.35), cyclic: false, mult_factor_decrease: lin(1, 0.1) } }, { from: edge - 0.5, to: edge + 0.5 }),
]
const MARKERS: Partial<Record<Transition, Texture>> = {
  streak: { ...marker('streak', 'Transition streak', streak(-0.1, 1.35), 'rad'), inspiration: 'Meteor shower' },
  'streak-in': marker('streak-in', 'Inward streak', streak(1.35, -0.1), 'rad'),
  black: marker('black', 'Fade to black', (t, edge) => [t.fx('all', { timed_brightness: { mult_factor_decrease: lin(1, 0) } }, { from: edge - 1, to: edge })]),
  flash: marker('flash', 'White flash', (t, edge) => whiteFlash(t, edge, edge + 1)),
  strobe: marker('strobe', 'Strobe roll', (t, edge) => whiteFlash(t, edge - 1, edge, { every: 0.25, window: [0, 0.5] })),
  spin: marker('spin', 'Spin wipe', (t, edge) => { const at = r6(edge - 1 + t.i / 12); return whiteFlash(t, at, r6(at + 0.25)) }),
  rainbow: marker('rainbow', 'Rainbow spin', (t, edge) => [t.fx('all', { timed_hue: { offset_factor: lin(0, 1) } }, { from: edge - 1, to: edge + 1 })]),
}

// --- a section placed in a song ---------------------------------------------------------------------------------------

/** What a song stores on its section marker timeframe; built by buildSection (lab preview, editor sim, song runtime). */
export interface SectionSpec {
  kind?: 'mix'
  palette: string
  /** each option may have its own palette (an id in PALETTES); `palette` is the section's, for the rest */
  mix: { texture: string; mapping: string; timing?: Timing; palette?: string }[]
  /** blocks of the section with their own option (beats), played instead of the mix there */
  blocks?: { from: number; to: number; texture: string; mapping: string; timing?: Timing; palette?: string; transition?: Transition }[]
  barsEach: number
  transition: Transition
  shape: Shape
  /** swap the rings' colors at every mix switch */
  shuffleColors: boolean
  seed?: number
}

export function buildSection(spec: SectionSpec, fromBeat: number, toBeat: number, beatMs: number, offsetMs: number): Sequence {
  const palette = PALETTES.find(p => p.id === spec.palette) ?? PALETTES[0]
  const ctx: LabContext = { fromBeat, toBeat, beatMs, offsetMs, palette }
  const resolve = (id: string, mapping: string) => {
    const texture = TEXTURES.find(t => t.id === id)
    return texture ? { texture, mapping: texture.mappings.indexOf(mapping) >= 0 ? mapping : texture.mappings[0] } : null
  }
  const items: { texture: Texture; mapping: string; timing?: Timing; palette?: string }[] = []
  for (const m of spec.mix) { const r = resolve(m.texture, m.mapping); if (r) items.push({ ...r, timing: m.timing, palette: m.palette }) }
  const blocks: Block[] = []
  for (const k of spec.blocks ?? []) { const r = resolve(k.texture, k.mapping); if (r) blocks.push({ ...r, from: k.from, to: k.to, timing: k.timing, palette: k.palette, transition: k.transition }) }
  const placements = withBlocks(ctx, mixPlacements(ctx, items, spec.barsEach, spec.transition), blocks, spec.transition)
  return compose(ctx, placements, spec.shape, spec.shuffleColors ? spec.barsEach * BAR : 0, spec.seed ?? 7)
}

// --- drum rotation: ring colors (and a moving quarter segment) stepping one ring clockwise on every swap ------------------

/** A rotation section: plain per-step effects (constant colors and constant snake_hue segments), no function chains,
 *  so it stays small on the rings. Placed in a song's layer order (color layer + modifier layer), not at the end. */
export interface RotationSpec {
  kind: 'rotation'
  /** ring numbers clockwise from the top; the colors move one place along this order on every swap */
  order: number[]
  /** each ring's color before the first swap, as {hue, sat, val}, in `order` */
  colors: HSV[]
  /** palette hue of each color in `colors` (the hue arithmetic of the segments uses these) */
  hues: number[]
  /** beats of the swaps: the first, then every `every` until the section end */
  firstSwap: number
  every: number
  /** the segment: mapping, tail, and the hue shift to apply for each palette hue (keyed by hue, 3 decimals) */
  segment: { mapping: string; tail: number; shift: Record<string, number> }
}

export function isRotation(spec: unknown): spec is RotationSpec {
  return !!spec && typeof spec === 'object' && (spec as { kind?: string }).kind === 'rotation'
}

/** Per ring (by order index), the steps of a rotation: [from, to) beats, its color and its segment (if any). */
export function rotationSteps(spec: RotationSpec, fromBeat: number, toBeat: number) {
  const bounds = [fromBeat]
  for (let b = spec.firstSwap; b < toBeat - 1e-9; b += spec.every) if (b > fromBeat) bounds.push(b)
  bounds.push(toBeat)
  const n = spec.order.length
  return spec.order.map((ring, i) => bounds.slice(0, -1).map((from, step) => {
    const src = (((i - step) % n) + n) % n
    const c = spec.colors[src], c0 = spec.colors[i]
    // the color's hue as the ring's own starting color shifted by the palette difference (as the timeline did)
    const hue = r6(c0.hue + spec.hues[src] - spec.hues[i])
    const shift = spec.segment.shift[spec.hues[src].toFixed(3)]
    const head = (((2 * src + step) % 4) + 1) / 4
    return { ring, from, to: bounds[step + 1], color: { hue, sat: c.sat, val: c.val }, segment: shift === undefined ? null : { head, shift } }
  }))
}

/** The rotation's effects for one layer: 'color' (constant colors) or 'modifiers' (the segments). */
export function buildRotationLayer(spec: RotationSpec, fromBeat: number, toBeat: number, beatMs: number, offsetMs: number, layer: 'color' | 'modifiers'): Sequence {
  const ctx: LabContext = { fromBeat, toBeat, beatMs, offsetMs, palette: PALETTES[0] }
  const seq: Sequence = {}
  for (const steps of rotationSteps(spec, fromBeat, toBeat)) {
    const fx: EffectJson[] = []
    // the ring keeps its starting color and the rotation is a hue offset, so it also moves whatever later
    // color effects paint over the ring (as the timeline did)
    const c0 = steps[0].color
    if (layer === 'color') fx.push(effect(ctx, 'all', fromBeat, toBeat, { const_color: { color: c0 } }))
    else {
      for (const st of steps) {
        const offset = r6(st.color.hue - c0.hue)
        if (offset !== 0) fx.push(effect(ctx, 'all', st.from, st.to, { timed_hue: { offset_factor: cnst(offset) } }))
      }
      for (const st of steps) if (st.segment) fx.push(effect(ctx, spec.segment.mapping, st.from, st.to, {
        snake_hue: { head: cnst(st.segment.head), tail_length: cnst(spec.segment.tail), cyclic: true, offset_factor: cnst(st.segment.shift) },
      }))
    }
    seq[`ring${steps[0].ring}`] = { effects: fx, duration_ms: Math.round(offsetMs + toBeat * beatMs) + 1, num_repeats: 1 }
  }
  return seq
}
