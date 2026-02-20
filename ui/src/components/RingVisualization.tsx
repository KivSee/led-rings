import React from 'react'
import segmentsData from '../segments.json'
import { getPixelColor, hsvToRgbString } from '../effectPreview'
import type { Timeframe } from '../App'
import { getTimeframeEffects } from '../App'
import './RingVisualization.css'

interface RingVisualizationProps {
  mapping: string
  /** Ring numbers (1-12) that are active; rings not in this list are dimmed. Omit to show all. */
  activeRings?: number[]
  /** When set with currentTime, playback effect preview is shown (brightness/hue/motion over time). */
  timeframe?: Timeframe | null
  /** Current time in beats; with timeframe, used to compute effect phase t in [0,1]. */
  currentTime?: number
}

const RingVisualization = ({
  mapping,
  activeRings,
  timeframe,
  currentTime,
}: RingVisualizationProps) => {
  const useEffectPreview = Boolean(
    timeframe &&
    currentTime !== undefined &&
    (getTimeframeEffects(timeframe).some(e => e.effectKey !== ''))
  )
  const duration = timeframe ? timeframe.endTime - timeframe.startTime : 0
  const beatOffset = timeframe && currentTime !== undefined ? currentTime - timeframe.startTime : 0
  const cycles = timeframe?.cycles ?? []
  const hasCycles = cycles.length > 0
  // When cycle/cycleBeats are present, use the innermost cycle (index 0) to compute effective phase t
  const t = duration > 0 && currentTime !== undefined && timeframe
    ? (() => {
        if (!hasCycles) {
          return Math.max(0, Math.min(1, beatOffset / duration))
        }
        const c = cycles[0]!
        if (c.type === 'cycle') {
          return (beatOffset % c.beatsInCycle) / c.beatsInCycle
        }
        const phase = (beatOffset % c.beatsInCycle) / c.beatsInCycle
        const windowStart = c.startBeat / c.beatsInCycle
        const windowEnd = c.endBeat / c.beatsInCycle
        const windowLen = windowEnd - windowStart
        if (windowLen <= 0) return 0
        return Math.max(0, Math.min(1, (phase - windowStart) / windowLen))
      })()
    : 0
  // Convert relPos (0-1) to RGB color
  const relPosToColor = (relPos: number): string => {
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
