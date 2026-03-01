import React from 'react'
import segmentsData from '../segments.json'
import { getPixelColor, getPixelColorMulti, hsvToRgbString } from '../effectPreview'
import type { Timeframe } from '../App'
import { getTimeframeEffects } from '../App'
import { getMovementRingT } from '../movementGenerators'
import './RingVisualization.css'

interface RingVisualizationProps {
  mapping: string
  /** Ring numbers (1-12) that are active; rings not in this list are dimmed. Omit to show all. */
  activeRings?: number[]
  /** When set with currentTime, playback effect preview is shown (brightness/hue/motion over time). */
  timeframe?: Timeframe | null
  /** Multiple active timeframes for merged playback preview. Overrides single timeframe when set. */
  timeframes?: Timeframe[]
  /** Current time in beats; with timeframe, used to compute effect phase t in [0,1]. */
  currentTime?: number
}

/** Compute normalized time t in [0,1] for a timeframe at a given currentTime in beats.
 *  When windowOverride is provided, t is computed within that window instead of the full timeframe. */
function computeT(tf: Timeframe, currentTime: number, windowOverride?: { start: number; end: number }): number {
  const start = windowOverride ? windowOverride.start : tf.startTime
  const end = windowOverride ? windowOverride.end : tf.endTime
  const duration = end - start
  if (duration <= 0) return 0
  const beatOffset = currentTime - start
  const cycles = tf.cycles ?? []
  if (cycles.length === 0) {
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
}

/** Compute t for a specific ring, accounting for movement timing.
 *  Returns null if the ring is not active at currentTime per the movement. */
function computeRingT(tf: Timeframe, currentTime: number, ringNumber: number): number | null {
  if (!tf.movement) {
    if (!tf.rings.includes(ringNumber)) return null
    return computeT(tf, currentTime)
  }
  const mt = getMovementRingT(tf.startTime, tf.endTime, tf.rings, tf.movement, ringNumber, currentTime)
  if (!mt) return null
  return computeT(tf, currentTime, { start: mt.windowStart, end: mt.windowEnd })
}

const RingVisualization = ({
  mapping,
  activeRings,
  timeframe,
  timeframes,
  currentTime,
}: RingVisualizationProps) => {
  // Single-timeframe mode (backward compatible for TimeframePanel mapping preview)
  const singleTf = timeframe && !timeframes ? timeframe : null
  const useEffectPreview = Boolean(
    currentTime !== undefined &&
    (
      (singleTf && getTimeframeEffects(singleTf).some(e => e.effectKey !== '')) ||
      (timeframes && timeframes.length > 0)
    )
  )
  const t = singleTf && currentTime !== undefined ? computeT(singleTf, currentTime) : 0

  // Pre-build per-segment relPos lookup: segmentName → Map<pixelIndex, relPos>
  // Each timeframe may use a different mapping, so effects must be evaluated
  // with the relPos from that timeframe's own mapping segment.
  const segmentRelPosMap = React.useMemo(() => {
    const map = new Map<string, Map<number, number>>()
    for (const seg of segmentsData.segments) {
      const pixelMap = new Map<number, number>()
      for (const p of seg.pixels) {
        pixelMap.set(p.index, p.relPos)
      }
      map.set(seg.name, pixelMap)
    }
    return map
  }, [])

  /** Get relPos for a pixel index from a specific segment mapping. */
  const getRelPosForMapping = React.useCallback((pixelIndex: number, mappingName: string): number | null => {
    return segmentRelPosMap.get(mappingName)?.get(pixelIndex) ?? null
  }, [segmentRelPosMap])

  // Build a per-ring lookup: ringNumber (1-12) → all matching timeframes
  // With movement, a ring might be in tf.rings but not active at currentTime
  const ringToTimeframes: Map<number, Timeframe[]> = new Map()
  if (timeframes && currentTime !== undefined) {
    for (const tf of timeframes) {
      for (const ring of tf.rings) {
        if (computeRingT(tf, currentTime, ring) != null) {
          const arr = ringToTimeframes.get(ring)
          if (arr) arr.push(tf)
          else ringToTimeframes.set(ring, [tf])
        }
      }
    }
  }
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
              const pixelColor = useEffectPreview
                ? (() => {
                    // Multi-timeframe mode: find all timeframes for this ring
                    const ringTfs = ringToTimeframes.get(ringNumber)
                    if (ringTfs && ringTfs.length > 0) {
                      const tfWithT: Array<{ timeframe: Timeframe; t: number; relPos: number }> = []
                      for (const tf of ringTfs) {
                        const tfMapping = tf.mapping || 'all'
                        const rp = getRelPosForMapping(pixel.index, tfMapping)
                        if (rp == null) continue
                        const ringT = computeRingT(tf, currentTime!, ringNumber)
                        if (ringT == null) continue
                        tfWithT.push({ timeframe: tf, t: ringT, relPos: rp })
                      }
                      if (tfWithT.length === 0) return 'rgb(0, 0, 0)'
                      const { h, s, v } = tfWithT.length === 1
                        ? getPixelColor(tfWithT[0].relPos, tfWithT[0].t, tfWithT[0].timeframe, ringIndex)
                        : getPixelColorMulti(tfWithT, ringIndex)
                      return hsvToRgbString(h, s, v)
                    }
                    // Single-timeframe mode (mapping preview in TimeframePanel)
                    if (singleTf) {
                      const tfMapping = singleTf.mapping || 'all'
                      const tfRelPos = getRelPosForMapping(pixel.index, tfMapping) ?? pixel.relPos
                      const ringT = computeRingT(singleTf, currentTime!, ringNumber)
                      const { h, s, v } = getPixelColor(tfRelPos, ringT ?? t, singleTf, ringIndex)
                      return hsvToRgbString(h, s, v)
                    }
                    return 'rgb(0, 0, 0)'
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
