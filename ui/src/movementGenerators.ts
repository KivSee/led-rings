/**
 * Movement utilities: compute per-ring timing windows for movement patterns.
 * Movement is a property of a timeframe — a single timeframe in the UI maps
 * to per-ring beats() blocks in the generated .ts output.
 */

export type MovementType = 'spread' | 'sweep' | 'stagger' | 'random'
import { RING_COUNT, clockPosition, ringUnitPosition } from './ringLayout'

export type MovementDirection =
  | 'forward' | 'backward' | 'center-out' | 'edges-in' | 'pairs-forward' | 'pairs-backward'
  | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left' | 'custom'

const ALL_DIRECTIONS: MovementDirection[] = [
  'forward', 'backward', 'center-out', 'edges-in', 'pairs-forward', 'pairs-backward',
  'top-bottom', 'bottom-top', 'left-right', 'right-left', 'custom',
]

export interface TimeframeMovement {
  type: MovementType
  direction: MovementDirection
  beatsPerRing: number
  /** Spread: also stagger end times (diamond/rhombus pattern). First ring stays longest. */
  retire?: boolean
  /** Spread: rings stay dark from the timeframe start until their turn, so
   *  other layers (e.g. coloring) don't show on them before the spread reaches them. */
  darkBefore?: boolean
  /** Sweep: ping-pong back and forth. */
  bounce?: boolean
  /** Random: each ring turns on at its step and stays on for the rest of the timeframe. */
  accumulate?: boolean
  /**
   * Custom direction: explicit ring order. Rings step in this order; rings in
   * the timeframe's set but absent from this list stay on for the full timeframe.
   */
  customOrder?: number[]
}

export interface MovementTypeDef {
  id: MovementType
  label: string
  description: string
  extraParams: Array<{ key: MovementExtraKey; label: string }>
}

export type MovementExtraKey = 'retire' | 'bounce' | 'accumulate' | 'darkBefore'

export const MOVEMENT_TYPES: MovementTypeDef[] = [
  {
    id: 'spread',
    label: 'Spread',
    description: 'Rings activate progressively; all stay on until the end.',
    extraParams: [
      { key: 'retire', label: 'Retire (diamond)' },
      { key: 'darkBefore', label: 'Dark before start' },
    ],
  },
  {
    id: 'sweep',
    label: 'Sweep',
    description: 'One ring (or group) at a time, moving across.',
    extraParams: [
      { key: 'bounce', label: 'Bounce (ping-pong)' },
    ],
  },
  {
    id: 'stagger',
    label: 'Stagger',
    description: 'All rings play the same effect, wave-shifted in time.',
    extraParams: [],
  },
  {
    id: 'random',
    label: 'Random',
    description: 'Rings activate in random order (one at a time, like sweep).',
    extraParams: [
      { key: 'retire', label: 'Retire (stay off after fade)' },
      { key: 'accumulate', label: 'Accumulate (stay on after fade)' },
    ],
  },
]

export const MOVEMENT_DIRECTIONS: Array<{ id: MovementDirection; label: string }> = [
  { id: 'forward', label: '12 \u2192 11 (clockwise)' },
  { id: 'backward', label: '11 \u2192 12 (counter-clockwise)' },
  { id: 'top-bottom', label: 'Top \u2192 Bottom' },
  { id: 'bottom-top', label: 'Bottom \u2192 Top' },
  { id: 'left-right', label: 'Left \u2192 Right' },
  { id: 'right-left', label: 'Right \u2192 Left' },
  { id: 'center-out', label: 'Center \u2192 Out' },
  { id: 'edges-in', label: 'Edges \u2192 In' },
  { id: 'pairs-forward', label: 'Opposite pairs \u2192' },
  { id: 'pairs-backward', label: 'Opposite pairs \u2190' },
  { id: 'custom', label: 'Custom order\u2026' },
]

// Ring orderings start from the top of the circle. Because the installation is
// rotated (see ringLayout.ts), ring 12 hangs nearest the top and ring 11 just
// left of it, so "forward" runs 12, 1, 2, ..., 11 and "backward" 11, 10, ..., 1, 12.
const byClockPosition = (a: number, b: number) => clockPosition(a) - clockPosition(b)

/** Opposite ring across the circle (6 apart on a 12-ring layout). */
function oppositeRing(r: number): number {
  return ((r - 1 + RING_COUNT / 2) % RING_COUNT) + 1
}

/**
 * Group rings into opposite pairs (r and r+6). A ring whose partner is absent
 * from the set forms its own (singleton) group. Groups are ordered clockwise
 * from the top (12/6, 1/7, ..., 5/11). Returns the step map; reversed for backward.
 */
function getPairSteps(rings: number[], reverse: boolean): Map<number, number> {
  const present = new Set(rings)
  const seen = new Set<number>()
  const groups: number[][] = []
  for (const r of [...rings].sort(byClockPosition)) {
    if (seen.has(r)) continue
    const partner = oppositeRing(r)
    if (present.has(partner) && partner !== r) {
      groups.push([r, partner])
      seen.add(r)
      seen.add(partner)
    } else {
      groups.push([r])
      seen.add(r)
    }
  }
  // groups already ordered clockwise from the top (rings were sorted that way)
  const ordered = reverse ? [...groups].reverse() : groups
  const stepMap = new Map<number, number>()
  ordered.forEach((group, step) => {
    for (const r of group) stepMap.set(r, step)
  })
  return stepMap
}

// ---------------------------------------------------------------------------
// Ring step assignment — maps each ring to its step index.
// Rings equidistant from center share a step in center-out / edges-in.
// ---------------------------------------------------------------------------

// Centre of the clockwise-from-top sequence 12, 1, ..., 11 (positions 0..11):
// edges are 12 and 11, the centre is between 5 and 6.
const RING_CENTER = (RING_COUNT - 1) / 2

/**
 * Rings with the same key share a step; steps follow ascending key. Keys are
 * rounded so rings at the same physical height/column group together.
 */
function stepsByKey(rings: number[], key: (r: number) => number): Map<number, number> {
  const keyOf = (r: number) => Math.round(key(r) * 1000) / 1000
  const distinct = [...new Set(rings.map(keyOf))].sort((a, b) => a - b)
  return new Map(rings.map(r => [r, distinct.indexOf(keyOf(r))]))
}

/** Deterministic shuffle (seeded by 0) so random movement order is stable per ring set. */
function shuffledRingOrder(rings: number[]): number[] {
  const arr = [...rings].sort((a, b) => a - b)
  let seed = 0
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Custom order: rings step in the order listed in customOrder (restricted to the
 * present ring set, deduped). Rings present but not in customOrder are omitted
 * from the map entirely so callers can give them a full-timeframe window.
 */
function getCustomSteps(rings: number[], customOrder: number[] | undefined): Map<number, number> {
  const present = new Set(rings)
  const stepMap = new Map<number, number>()
  let step = 0
  for (const r of customOrder ?? []) {
    if (present.has(r) && !stepMap.has(r)) {
      stepMap.set(r, step++)
    }
  }
  return stepMap
}

function getRingSteps(rings: number[], direction: MovementDirection, type?: MovementType, customOrder?: number[]): Map<number, number> {
  const sorted = [...rings].sort(byClockPosition)

  // Custom order takes precedence over type-based ordering (e.g. random shuffle).
  if (direction === 'custom') {
    return getCustomSteps(rings, customOrder)
  }

  if (type === 'random') {
    const order = shuffledRingOrder(rings)
    return new Map(order.map((r, i) => [r, i]))
  }

  switch (direction) {
    case 'forward':
      return new Map(sorted.map((r, i) => [r, i]))
    case 'backward':
      return new Map(sorted.map((r, i) => [r, sorted.length - 1 - i]))
    case 'pairs-forward':
      return getPairSteps(rings, false)
    case 'pairs-backward':
      return getPairSteps(rings, true)
    case 'center-out':
      return stepsByKey(rings, r => Math.abs(clockPosition(r) - RING_CENTER))
    case 'edges-in':
      return stepsByKey(rings, r => -Math.abs(clockPosition(r) - RING_CENTER))
    // Physical directions: rings at the same height (or column) share a step.
    // Full set top → bottom: 11+12, 10+1, 9+2, 8+3, 7+4, 6+5.
    // Full set left → right: 8+9, 7+10, 6+11, 5+12, 4+1, 3+2.
    case 'top-bottom':
      return stepsByKey(rings, r => ringUnitPosition(r).y)
    case 'bottom-top':
      return stepsByKey(rings, r => -ringUnitPosition(r).y)
    case 'left-right':
      return stepsByKey(rings, r => ringUnitPosition(r).x)
    case 'right-left':
      return stepsByKey(rings, r => -ringUnitPosition(r).x)
  }
}

/** Number of distinct steps for a given ring set and direction (and optional movement type for random). */
export function getNumSteps(rings: number[], direction: MovementDirection, type?: MovementType, customOrder?: number[]): number {
  if (rings.length === 0) return 0
  const steps = getRingSteps(rings, direction, type, customOrder)
  if (steps.size === 0) return 0
  return Math.max(...steps.values()) + 1
}

export function defaultBeatsPerRing(
  type: MovementType,
  startTime: number,
  endTime: number,
  rings: number[],
  direction: MovementDirection,
  bounce?: boolean,
  retire?: boolean,
  customOrder?: number[],
): number {
  const duration = endTime - startTime
  const numSteps = getNumSteps(rings, direction, type, customOrder)
  if (numSteps <= 0) return 1

  if (type === 'random') {
    return Math.round((duration / numSteps) * 100) / 100
  }
  if (type === 'spread' && retire) {
    return Math.round((duration / (2 * numSteps)) * 100) / 100
  }
  if (type === 'sweep' && bounce) {
    const totalSteps = Math.max(1, 2 * numSteps - 2)
    return Math.round((duration / totalSteps) * 100) / 100
  }
  return Math.round((duration / numSteps) * 100) / 100
}

// ---------------------------------------------------------------------------
// Ring window computation
// ---------------------------------------------------------------------------

/** Window for a ring: start/end in beats; holdOff = apply brightness 0 to keep ring off after its turn. */
export type MovementWindow = { start: number; end: number; holdOff?: boolean }

/** Clip a window to [startTime, endTime] and add if non-empty. */
function clipWindow(
  w: MovementWindow,
  startTime: number,
  endTime: number,
): MovementWindow | null {
  const start = Math.max(w.start, startTime)
  const end = Math.min(w.end, endTime)
  if (start >= end) return null
  return { ...w, start, end }
}

/** Tile one-cycle windows (relative to cycle start) repeatedly over [startTime, endTime]. */
function tileCycleWindows(
  oneCycleWindows: MovementWindow[],
  cycleBeats: number,
  startTime: number,
  endTime: number,
): MovementWindow[] {
  const out: MovementWindow[] = []
  for (let cycleIndex = 0; ; cycleIndex++) {
    const cycleStart = startTime + cycleIndex * cycleBeats
    if (cycleStart >= endTime) break
    for (const w of oneCycleWindows) {
      const shifted: MovementWindow = {
        start: cycleStart + w.start,
        end: cycleStart + w.end,
        holdOff: w.holdOff,
      }
      const clipped = clipWindow(shifted, startTime, endTime)
      if (clipped) out.push(clipped)
    }
  }
  return out
}

/**
 * Returns all active windows (beat ranges) for a specific ring within a
 * movement-enabled timeframe. Movement patterns repeat for the full timeframe
 * (sweep/random restart when one pass finishes; spread/stagger unchanged).
 */
export function getMovementRingWindows(
  startTime: number,
  endTime: number,
  rings: number[],
  movement: TimeframeMovement | undefined,
  ringNum: number,
): MovementWindow[] {
  if (!movement) {
    return rings.includes(ringNum) ? [{ start: startTime, end: endTime }] : []
  }

  const steps = getRingSteps(rings, movement.direction, movement.type, movement.customOrder)
  const step = steps.get(ringNum)
  if (step == null) {
    // Custom direction: rings in the set but not in the order list stay on full-time.
    if (movement.direction === 'custom' && rings.includes(ringNum)) {
      return [{ start: startTime, end: endTime }]
    }
    return []
  }

  const bpr = movement.beatsPerRing
  const numSteps = Math.max(...steps.values()) + 1

  switch (movement.type) {
    case 'random': {
      // One ring at a time, in random order.
      // Retire = one pass then holdOff; Accumulate = turn on and stay on; else repeat.
      const s = startTime + step * bpr
      const e = s + bpr
      if (s >= endTime) return []
      const fadeEnd = Math.min(e, endTime)
      if (movement.accumulate) {
        // Ring turns on at its step and stays on for the rest of the timeframe
        return [{ start: s, end: endTime }]
      }
      if (movement.retire && fadeEnd < endTime) {
        return [
          { start: s, end: fadeEnd },
          { start: fadeEnd, end: endTime, holdOff: true },
        ]
      }
      const cycleBeats = numSteps * bpr
      const oneCycle: MovementWindow[] = [
        { start: step * bpr, end: step * bpr + bpr },
      ]
      return tileCycleWindows(oneCycle, cycleBeats, startTime, endTime)
    }
    case 'spread': {
      const s = startTime + step * bpr
      const out: MovementWindow[] = []
      // Dark before start: hold the ring off until its turn.
      if (movement.darkBefore && s > startTime) {
        out.push({ start: startTime, end: Math.min(s, endTime), holdOff: true })
      }
      const e = movement.retire ? endTime - step * bpr : endTime
      if (s < e) out.push({ start: s, end: e })
      return out
    }

    case 'sweep': {
      if (movement.bounce) {
        const totalSteps = Math.max(1, 2 * numSteps - 2)
        const cycleBeats = totalSteps * bpr
        const oneCycle: MovementWindow[] = []
        const fwdStart = step * bpr
        const fwdEnd = fwdStart + bpr
        oneCycle.push({ start: fwdStart, end: fwdEnd })
        if (step > 0 && step < numSteps - 1) {
          const bwdStep = totalSteps - step
          oneCycle.push({ start: bwdStep * bpr, end: bwdStep * bpr + bpr })
        }
        return tileCycleWindows(oneCycle, cycleBeats, startTime, endTime)
      }
      const cycleBeats = numSteps * bpr
      const oneCycle: MovementWindow[] = [
        { start: step * bpr, end: step * bpr + bpr },
      ]
      return tileCycleWindows(oneCycle, cycleBeats, startTime, endTime)
    }

    case 'stagger': {
      // All rings are active for the full duration; the offset is applied
      // in t-computation and code gen (per-ring cycle offset).
      return [{ start: startTime, end: endTime }]
    }
  }
}

/**
 * Check if a ring is active at a specific beat, accounting for movement.
 */
export function isRingActiveAtBeat(
  startTime: number,
  endTime: number,
  rings: number[],
  movement: TimeframeMovement | undefined,
  ringNum: number,
  currentBeat: number,
): boolean {
  const windows = getMovementRingWindows(startTime, endTime, rings, movement, ringNum)
  return windows.some(w => currentBeat >= w.start && currentBeat < w.end)
}

/**
 * Get the active window and normalized local t for a ring at a specific beat.
 * For stagger, the t is shifted by the ring's phase offset within the cycle.
 * Returns null if the ring is not active at that beat.
 */
export function getMovementRingT(
  startTime: number,
  endTime: number,
  rings: number[],
  movement: TimeframeMovement | undefined,
  ringNum: number,
  currentBeat: number,
): { t: number; windowStart: number; windowEnd: number; holdOff?: boolean } | null {
  if (!movement) {
    if (!rings.includes(ringNum)) return null
    if (currentBeat < startTime || currentBeat >= endTime) return null
    const dur = endTime - startTime
    const t = dur > 0 ? (currentBeat - startTime) / dur : 0
    return { t: Math.max(0, Math.min(1, t)), windowStart: startTime, windowEnd: endTime }
  }

  const windows = getMovementRingWindows(startTime, endTime, rings, movement, ringNum)
  for (const w of windows) {
    if (currentBeat >= w.start && currentBeat < w.end) {
      // holdOff window: ring stays off; caller should use t=1 and apply brightness 0 in preview
      if (w.holdOff) return { t: 1, windowStart: w.start, windowEnd: w.end, holdOff: true }
      if (movement.type === 'stagger') {
        // For stagger, shift t by the ring's phase offset
        const steps = getRingSteps(rings, movement.direction, movement.type, movement.customOrder)
        const step = steps.get(ringNum) ?? 0
        const dur = w.end - w.start
        if (dur <= 0) return { t: 0, windowStart: w.start, windowEnd: w.end }
        const rawT = (currentBeat - w.start) / dur
        const offset = (step * movement.beatsPerRing) / dur
        const t = ((rawT - offset) % 1 + 1) % 1
        return { t, windowStart: w.start, windowEnd: w.end }
      }
      const dur = w.end - w.start
      const t = dur > 0 ? (currentBeat - w.start) / dur : 0
      return { t: Math.max(0, Math.min(1, t)), windowStart: w.start, windowEnd: w.end }
    }
  }
  return null
}

/**
 * For code generation: get per-ring timing info.
 * Returns entries sorted by ring number, each with the ring's beats() windows.
 * For stagger, also returns the phase offset in beats.
 */
export function getMovementCodeGenEntries(
  startTime: number,
  endTime: number,
  rings: number[],
  movement: TimeframeMovement,
): Array<{ ringNum: number; windows: MovementWindow[]; staggerOffset?: number }> {
  const sorted = [...rings].sort((a, b) => a - b)
  const steps = getRingSteps(rings, movement.direction, movement.type, movement.customOrder)
  return sorted.map(ringNum => {
    const windows = getMovementRingWindows(startTime, endTime, rings, movement, ringNum)
    const step = steps.get(ringNum)
    // Stagger offset only applies to stepped rings; custom outside-rings (no step) stay full-time.
    const staggerOffset = movement.type === 'stagger' && step != null
      ? step * movement.beatsPerRing
      : undefined
    return {
      ringNum,
      windows,
      staggerOffset,
    }
  })
}

/**
 * Validates and normalizes a movement object loaded from JSON.
 */
export function normalizeMovement(raw: unknown): TimeframeMovement | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const validTypes: MovementType[] = ['spread', 'sweep', 'stagger', 'random']
  if (!validTypes.includes(o.type as MovementType)) return undefined
  if (!ALL_DIRECTIONS.includes(o.direction as MovementDirection)) return undefined
  const bpr = Number(o.beatsPerRing)
  if (!Number.isFinite(bpr) || bpr <= 0) return undefined

  // Parse customOrder: integers 1–12, deduped, order preserved.
  let customOrder: number[] | undefined
  if (Array.isArray(o.customOrder)) {
    const seen = new Set<number>()
    customOrder = o.customOrder
      .map(n => Number(n))
      .filter(n => Number.isInteger(n) && n >= 1 && n <= RING_COUNT && !seen.has(n) && (seen.add(n), true))
  }
  let direction = o.direction as MovementDirection
  // Custom direction requires a non-empty order; fall back to forward otherwise.
  if (direction === 'custom' && (!customOrder || customOrder.length === 0)) {
    direction = 'forward'
    customOrder = undefined
  }

  return {
    type: o.type as MovementType,
    direction,
    beatsPerRing: bpr,
    retire: o.retire === true ? true : undefined,
    darkBefore: o.darkBefore === true ? true : undefined,
    bounce: o.bounce === true ? true : undefined,
    accumulate: o.accumulate === true ? true : undefined,
    customOrder,
  }
}
