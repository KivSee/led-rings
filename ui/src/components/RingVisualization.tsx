import React from 'react'
import segmentsData from '../segments.json'
import { getPixelColor, hsvToRgbString } from '../effectPreview'
import type { Timeframe } from '../App'
import './RingVisualization.css'

interface RingVisualizationProps {
  mapping: string
  rainbow?: boolean
  rainbowRange?: number
  startColor?: string
  /** Ring numbers (1-12) that are active; rings not in this list are dimmed. Omit to show all. */
  activeRings?: number[]
  /** When set with currentTime, playback effect preview is shown (brightness/hue/motion over time). */
  timeframe?: Timeframe | null
  /** Current time in beats; with timeframe, used to compute effect phase t in [0,1]. */
  currentTime?: number
}

const RingVisualization = ({
  mapping,
  rainbow,
  rainbowRange = 1,
  startColor,
  activeRings,
  timeframe,
  currentTime,
}: RingVisualizationProps) => {
  const useEffectPreview = Boolean(
    timeframe &&
    currentTime !== undefined &&
    (timeframe.brightnessEffect || timeframe.hueEffect || timeframe.motionEffect)
  )
  const duration = timeframe ? timeframe.endTime - timeframe.startTime : 0
  const t = duration > 0 && currentTime !== undefined && timeframe
    ? Math.max(0, Math.min(1, (currentTime - timeframe.startTime) / duration))
    : 0
  // Convert hex color to HSL to get hue
  const hexToHue = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    
    if (max !== min) {
      if (max === r) {
        h = ((g - b) / (max - min)) % 6
      } else if (max === g) {
        h = (b - r) / (max - min) + 2
      } else {
        h = (r - g) / (max - min) + 4
      }
    }
    h = h / 6
    if (h < 0) h += 1
    return h
  }

  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): string => {
    let r, g, b
    
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
  }

  // Convert relPos (0-1) to RGB color
  const relPosToColor = (relPos: number): string => {
    if (rainbow && startColor) {
      // Use rainbow mode: start from startColor and cycle through hues
      const startHue = hexToHue(startColor)
      // Apply range: multiply relPos by range to get number of cycles
      const hueOffset = (relPos * rainbowRange) % 1
      const finalHue = (startHue + hueOffset) % 1
      // Use high saturation and medium lightness for vibrant colors
      return hslToRgb(finalHue, 1, 0.5)
    }
    
    // Default rainbow gradient (fallback)
    const normalized = relPos % 1
    
    let r = 0, g = 0, b = 0
    
    if (normalized < 1/6) {
      const t = normalized * 6
      r = 255
      g = Math.round(255 * t)
      b = 0
    } else if (normalized < 2/6) {
      const t = (normalized - 1/6) * 6
      r = Math.round(255 * (1 - t))
      g = 255
      b = 0
    } else if (normalized < 3/6) {
      const t = (normalized - 2/6) * 6
      r = 0
      g = 255
      b = Math.round(255 * t)
    } else if (normalized < 4/6) {
      const t = (normalized - 3/6) * 6
      r = 0
      g = Math.round(255 * (1 - t))
      b = 255
    } else if (normalized < 5/6) {
      const t = (normalized - 4/6) * 6
      r = Math.round(255 * t)
      g = 0
      b = 255
    } else {
      const t = (normalized - 5/6) * 6
      r = 255
      g = 0
      b = Math.round(255 * (1 - t))
    }
    
    return `rgb(${r}, ${g}, ${b})`
  }

  // Get the mapping segment data
  const mappingSegment = segmentsData.segments.find(seg => seg.name === mapping)
  
  if (!mappingSegment) {
    return null
  }

  // Group pixels by ring (0-11, which corresponds to rings 1-12 in UI)
  // Each ring has 12 pixels: ring 0 = indices 0-11, ring 1 = 12-23, etc.
  const rings: Array<Array<{ index: number; relPos: number }>> = []
  for (let i = 0; i < 12; i++) {
    rings[i] = []
  }

  // Distribute pixels to rings based on their index
  // Each ring has 12 pixels, so ring 0 = indices 0-11, ring 1 = 12-23, etc.
  mappingSegment.pixels.forEach(pixel => {
    const ringIndex = Math.floor(pixel.index / 12)
    if (ringIndex < 12) {
      rings[ringIndex].push(pixel)
    }
  })

  // Create a map for each ring to store pixels at their correct positions
  const ringsWithPositions: Array<Array<{ index: number; relPos: number; position: number } | null>> = []
  for (let i = 0; i < 12; i++) {
    ringsWithPositions[i] = new Array(12).fill(null)
  }

  // Place pixels at their correct positions within each ring
  mappingSegment.pixels.forEach(pixel => {
    const ringIndex = Math.floor(pixel.index / 12)
    const positionInRing = pixel.index % 12
    if (ringIndex < 12 && positionInRing < 12) {
      ringsWithPositions[ringIndex][positionInRing] = {
        index: pixel.index,
        relPos: pixel.relPos,
        position: positionInRing
      }
    }
  })

  return (
    <div className="ring-visualization">
      <div className="rings-container">
        {ringsWithPositions.map((ringPixels, ringIndex) => {
          const ringNumber = ringIndex + 1
          const isActive = !activeRings || activeRings.length === 0 || activeRings.includes(ringNumber)
          return (
          <div
            key={ringIndex}
            className={`small-ring ${!isActive ? 'small-ring-inactive' : ''}`}
            style={{
              '--ring-index': ringIndex,
            } as React.CSSProperties}
          >
            {ringPixels.map((pixel, positionInRing) => {
              if (!pixel) return null
              const pixelColor = useEffectPreview && timeframe
                ? (() => {
                    const { h, s, v } = getPixelColor(pixel.relPos, t, timeframe)
                    return hsvToRgbString(h, s, v)
                  })()
                : relPosToColor(pixel.relPos)
              return (
                <div
                  key={pixel.index}
                  className="ring-pixel"
                  style={{
                    backgroundColor: pixelColor,
                    color: pixelColor,
                    '--pixel-index': positionInRing,
                    '--ring-index': ringIndex,
                  } as React.CSSProperties}
                  title={`Ring ${ringIndex + 1}, Position ${positionInRing}, Index ${pixel.index}, Pos ${pixel.relPos.toFixed(3)}`}
                />
              )
            })}
          </div>
        )
        })}
      </div>
    </div>
  )
}

export default RingVisualization
