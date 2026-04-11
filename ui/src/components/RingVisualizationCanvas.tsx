import React from 'react'

interface RingVisualizationCanvasProps {
  /** precomputedColors[ringNumber (1-12)] = string[144] of rgb colors indexed by pixel index */
  colors: Map<number, string[]>
  /** Big-ring numbers (1-12) that are active; others are dimmed */
  activeRings?: number[]
  size: number         // canvas size in px (square)
  outerR: number       // radius of big-ring constellation
  ringSize: number     // diameter of one big ring
  subR: number         // sub-ring orbit radius
  subSize: number      // sub-ring diameter (unused visually, just for spacing)
  pixR: number         // pixel orbit radius inside sub-ring
  pixSize: number      // pixel dot diameter
}

// Parse 'rgb(r, g, b)' → [r, g, b]
function parseRgb(s: string): [number, number, number] {
  const m = s.match(/(\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return [0, 0, 0]
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
}

const RingVisualizationCanvas = ({
  colors,
  activeRings,
  size,
  outerR,
  ringSize,
  subR,
  pixR,
  pixSize,
}: RingVisualizationCanvasProps) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  // Pre-compute pixel center positions once (geometry never changes)
  // Returns flat array of {cx, cy} for each of 12 big rings × 144 pixels
  const pixelPositions = React.useMemo(() => {
    const center = size / 2
    // positions[bigRingIdx][pixelIndex] = {cx, cy} in canvas coords
    const positions: Array<Array<{ cx: number; cy: number }>> = []

    for (let bigRingIdx = 0; bigRingIdx < 12; bigRingIdx++) {
      // Big ring center on the outer constellation circle
      // Ring 0 at top, stepping 30deg clockwise
      const bigAngle = (bigRingIdx * 30 - 90) * (Math.PI / 180)
      const bigCx = center + outerR * Math.cos(bigAngle)
      const bigCy = center + outerR * Math.sin(bigAngle)

      const ringPositions: Array<{ cx: number; cy: number }> = new Array(144)

      for (let subRingIdx = 0; subRingIdx < 12; subRingIdx++) {
        // Sub-ring center inside the big ring
        // CSS: rotate(subRingIdx*30deg - 60deg) translateX(subR) — so angle = subRingIdx*30 - 60
        const subAngle = (subRingIdx * 30 - 60) * (Math.PI / 180)
        const subCx = bigCx + subR * Math.cos(subAngle)
        const subCy = bigCy + subR * Math.sin(subAngle)

        for (let posIdx = 0; posIdx < 12; posIdx++) {
          const pixelIndex = subRingIdx * 12 + posIdx
          // CSS: rotate(120 + subRingIdx*30 + posIdx*30 deg) translateX(pixR)
          const pixAngle = (120 + subRingIdx * 30 + posIdx * 30) * (Math.PI / 180)
          ringPositions[pixelIndex] = {
            cx: subCx + pixR * Math.cos(pixAngle),
            cy: subCy + pixR * Math.sin(pixAngle),
          }
        }
      }
      positions.push(ringPositions)
    }
    return positions
  }, [size, outerR, subR, pixR])

  // Draw whenever colors or activeRings change
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)

    const pixelRadius = pixSize / 2

    for (let bigRingIdx = 0; bigRingIdx < 12; bigRingIdx++) {
      const ringNumber = bigRingIdx + 1
      const isActive = !activeRings || activeRings.length === 0 || activeRings.includes(ringNumber)
      const ringColors = colors.get(ringNumber)
      const ringPos = pixelPositions[bigRingIdx]

      ctx.globalAlpha = isActive ? 1 : 0.2

      for (let pixelIndex = 0; pixelIndex < 144; pixelIndex++) {
        const pos = ringPos[pixelIndex]
        const color = ringColors?.[pixelIndex] ?? 'rgb(0,0,0)'
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(pos.cx, pos.cy, pixelRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }, [colors, activeRings, pixelPositions, size, pixSize])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%' }}
    />
  )
}

export default RingVisualizationCanvas
