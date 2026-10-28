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
}

/** One texture over one span of whole beats, at a constant amount, for one ring. */
export interface TexCtx {
  ctx: LabContext; i: number; c: HSV; next: HSV; mapping: string
  from: number; to: number; amount: number
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
}
export interface Texture {
  id: string; name: string; family: string; inspiration: string; description: string
  mappings: string[]
  build: (t: TexCtx) => EffectJson[]
}

const hsv = (hue: number, sat: number, val: number): HSV => ({ hue, sat, val })

export const PALETTES: Palette[] = [
  { id: 'rebuild', name: 'Echo of 144', source: 'the 144–224 section this one mirrors musically (Cool II B1 + B2 blue)',
    colors: [hsv(0.5, 0.85, 1), hsv(0.63, 0.95, 0.95), hsv(0.84, 1, 0.95), hsv(0.556, 1, 1)] },
  { id: 'before', name: 'Loop night', source: 'the section before (272–324)',
    colors: [hsv(0.743, 0.717, 0.62), hsv(0.493, 0.717, 0.62), hsv(0.997, 0.717, 0.62)] },
  { id: 'after', name: 'Chase dawn', source: 'the section after (Chase, 420+)',
    colors: [hsv(0.86, 1, 1), hsv(0.49, 1, 1), hsv(0.149, 1, 1)] },
  { id: 'bridge', name: 'Bridge', source: 'violet from before, magenta from after, cyan shared by both',
    colors: [hsv(0.743, 0.8, 0.8), hsv(0.86, 0.9, 0.9), hsv(0.493, 0.8, 0.8)] },
  { id: 'night', name: 'Night sky', source: 'neutral starry: indigo and deep blue with cyan',
    colors: [hsv(0.68, 0.85, 0.5), hsv(0.62, 0.95, 0.45), hsv(0.52, 0.7, 0.75)] },
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
  const S = ctx.fromBeat
  const A = ctx.paceAnchor ?? S
  return {
    ctx, i, c, next, mapping, from, to, amount,
    fx: (seg, body, o = {}) => effect(ctx, seg, o.from ?? from, o.to ?? to, body, o.every, o.window),
    inc: f => (amount >= 1 ? f : comb(f, amount, cnst(0), 1)),
    dec: f => (amount >= 1 ? f : comb(f, amount, cnst(1), r4(1 - amount))),
    head: (every, phase = 0, reverse = false) => {
      // heads stay positive (the renderer wraps negative cyclic heads differently): forward heads start one whole turn
      // in, reversed heads count down from a whole number past the section's length
      const top = Math.ceil((ctx.toBeat - S) / every) + 2
      // smooth pace over any span: speed (1 + PACE·cos(2π(u - PEAK_U))) / every, u = bars from the anchor, so motion is
      // slowest mid-bar and fastest just before each peak; the speed-up part is a sin, so one effect spans many bars
      const a = phase + (from - S) / every, b = phase + (to - S) / every
      const amp = r6((BAR / every) * PACE / (2 * Math.PI))
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
]

function rep(n: number, f: FloatFn): FloatFn { return { repeat: { numberOfTimes: n, funcToRepeat: f } } }
/** A window that wraps around 1 (for patterns that rotate). */
function winC(start: number, width: number, func: FloatFn, outside = 0): FloatFn {
  return { fixed_window: { start: r6(start), end: r6(start + width), cyclic: true, outside_value: outside, func } }
}

// --- the section shape and composition ----------------------------------------------------------------------------------

export interface Shape {
  buildUp: boolean; fadeOut: boolean
  /** a slight brightening rising into every peak (on unless false) */
  peak?: boolean
  /** where the rises peak, in beats after the section start (mod a bar; 0 = on the bar lines) */
  peakOffset?: number
}
/** One texture placed over [from, to) beats; amount(beat) gives its strength per beat (1 = full). */
export interface Placement { texture: Texture; mapping: string; from: number; to: number; amount: (beat: number) => number }

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

/** Compose the section: base, placed textures (split into spans of equal amount), then the shape. With
 *  `shuffleEvery` (beats) the rings swap colors at every multiple of it from the section start. */
export function compose(ctx: LabContext, placements: Placement[], shape: Shape, shuffleEvery = 0, seed = 7): Sequence {
  const seq: Sequence = {}
  const S = ctx.fromBeat, E = ctx.toBeat, cols = ctx.palette.colors
  const duration = Math.round(ctx.offsetMs + E * ctx.beatMs) + 1
  const period = shuffleEvery > 0 ? shuffleEvery : E - S
  const periods = Math.ceil((E - S) / period)
  const layouts = shuffleEvery > 0 ? colorLayouts(periods, seed) : [LAYOUT]
  const periodOf = (beat: number) => Math.min(periods - 1, Math.floor((beat - S) / period))
  const anchor = S + ((((shape.peakOffset ?? 0) % BAR) + BAR) % BAR)
  const pctx: LabContext = { ...ctx, paceAnchor: anchor }
  ORDER.forEach((r, i) => {
    const colorAt = (beat: number) => {
      const idx = layouts[Math.min(layouts.length - 1, periodOf(beat))][i]
      return { c: cols[idx % cols.length], next: cols[(idx + 1) % cols.length] }
    }
    const fx: EffectJson[] = []
    for (let n = 0; n < periods; n++) {
      const from = S + n * period, to = Math.min(E, from + period)
      const { c } = colorAt(from)
      fx.push(effect(ctx, 'all', from, to, { const_color: { color: { ...c, val: r4(c.val * 0.45) } } }))
    }
    // textures first; transition streaks go after the build-up so they read at full strength (see below)
    const addPlacement = (p: Placement) => {
      // spans of constant amount, also cut where the ring's colors change
      let spanFrom = p.from
      for (let b = p.from + 1; b <= p.to; b++) {
        // a color swap cuts the span too (the texture's colors change) -- except the transition streak, which is
        // centred on the switch, does not use the ring colors and must stay in one piece
        const colorCut = shuffleEvery > 0 && b > S && (b - S) % period === 0 && p.texture.family !== 'transition'
        const cut = b === p.to || p.amount(b) !== p.amount(spanFrom) || colorCut
        if (!cut) continue
        const amount = p.amount(spanFrom)
        if (amount > 0.001) {
          const { c, next } = colorAt(Math.max(spanFrom, S))
          fx.push(...p.texture.build(texCtx(pctx, i, c, next, p.mapping, spanFrom, b, amount)))
        }
        spanFrom = b
      }
    }
    for (const p of placements) if (p.texture.family !== 'transition') addPlacement(p)
    const fadeBeats = 2 * BAR
    if (shape.buildUp) fx.push(effect(ctx, 'all', S, E - fadeBeats, { timed_brightness: { mult_factor_decrease: lin(0.55, 1) } }))
    for (const p of placements) if (p.texture.family === 'transition') addPlacement(p)
    // the peak: a slight brightening rising over the last beat of each bar, dropping on the downbeat
    // the peaks: a slight brightening rising over the beat before every peak, dropping right after it
    if (shape.peak !== false && E - fadeBeats > S) {
      // one effect repeating every bar from the section start, lit only in the beat before each peak
      const w0 = ((((anchor - 1 - S) % BAR) + BAR) % BAR) / BAR
      fx.push(effect(ctx, 'all', S, E - fadeBeats, { timed_brightness: { mult_factor_increase: lin(0, 0.22) } }, BAR, [r6(w0), r6(w0 + 1 / BAR)]))
    }
    if (shape.fadeOut) fx.push(effect(ctx, 'all', E - fadeBeats, E, { timed_brightness: { mult_factor_decrease: { steps: { num_steps: fadeBeats, diff_per_step: r4(-1 / fadeBeats), first_step_value: r4(1 - 1 / fadeBeats) } } } }))
    seq[`ring${r}`] = { effects: fx, duration_ms: duration, num_repeats: 1 }
  })
  return seq
}

export type Transition = 'streak' | 'cut' | 'blend-bar' | 'blend-2' | 'dip'
export const TRANSITIONS: { id: Transition; name: string; description: string }[] = [
  { id: 'streak', name: 'Rad streak', description: 'a white ring sweeps out from the center across the installation (like the meteor shower); the options swap as it passes' },
  { id: 'cut', name: 'Cut on the bar', description: 'switch straight on the downbeat' },
  { id: 'blend-bar', name: 'Blend over a bar', description: 'the next option fades in over the last bar while this one fades out, a step per beat' },
  { id: 'blend-2', name: 'Blend over 2 beats', description: 'a quick half-and-half cross-fade on the last 2 beats' },
  { id: 'dip', name: 'Dip', description: 'this option fades out over its last beat, the next starts on the downbeat' },
]

/** A mix: the chosen options take turns every `barsEach` bars through the section, joined by the transition. */
export function mixPlacements(ctx: LabContext, items: { texture: Texture; mapping: string }[], barsEach: number, transition: Transition): Placement[] {
  if (!items.length) return []
  const S = ctx.fromBeat, E = ctx.toBeat, len = barsEach * BAR
  const blend = transition === 'blend-bar' ? BAR : transition === 'blend-2' ? 2 : transition === 'dip' ? 1 : 0
  const out: Placement[] = []
  for (let n = 0, from = S; from < E; n++, from += len) {
    const item = items[n % items.length]
    const to = Math.min(from + len, E)
    const isFirst = from === S, isLast = to >= E
    const start = isFirst || transition === 'dip' || transition === 'cut' || transition === 'streak' ? from : from - blend
    out.push({
      texture: item.texture, mapping: item.mapping, from: start, to,
      amount: b => {
        if (b < from) return transition === 'blend-2' ? 0.5 : (b - start + 1) / (blend + 1)  // fading in before its turn
        if (!isLast && b >= to - blend) {
          if (transition === 'dip') return 0.35
          if (transition === 'blend-2') return 0.5
          return (to - b) / (blend + 1)                                                         // fading out at its end
        }
        return 1
      },
    })
    // the streak: a white ring sweeping out across the installation, centred on the switch
    if (transition === 'streak' && !isFirst) out.push({ texture: STREAK, mapping: 'rad', from: from - 1, to: from + 1, amount: () => 1 })
  }
  return out
}

/** The transition streak, half a beat either side of the switch (built only from its first beat). */
const STREAK: Texture = {
  id: 'transition-streak', name: 'Transition streak', family: 'transition', inspiration: 'Meteor shower', description: '', mappings: ['rad'],
  build: t => t.to - t.from < 2 ? [] : [
    t.fx('rad', { snake_brightness: { head: lin(-0.1, 1.35), tail_length: cnst(0.35), cyclic: false, mult_factor_increase: lin(0, 1) } }, { from: t.from + 0.5, to: t.from + 1.5 }),
    t.fx('rad', { snake_saturation: { head: lin(-0.1, 1.35), tail_length: cnst(0.35), cyclic: false, mult_factor_decrease: lin(1, 0.1) } }, { from: t.from + 0.5, to: t.from + 1.5 }),
  ],
}

// --- a section placed in a song ---------------------------------------------------------------------------------------

/** What a song stores on its section marker timeframe; built by buildSection (lab preview, editor sim, song runtime). */
export interface SectionSpec {
  kind?: 'mix'
  palette: string
  mix: { texture: string; mapping: string }[]
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
  const items: { texture: Texture; mapping: string }[] = []
  for (const m of spec.mix) {
    const texture = TEXTURES.find(t => t.id === m.texture)
    if (texture) items.push({ texture, mapping: texture.mappings.indexOf(m.mapping) >= 0 ? m.mapping : texture.mappings[0] })
  }
  const placements = mixPlacements(ctx, items, spec.barsEach, spec.transition)
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
