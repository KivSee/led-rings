/**
 * Physical layout of the 12 big rings around the installation's circle.
 * Used by the simulator canvas (where to draw each ring) and by movement
 * directions that follow physical position (top → bottom, left → right).
 */

export const RING_COUNT = 12

/**
 * The installation is turned ~15° clockwise from an on-the-hour layout:
 * ring 12 hangs at about 12:30, ring 1 at 1:30, and so on.
 */
export const LAYOUT_ROTATION_DEG = 15

/**
 * Position of ring 0 to 11 counting clockwise from the top: ring 12 is 0,
 * ring 1 is 1, ..., ring 11 is 11. The ring nearest the top comes first.
 */
export function clockPosition(ring: number): number {
  return ring % RING_COUNT
}

/** Ring angle in degrees, clockwise from 12 o'clock. */
export function ringClockAngleDeg(ring: number): number {
  return clockPosition(ring) * (360 / RING_COUNT) + LAYOUT_ROTATION_DEG
}

/** Ring centre on the unit circle, screen coordinates (x right, y down). */
export function ringUnitPosition(ring: number): { x: number; y: number } {
  const a = (ringClockAngleDeg(ring) * Math.PI) / 180
  return { x: Math.sin(a), y: -Math.cos(a) }
}
