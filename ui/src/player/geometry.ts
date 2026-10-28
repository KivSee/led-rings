import type { HSV } from './render'

// Shared by the Sequence Player and the Section Lab: where every pixel sits, and how an HSV pixel looks.

// Seen saturation is sat ^ 4 on the LEDs, the same model the Song Sync page uses.
export function hsvRgb({ hue, sat, val }: HSV): [number, number, number] {
  const s = Math.pow(Math.min(1, Math.max(0, sat)), 4), v = Math.min(1, Math.max(0, val))
  const h = (((hue % 1) + 1) % 1) * 6, i = Math.floor(h), f = h - i
  const p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f))
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]
  return [r * 255, g * 255, b * 255]
}

// --- the installation ------------------------------------------------------------------------------------------

// The wiring starts 9 small rings in: physical small ring i (pixels 12i - 12i+11) sits at local (i + 9):30, the
// same as src/ring-segments/geometry-segments.ts.
const D0_OFFSET = 9
// Pixel positions in a unit square (-1..1), like docs/layout.html: ring r at r:30, physical d0 i at local (i + 9):30.
export const PIXEL_POS: { r: number; index: number; x: number; y: number }[] = []
export const RING_CENTER: { x: number; y: number }[] = []
{
  const at = (cx: number, cy: number, R: number, deg: number) => {
    const a = (deg * Math.PI) / 180
    return [cx + R * Math.sin(a), cy - R * Math.cos(a)]
  }
  for (let r = 1; r <= 12; r++) {
    const A = (r + 0.5) * 30
    const [x1, y1] = at(0, 0, 500, A)
    RING_CENTER[r] = { x: x1 / 640, y: y1 / 640 }
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
