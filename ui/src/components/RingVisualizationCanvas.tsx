import React from 'react'

interface RingVisualizationCanvasProps {
  /** precomputedColors[ringNumber (1-12)] = string[144] of rgb colors indexed by pixel index */
  colors: Map<number, string[]>
  /** Big-ring numbers (1-12) that are active; others are dimmed */
  activeRings?: number[]
}

// Base geometry at 680px — all values scale linearly with available size
const BASE = 680
const BASE_OUTER_R = 268
const BASE_PIX_R = 11
const BASE_SUB_R = 57
const BASE_PIX_SIZE = 6

const RingVisualizationCanvas = ({ colors, activeRings }: RingVisualizationCanvasProps) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [size, setSize] = React.useState(BASE)

  // Observe wrapper width and update size
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setSize(Math.floor(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = size / BASE

  // Pre-compute pixel center positions — recompute when size changes
  const pixelPositions = React.useMemo(() => {
    const outerR = BASE_OUTER_R * scale
    const subR = BASE_SUB_R * scale
    const pixR = BASE_PIX_R * scale
    const center = size / 2
    const positions: Array<Array<{ cx: number; cy: number }>> = []

    for (let bigRingIdx = 0; bigRingIdx < 12; bigRingIdx++) {
      const bigAngle = (bigRingIdx * 30 - 90) * (Math.PI / 180)
      const bigCx = center + outerR * Math.cos(bigAngle)
      const bigCy = center + outerR * Math.sin(bigAngle)
      const ringPositions: Array<{ cx: number; cy: number }> = new Array(144)

      for (let subRingIdx = 0; subRingIdx < 12; subRingIdx++) {
        const subAngle = (subRingIdx * 30 - 60) * (Math.PI / 180)
        const subCx = bigCx + subR * Math.cos(subAngle)
        const subCy = bigCy + subR * Math.sin(subAngle)

        for (let posIdx = 0; posIdx < 12; posIdx++) {
          const pixelIndex = subRingIdx * 12 + posIdx
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
  }, [size, scale])

  // Draw whenever colors, activeRings, or size changes
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixelRadius = (BASE_PIX_SIZE * scale) / 2
    ctx.clearRect(0, 0, size, size)

    for (let bigRingIdx = 0; bigRingIdx < 12; bigRingIdx++) {
      const ringNumber = bigRingIdx + 1
      const isActive = !activeRings || activeRings.length === 0 || activeRings.includes(ringNumber)
      const ringColors = colors.get(ringNumber)
      const ringPos = pixelPositions[bigRingIdx]

      ctx.globalAlpha = isActive ? 1 : 0.2
      for (let pixelIndex = 0; pixelIndex < 144; pixelIndex++) {
        const pos = ringPos[pixelIndex]
        ctx.fillStyle = ringColors?.[pixelIndex] ?? 'rgb(0,0,0)'
        ctx.beginPath()
        ctx.arc(pos.cx, pos.cy, pixelRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }, [colors, activeRings, pixelPositions, size, scale])

  return (
    <div ref={wrapperRef} style={{ width: '100%', aspectRatio: '1' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default RingVisualizationCanvas
