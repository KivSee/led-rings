import React, { useState, useEffect } from 'react'
import { Timeframe } from '../App'
import RingSelector from './RingSelector'
import './Timeline.css'

interface TimelineProps {
  timeframes: Timeframe[]
  songLengthBeats: number
  onUpdate: (id: string, updates: Partial<Timeframe>) => void
  onDelete: (id: string) => void
  onAdd: (startTime: number, endTime: number) => void
  focusedTimeframeId: string | null
  onFocusedTimeframeChange: (id: string | null) => void
  currentTime: number
  onCurrentTimeChange: (time: number) => void
}

const Timeline = ({ timeframes, songLengthBeats, onUpdate, onDelete, onAdd, focusedTimeframeId, onFocusedTimeframeChange, currentTime, onCurrentTimeChange }: TimelineProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'label' | 'startTime' | 'endTime' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragCurrent, setDragCurrent] = useState<number | null>(null)
  const [resizingTimeframeId, setResizingTimeframeId] = useState<string | null>(null)
  const [resizingEdge, setResizingEdge] = useState<'start' | 'end' | null>(null)
  const [isDraggingTimeIndicator, setIsDraggingTimeIndicator] = useState(false)
  const timelineScrollViewRef = React.useRef<HTMLDivElement>(null)
  const timelineWrapperRef = React.useRef<HTMLDivElement>(null)
  const [visibleHeightPx, setVisibleHeightPx] = useState<number>(600)

  const maxTime = Math.max(songLengthBeats, 4)
  const BEATS_PER_SCREEN = 64

  // Fixed scale: 64 beats = one screen height. Measure the scroll viewport.
  useEffect(() => {
    const scrollEl = timelineScrollViewRef.current
    if (!scrollEl) return
    const update = () => {
      const h = scrollEl.clientHeight
      if (Number.isFinite(h) && h > 0) setVisibleHeightPx(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(scrollEl)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const handleTimeframeClick = (id: string, field: 'label' | 'startTime' | 'endTime') => {
    setEditingId(id)
    setEditingField(field)
  }

  const handleBlur = () => {
    setEditingId(null)
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, _id: string) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  const handleInputChange = (
    id: string,
    field: 'label' | 'startTime' | 'endTime',
    value: string | number
  ) => {
    if (field === 'label') {
      onUpdate(id, { label: value as string })
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue)) {
        const snappedValue = snapToBeat(numValue)
        onUpdate(id, { [field]: snappedValue })
      }
    }
  }

  // Fixed scale: 64 beats fill the visible screen; 1 beat = pxPerBeat pixels
  const pxPerBeat = visibleHeightPx / BEATS_PER_SCREEN
  const wrapperHeightPx = pxPerBeat * Math.max(maxTime, BEATS_PER_SCREEN)

  const getTimeframePosition = (timeframe: Timeframe) => {
    const topPx = timeframe.startTime * pxPerBeat
    const heightPx = (timeframe.endTime - timeframe.startTime) * pxPerBeat
    return { topPx, heightPx }
  }

  const getTimeframeTypographyVars = (heightPx: number): React.CSSProperties => {
    const safeHeightPx = Math.max(0, heightPx)
    const targetPx = 110
    const scale = Math.max(0.5, Math.min(1, safeHeightPx / targetPx))
    const compactBoost = safeHeightPx < 70 ? 0.9 : 1
    const s = scale * compactBoost

    const padY = 8 * s
    const padX = 12 * s
    const gap = 1.5 * s
    const headerGap = 1 * s

    const labelSize = 14 * s
    const timesSize = 12 * s
    const ringsSize = 12 * s

    return {
      ['--tf-pad-y' as any]: `${Math.max(1, padY)}px`,
      ['--tf-pad-x' as any]: `${Math.max(4, padX)}px`,
      ['--tf-gap' as any]: `${Math.max(0, gap)}px`,
      ['--tf-header-gap' as any]: `${Math.max(0, headerGap)}px`,
      ['--tf-label-size' as any]: `${Math.max(10, labelSize)}px`,
      ['--tf-times-size' as any]: `${Math.max(9, timesSize)}px`,
      ['--tf-rings-size' as any]: `${Math.max(9, ringsSize)}px`,
    }
  }

  const checkOverlap = (tf1: Timeframe, tf2: Timeframe): boolean => {
    return !(tf1.endTime <= tf2.startTime || tf1.startTime >= tf2.endTime)
  }

  const getTimeframeOffset = (timeframe: Timeframe, index: number): number => {
    // Find all timeframes that overlap with this one
    const overlapping = timeframes
      .map((tf, idx) => ({ tf, idx }))
      .filter(({ tf, idx }) => idx !== index && checkOverlap(timeframe, tf))
    
    if (overlapping.length === 0) {
      return 0
    }

    // Count how many overlapping timeframes come before this one
    const overlappingBefore = overlapping.filter(({ idx }) => idx < index).length
    
    // Calculate offset: alternate between left and right offsets
    // Each overlapping timeframe gets 30px offset
    const offsetAmount = 30
    const totalOffset = overlappingBefore * offsetAmount
    
    // Alternate direction: even index goes right (positive), odd goes left (negative)
    return overlappingBefore % 2 === 0 ? totalOffset : -totalOffset
  }

  const snapToBeat = (beat: number): number => {
    return Math.round(beat / 4) * 4
  }

  const yToBeat = (y: number): number => {
    if (!timelineWrapperRef.current || pxPerBeat <= 0) return 0
    const rect = timelineWrapperRef.current.getBoundingClientRect()
    const relativeY = y - rect.top
    const beat = Math.max(0, Math.min(maxTime, relativeY / pxPerBeat))
    return snapToBeat(beat)
  }

  const handleTimeframeFocus = (timeframeId: string, e: React.MouseEvent) => {
    // Don't focus if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('.resize-handle') || 
        target.closest('input') || 
        target.closest('button') ||
        target.closest('.ring-selector')) {
      return
    }
    onFocusedTimeframeChange(timeframeId)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Don't start drag if clicking on time indicator - handle this first
    if (target.closest('.current-time-indicator') || target.closest('.current-time-indicator-handle')) {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingTimeIndicator(true)
      const beat = yToBeat(e.clientY)
      onCurrentTimeChange(Math.max(0, Math.min(beat, maxTime)))
      return
    }
    
    // Check if clicking on a resize handle
    const resizeHandle = target.closest('.resize-handle')
    if (resizeHandle) {
      const timeframeElement = resizeHandle.closest('.timeframe') as HTMLElement
      if (timeframeElement) {
        const timeframeId = timeframeElement.dataset.timeframeId
        const edge = resizeHandle.classList.contains('resize-handle-top') ? 'start' : 'end'
        if (timeframeId) {
          e.preventDefault()
          e.stopPropagation()
          setIsDragging(true)
          setResizingTimeframeId(timeframeId)
          setResizingEdge(edge)
          setDragStart(yToBeat(e.clientY))
          setDragCurrent(yToBeat(e.clientY))
          onFocusedTimeframeChange(timeframeId)
          return
        }
      }
    }

    // Don't start drag if clicking on a timeframe content or time marks
    if (target.closest('.timeframe-content') || target.closest('.time-mark')) {
      return
    }

    // Unfocus if clicking on empty space
    if (!target.closest('.timeframe')) {
      onFocusedTimeframeChange(null)
    }

    // Create new segment
    const beat = yToBeat(e.clientY)
    setIsDragging(true)
    setDragStart(beat)
    setDragCurrent(beat)
    setResizingTimeframeId(null)
    setResizingEdge(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return
    const beat = yToBeat(e.clientY)
    setDragCurrent(beat)
  }

  const handleMouseUp = () => {
    if (isDraggingTimeIndicator) {
      setIsDraggingTimeIndicator(false)
      return
    }
    if (!isDragging) {
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      setResizingTimeframeId(null)
      setResizingEdge(null)
      return
    }

    if (resizingTimeframeId && resizingEdge && dragCurrent !== null) {
      const timeframe = timeframes.find(tf => tf.id === resizingTimeframeId)
      if (timeframe) {
        const newBeat = dragCurrent
        if (resizingEdge === 'start') {
          // Ensure start doesn't go past end, maintain at least 4 beats difference
          const newStart = Math.min(newBeat, timeframe.endTime - 4)
          onUpdate(resizingTimeframeId, { startTime: newStart })
        } else {
          // Ensure end doesn't go before start, maintain at least 4 beats difference
          const newEnd = Math.max(newBeat, timeframe.startTime + 4)
          onUpdate(resizingTimeframeId, { endTime: newEnd })
        }
      }
    } else if (dragStart !== null && dragCurrent !== null) {
      // Creating new segment
      const startBeat = Math.min(dragStart, dragCurrent)
      const endBeat = Math.max(dragStart, dragCurrent)

      // Only create if there's at least 4 beats difference
      if (Math.abs(endBeat - startBeat) >= 4) {
        onAdd(startBeat, endBeat)
      }
    }

    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
    setResizingTimeframeId(null)
    setResizingEdge(null)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingTimeIndicator) {
        if (!timelineWrapperRef.current || pxPerBeat <= 0) return
        const rect = timelineWrapperRef.current.getBoundingClientRect()
        const relativeY = e.clientY - rect.top
        const beat = Math.max(0, Math.min(maxTime, relativeY / pxPerBeat))
        onCurrentTimeChange(beat)
        return
      }
      if (!isDragging) return
      const beat = yToBeat(e.clientY)
      setDragCurrent(beat)

      // Update timeframe in real-time while resizing
      if (resizingTimeframeId && resizingEdge) {
        const timeframe = timeframes.find(tf => tf.id === resizingTimeframeId)
        if (timeframe) {
          if (resizingEdge === 'start') {
            // Ensure start doesn't go past end, maintain at least 4 beats difference
            const newStart = Math.min(beat, timeframe.endTime - 4)
            onUpdate(resizingTimeframeId, { startTime: newStart })
          } else {
            // Ensure end doesn't go before start, maintain at least 4 beats difference
            const newEnd = Math.max(beat, timeframe.startTime + 4)
            onUpdate(resizingTimeframeId, { endTime: newEnd })
          }
        }
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingTimeIndicator) {
        setIsDraggingTimeIndicator(false)
        return
      }
      if (!isDragging) {
        setIsDragging(false)
        setDragStart(null)
        setDragCurrent(null)
        setResizingTimeframeId(null)
        setResizingEdge(null)
        return
      }

      if (resizingTimeframeId && resizingEdge && dragCurrent !== null) {
        const timeframe = timeframes.find(tf => tf.id === resizingTimeframeId)
        if (timeframe) {
          const newBeat = dragCurrent
          if (resizingEdge === 'start') {
            // Ensure start doesn't go past end, maintain at least 4 beats difference
            const newStart = Math.min(newBeat, timeframe.endTime - 4)
            onUpdate(resizingTimeframeId, { startTime: newStart })
          } else {
            // Ensure end doesn't go before start, maintain at least 4 beats difference
            const newEnd = Math.max(newBeat, timeframe.startTime + 4)
            onUpdate(resizingTimeframeId, { endTime: newEnd })
          }
        }
      } else if (dragStart !== null && dragCurrent !== null) {
        const startBeat = Math.min(dragStart, dragCurrent)
        const endBeat = Math.max(dragStart, dragCurrent)

        // Only create if there's at least 4 beats difference
        if (Math.abs(endBeat - startBeat) >= 4) {
          onAdd(startBeat, endBeat)
        }
      }

      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      setResizingTimeframeId(null)
      setResizingEdge(null)
    }

    if (isDragging || isDraggingTimeIndicator) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, isDraggingTimeIndicator, dragStart, dragCurrent, resizingTimeframeId, resizingEdge, timeframes, onAdd, onUpdate, maxTime, onCurrentTimeChange])

  const dragStartBeat = dragStart !== null ? dragStart : 0
  const dragEndBeat = dragCurrent !== null ? dragCurrent : dragStartBeat
  const dragStartPos = Math.min(dragStartBeat, dragEndBeat)
  const dragEndPos = Math.max(dragStartBeat, dragEndBeat)

  return (
    <div className="timeline-container">
      <div className="timeline-scroll-view" ref={timelineScrollViewRef}>
        <div 
          className="timeline-wrapper"
          ref={timelineWrapperRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            height: `${wrapperHeightPx}px`,
          }}
        >
        <div className="timeline-line"></div>
        <div className="timeframes">
          {timeframes.map((timeframe, index) => {
            const { topPx, heightPx } = getTimeframePosition(timeframe)
            const isEditing = editingId === timeframe.id
            const offset = getTimeframeOffset(timeframe, index)
            const isFocused = focusedTimeframeId === timeframe.id
            const typographyVars = getTimeframeTypographyVars(heightPx)

            return (
              <div
                key={timeframe.id}
                className={`timeframe ${isFocused ? 'timeframe-focused' : ''}`}
                data-timeframe-id={timeframe.id}
                onClick={(e) => handleTimeframeFocus(timeframe.id, e)}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  backgroundColor: timeframe.color,
                  transform: offset !== 0 ? `translateX(${offset}px)` : undefined,
                  zIndex: isFocused ? 10000 : 1 + index,
                  ...typographyVars,
                }}
              >
                <div className="resize-handle resize-handle-top" title="Drag to resize start"></div>
                <div className="resize-handle resize-handle-bottom" title="Drag to resize end"></div>
                <div className="timeframe-content">
                  <div className="timeframe-header">
                    {isEditing && editingField === 'label' ? (
                      <input
                        type="text"
                        value={timeframe.label}
                        onChange={(e) => handleInputChange(timeframe.id, 'label', e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => handleKeyDown(e, timeframe.id)}
                        className="timeframe-input"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="timeframe-label"
                        onClick={() => handleTimeframeClick(timeframe.id, 'label')}
                      >
                        {timeframe.label}
                      </span>
                    )}
                    <button
                      className="delete-button"
                      onClick={() => onDelete(timeframe.id)}
                      title="Delete timeframe"
                    >
                      ×
                    </button>
                  </div>
                  <div className="timeframe-times">
                    {isEditing && editingField === 'startTime' ? (
                      <input
                        type="number"
                        value={timeframe.startTime}
                        onChange={(e) => handleInputChange(timeframe.id, 'startTime', e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => handleKeyDown(e, timeframe.id)}
                        className="timeframe-input-small"
                        autoFocus
                        step="1"
                      />
                    ) : (
                      <span
                        className="timeframe-time"
                        onClick={() => handleTimeframeClick(timeframe.id, 'startTime')}
                      >
                        {timeframe.startTime}b
                      </span>
                    )}
                    <span className="timeframe-separator">→</span>
                    {isEditing && editingField === 'endTime' ? (
                      <input
                        type="number"
                        value={timeframe.endTime}
                        onChange={(e) => handleInputChange(timeframe.id, 'endTime', e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => handleKeyDown(e, timeframe.id)}
                        className="timeframe-input-small"
                        autoFocus
                        step="1"
                      />
                    ) : (
                      <span
                        className="timeframe-time"
                        onClick={() => handleTimeframeClick(timeframe.id, 'endTime')}
                      >
                        {timeframe.endTime}b
                      </span>
                    )}
                  </div>
                  <RingSelector
                    rings={timeframe.rings}
                    onChange={(rings) => onUpdate(timeframe.id, { rings })}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {isDragging && dragStart !== null && dragCurrent !== null && (
          <div
            className="timeframe timeframe-dragging"
            style={{
              top: `${dragStartPos * pxPerBeat}px`,
              height: `${(dragEndPos - dragStartPos) * pxPerBeat}px`,
              backgroundColor: 'rgba(102, 126, 234, 0.3)',
              border: '2px dashed #667eea',
            }}
          >
            <div className="timeframe-content">
              <div className="timeframe-header">
                <span className="timeframe-label">New Segment</span>
              </div>
              <div className="timeframe-times">
                <span className="timeframe-time">{dragStartPos}b</span>
                <span className="timeframe-separator">→</span>
                <span className="timeframe-time">{dragEndPos}b</span>
              </div>
            </div>
          </div>
        )}
        <div className="time-marks">
          {Array.from({ length: Math.ceil(maxTime / 4) + 1 }, (_, i) => i * 4).map((beat) => {
            const isLarge = beat % 16 === 0
            return (
              <div
                key={beat}
                className={`time-mark ${isLarge ? 'time-mark-large' : ''}`}
                style={{ top: `${beat * pxPerBeat}px` }}
              >
                <div className={`time-mark-line ${isLarge ? 'time-mark-line-large' : ''}`}></div>
                <span className={`time-mark-label ${isLarge ? 'time-mark-label-large' : ''}`}>{beat}b</span>
              </div>
            )
          })}
        </div>
        {/* Current time indicator */}
        <div
          className="current-time-indicator"
          style={{ top: `${currentTime * pxPerBeat}px` }}
        >
          <div className="current-time-indicator-line"></div>
          <div 
            className="current-time-indicator-handle"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDraggingTimeIndicator(true)
            }}
          ></div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
