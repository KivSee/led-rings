/**
 * Movement utilities: compute per-ring timing windows for movement patterns.
 * Movement is a property of a timeframe — a single timeframe in the UI maps
 * to per-ring beats() blocks in the generated .ts output.
 */

export type MovementType = 'spread' | 'sweep' | 'stagger' | 'random'
export type MovementDirection = 'forward' | 'backward' | 'center-out' | 'edges-in'

export interface TimeframeMovement {
  type: MovementType
  direction: MovementDirection
  beatsPerRing: number
  /** Spread: also stagger end times (diamond/rhombus pattern). First ring stays longest. */
  retire?: boolean
  /** Sweep: ping-pong back and forth. */
  bounce?: boolean
}

export interface MovementTypeDef {
  id: MovementType
  label: string
  description: string
  extraParams: Array<{ key: 'retire' | 'bounce'; label: string }>
}

export const MOVEMENT_TYPES: MovementTypeDef[] = [
  {
    id: 'spread',
    label: 'Spread',
    description: 'Rings activate progressively; all stay on until the end.',
    extraParams: [
      { key: 'retire', label: 'Retire (diamond)' },
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
    ],
  },
]

export const MOVEMENT_DIRECTIONS: Array<{ id: MovementDirection; label: string }> = [
  { id: 'forward', label: '1 \u2192 12' },
  { id: 'backward', label: '12 \u2192 1' },
  { id: 'center-out', label: 'Center \u2192 Out' },
  { id: 'edges-in', label: 'Edges \u2192 In' },
]

// ---------------------------------------------------------------------------
// Ring step assignment — maps each ring to its step index.
// Rings equidistant from center share a step in center-out / edges-in.
// ---------------------------------------------------------------------------

const RING_CENTER = 6.5

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

function getRingSteps(rings: number[], direction: MovementDirection, type?: MovementType): Map<number, number> {
  const sorted = [...rings].sort((a, b) => a - b)

  if (type === 'random') {
    const order = shuffledRingOrder(rings)
    return new Map(order.map((r, i) => [r, i]))
  }

  switch (direction) {
    case 'forward':
      return new Map(sorted.map((r, i) => [r, i]))
    case 'backward':
      return new Map(sorted.map((r, i) => [r, sorted.length - 1 - i]))
    case 'center-out': {
      const withDist = sorted.map(r => ({ r, dist: Math.abs(r - RING_CENTER) }))
      withDist.sort((a, b) => a.dist - b.dist)
      const stepMap = new Map<number, number>()
      let step = 0
      let prevDist = -1
      for (const { r, dist } of withDist) {
        if (dist !== prevDist) {
          if (prevDist >= 0) step++
          prevDist = dist
        }
        stepMap.set(r, step)
      }
      return stepMap
    }
    case 'edges-in': {
      const withDist = sorted.map(r => ({ r, dist: Math.abs(r - RING_CENTER) }))
      withDist.sort((a, b) => b.dist - a.dist)
      const stepMap = new Map<number, number>()
      let step = 0
      let prevDist = -1
      for (const { r, dist } of withDist) {
        if (dist !== prevDist) {
          if (prevDist >= 0) step++
          prevDist = dist
        }
        stepMap.set(r, step)
      }
      return stepMap
    }
  }
}

/** Number of distinct steps for a given ring set and direction (and optional movement type for random). */
export function getNumSteps(rings: number[], direction: MovementDirection, type?: MovementType): number {
  if (rings.length === 0) return 0
  const steps = getRingSteps(rings, direction, type)
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
): number {
  const duration = endTime - startTime
  const numSteps = getNumSteps(rings, direction, type)
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

  const steps = getRingSteps(rings, movement.direction, movement.type)
  const step = steps.get(ringNum)
  if (step == null) return []

  const bpr = movement.beatsPerRing
  const numSteps = Math.max(...steps.values()) + 1

  switch (movement.type) {
    case 'random': {
      // One ring at a time, in random order. Retire = one pass then holdOff; else repeat.
      const s = startTime + step * bpr
      const e = s + bpr
      if (s >= endTime) return []
      const fadeEnd = Math.min(e, endTime)
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
      if (movement.retire) {
        const e = endTime - step * bpr
        return s < e ? [{ start: s, end: e }] : []
      }
      return s < endTime ? [{ start: s, end: endTime }] : []
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
        const steps = getRingSteps(rings, movement.direction, movement.type)
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
  const steps = getRingSteps(rings, movement.direction, movement.type)
  return sorted.map(ringNum => {
    const windows = getMovementRingWindows(startTime, endTime, rings, movement, ringNum)
    const step = steps.get(ringNum) ?? 0
    return {
      ringNum,
      windows,
      staggerOffset: movement.type === 'stagger' ? step * movement.beatsPerRing : undefined,
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
  const validDirs: MovementDirection[] = ['forward', 'backward', 'center-out', 'edges-in']
  if (!validTypes.includes(o.type as MovementType)) return undefined
  if (!validDirs.includes(o.direction as MovementDirection)) return undefined
  const bpr = Number(o.beatsPerRing)
  if (!Number.isFinite(bpr) || bpr <= 0) return undefined
  return {
    type: o.type as MovementType,
    direction: o.direction as MovementDirection,
    beatsPerRing: bpr,
    retire: o.retire === true ? true : undefined,
    bounce: o.bounce === true ? true : undefined,
  }
}
