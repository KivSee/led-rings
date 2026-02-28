import React, { useState, useEffect, useMemo } from 'react'
import { Timeframe, TimeframeCycleEntry, getTimeframeEffects } from '../App'
import { ringsToDisplayLabel } from '../generateSequenceTs'
import './Timeline.css'

function formatCyclesLine(cycles: TimeframeCycleEntry[]): string {
  return cycles
    .map((c) =>
      c.type === 'cycle'
        ? `cycle(${c.beatsInCycle})`
        : `cycleBeats(${c.beatsInCycle}, ${c.startBeat}, ${c.endBeat})`
    )
    .join(', ')
}

interface TimelineProps {
  timeframes: Timeframe[]
  songLengthBeats: number
  bpm: number
  onUpdate: (id: string, updates: Partial<Timeframe>) => void
  onDelete: (id: string) => void
  onAdd: (startTime: number, endTime: number) => void
  onCopy?: (id: string) => void
  onPaste?: (beat: number) => void
  hasClipboard?: boolean
  focusedTimeframeId: string | null
  onFocusedTimeframeChange: (id: string | null) => void
  currentTime: number
  onCurrentTimeChange: (time: number) => void
  /** First visible beat (from unified view range). */
  viewStartBeat: number
  /** Number of beats visible on screen (from unified view range). */
  beatsPerScreen: number
  /** Scroll the unified view to a specific start beat. */
  onScrollTo: (startBeat: number) => void
  /** Zoom at a beat with anchor fraction (0=top, 1=bottom). */
  onZoomAt: (direction: 'in' | 'out', anchorBeat: number, anchorFraction: number) => void
  /** Pan by a delta in beats. */
  onPanBy: (deltaBeats: number) => void
  /** When user clicks the timeline axis (time marks), seek marker and Run from to this beat. */
  onSeekToBeat?: (beat: number) => void
  /** Detected beat timestamps in milliseconds. When present, seconds labels use actual detected times. */
  beatTimestampsMs?: number[]
}

const beatToSeconds = (beat: number, bpm: number, beatTimestampsMs?: number[]): number => {
  if (beatTimestampsMs && beatTimestampsMs.length > 0 && beat >= 0) {
    if (beat < beatTimestampsMs.length) return beatTimestampsMs[beat] / 1000
    // Extrapolate beyond detected beats
    const last = beatTimestampsMs[beatTimestampsMs.length - 1]
    const avg = beatTimestampsMs.length > 1 ? last / (beatTimestampsMs.length - 1) : 60 / bpm
    return (last + (beat - (beatTimestampsMs.length - 1)) * avg) / 1000
  }
  return (beat / bpm) * 60
}

const Timeline = ({ timeframes, songLengthBeats, bpm, onUpdate, onDelete, onAdd, onCopy, onPaste, hasClipboard, focusedTimeframeId, onFocusedTimeframeChange, currentTime, onCurrentTimeChange, viewStartBeat, beatsPerScreen, onScrollTo, onZoomAt, onPanBy: _onPanBy, onSeekToBeat, beatTimestampsMs }: TimelineProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'label' | 'startTime' | 'endTime' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragCurrent, setDragCurrent] = useState<number | null>(null)
  const [resizingTimeframeId, setResizingTimeframeId] = useState<string | null>(null)
  const [resizingEdge, setResizingEdge] = useState<'start' | 'end' | null>(null)
  const [movingTimeframeId, setMovingTimeframeId] = useState<string | null>(null)
  const [moveStartBeat, setMoveStartBeat] = useState<number | null>(null)
  const [moveOriginalStart, setMoveOriginalStart] = useState<number | null>(null)
  const [moveOriginalEnd, setMoveOriginalEnd] = useState<number | null>(null)
  const [isDraggingTimeIndicator, setIsDraggingTimeIndicator] = useState(false)
  const timelineScrollViewRef = React.useRef<HTMLDivElement>(null)
  const timelineWrapperRef = React.useRef<HTMLDivElement>(null)
  const [visibleHeightPx, setVisibleHeightPx] = useState<number>(600)
  const isProgrammaticScrollRef = React.useRef(false)

  const maxTime = Math.max(songLengthBeats, 4)

  const handleZoomIn = () => {
    const centerBeat = viewStartBeat + beatsPerScreen / 2
    onZoomAt('in', centerBeat, 0.5)
  }
  const handleZoomOut = () => {
    const centerBeat = viewStartBeat + beatsPerScreen / 2
    onZoomAt('out', centerBeat, 0.5)
  }

  // Measure the scroll viewport height
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

  const pxPerBeat = visibleHeightPx / beatsPerScreen

  // Drive scrollTop from unified viewStartBeat
  useEffect(() => {
    const scrollEl = timelineScrollViewRef.current
    if (!scrollEl || pxPerBeat <= 0) return
    const targetScrollTop = viewStartBeat * pxPerBeat
    if (Math.abs(scrollEl.scrollTop - targetScrollTop) >= 1) {
      isProgrammaticScrollRef.current = true
      scrollEl.scrollTop = targetScrollTop
    }
  }, [viewStartBeat, pxPerBeat])

  // User scroll -> feed back to shared onScrollTo
  useEffect(() => {
    const scrollEl = timelineScrollViewRef.current
    if (!scrollEl || pxPerBeat <= 0) return
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false
        return
      }
      const startBeat = scrollEl.scrollTop / pxPerBeat
      onScrollTo(startBeat)
    }
    scrollEl.addEventListener('scroll', handleScroll)
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [pxPerBeat, onScrollTo])

  // Ctrl+wheel zoom on timeline
  useEffect(() => {
    const scrollEl = timelineScrollViewRef.current
    if (!scrollEl) return
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const rect = scrollEl.getBoundingClientRect()
        const fraction = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
        const anchorBeat = viewStartBeat + fraction * beatsPerScreen
        onZoomAt(e.deltaY < 0 ? 'in' : 'out', anchorBeat, fraction)
      }
      // Plain scroll: let native scrollbar handle it (which triggers handleScroll above)
    }
    scrollEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => scrollEl.removeEventListener('wheel', handleWheel)
  }, [viewStartBeat, beatsPerScreen, onZoomAt])

  // Ctrl+keyboard zoom on timeline (when hovered)
  useEffect(() => {
    const scrollEl = timelineScrollViewRef.current
    if (!scrollEl) return
    let isHovered = false
    const onEnter = () => { isHovered = true }
    const onLeave = () => { isHovered = false }
    scrollEl.addEventListener('mouseenter', onEnter)
    scrollEl.addEventListener('mouseleave', onLeave)
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isHovered || (!e.ctrlKey && !e.metaKey)) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        const centerBeat = viewStartBeat + beatsPerScreen / 2
        onZoomAt('in', centerBeat, 0.5)
      } else if (e.key === '-') {
        e.preventDefault()
        const centerBeat = viewStartBeat + beatsPerScreen / 2
        onZoomAt('out', centerBeat, 0.5)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      scrollEl.removeEventListener('mouseenter', onEnter)
      scrollEl.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [viewStartBeat, beatsPerScreen, onZoomAt])

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

  const wrapperHeightPx = pxPerBeat * Math.max(maxTime, beatsPerScreen)

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

  // Compute lane assignments for all timeframes using greedy interval scheduling.
  // Timeframes in the same connected component share a column count equal to
  // the max concurrent overlap depth, and non-overlapping timeframes reuse lanes.
  const timeframeLanes = useMemo(() => {
    const n = timeframes.length
    const result = new Map<number, { lane: number; totalLanes: number }>()
    if (n === 0) return result

    const checkOverlap = (tf1: Timeframe, tf2: Timeframe): boolean =>
      !(tf1.endTime <= tf2.startTime || tf1.startTime >= tf2.endTime)

    // Build overlap adjacency
    const adj: Set<number>[] = Array.from({ length: n }, () => new Set())
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (checkOverlap(timeframes[i], timeframes[j])) {
          adj[i].add(j)
          adj[j].add(i)
        }
      }
    }

    // Find connected components via BFS
    const compId = new Array(n).fill(-1)
    let numComps = 0
    for (let i = 0; i < n; i++) {
      if (compId[i] !== -1) continue
      const queue = [i]
      compId[i] = numComps
      while (queue.length > 0) {
        const curr = queue.shift()!
        for (const j of adj[curr]) {
          if (compId[j] === -1) { compId[j] = numComps; queue.push(j) }
        }
      }
      numComps++
    }

    // For each component, sort by start time and greedily assign lanes
    for (let comp = 0; comp < numComps; comp++) {
      const members: number[] = []
      for (let i = 0; i < n; i++) {
        if (compId[i] === comp) members.push(i)
      }
      members.sort((a, b) => timeframes[a].startTime - timeframes[b].startTime || a - b)

      const lanes: number[][] = [] // each lane holds indices of its assigned timeframes
      for (const idx of members) {
        let assigned = false
        for (let lane = 0; lane < lanes.length; lane++) {
          const lastIdx = lanes[lane][lanes[lane].length - 1]
          if (!checkOverlap(timeframes[idx], timeframes[lastIdx])) {
            lanes[lane].push(idx)
            result.set(idx, { lane, totalLanes: 0 })
            assigned = true
            break
          }
        }
        if (!assigned) {
          lanes.push([idx])
          result.set(idx, { lane: lanes.length - 1, totalLanes: 0 })
        }
      }

      const totalLanes = lanes.length
      for (const idx of members) {
        result.get(idx)!.totalLanes = totalLanes
      }
    }

    return result
  }, [timeframes])

  const snapToBeat = (beat: number): number => {
    return Math.round(beat)
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
        target.closest('button')) {
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

    // Check if clicking on a timeframe body (not resize handle, input, button) -> start move
    const timeframeElement = target.closest('.timeframe') as HTMLElement
    if (
      timeframeElement &&
      !target.closest('.resize-handle') &&
      !target.closest('input') &&
      !target.closest('button')
    ) {
      const timeframeId = timeframeElement.dataset.timeframeId
      const timeframe = timeframeId ? timeframes.find(tf => tf.id === timeframeId) : null
      if (timeframeId && timeframe) {
        e.preventDefault()
        e.stopPropagation()
        const beat = yToBeat(e.clientY)
        setIsDragging(true)
        setMovingTimeframeId(timeframeId)
        setMoveStartBeat(beat)
        setMoveOriginalStart(timeframe.startTime)
        setMoveOriginalEnd(timeframe.endTime)
        setDragCurrent(beat)
        onFocusedTimeframeChange(timeframeId)
        return
      }
    }

    if (target.closest('.time-mark') || target.closest('.timeline-line')) {
      const beat = Math.max(0, Math.min(maxTime, yToBeat(e.clientY)))
      onSeekToBeat?.(beat)
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
      setMovingTimeframeId(null)
      setMoveStartBeat(null)
      setMoveOriginalStart(null)
      setMoveOriginalEnd(null)
      return
    }

    if (movingTimeframeId && moveStartBeat !== null && moveOriginalStart !== null && moveOriginalEnd !== null && dragCurrent !== null) {
      const duration = moveOriginalEnd - moveOriginalStart
      const deltaBeat = dragCurrent - moveStartBeat
      let newStart = snapToBeat(moveOriginalStart + deltaBeat)
      newStart = Math.max(0, Math.min(maxTime - duration, newStart))
      const newEnd = newStart + duration
      onUpdate(movingTimeframeId, { startTime: newStart, endTime: newEnd })
    } else if (resizingTimeframeId && resizingEdge && dragCurrent !== null) {
      const timeframe = timeframes.find(tf => tf.id === resizingTimeframeId)
      if (timeframe) {
        const newBeat = dragCurrent
        if (resizingEdge === 'start') {
          // Ensure start doesn't go past end, maintain at least 4 beats difference
          const newStart = Math.min(newBeat, timeframe.endTime - 1)
          onUpdate(resizingTimeframeId, { startTime: newStart })
        } else {
          // Ensure end doesn't go before start, maintain at least 4 beats difference
          const newEnd = Math.max(newBeat, timeframe.startTime + 1)
          onUpdate(resizingTimeframeId, { endTime: newEnd })
        }
      }
    } else if (dragStart !== null && dragCurrent !== null) {
      // Creating new segment
      const startBeat = Math.min(dragStart, dragCurrent)
      const endBeat = Math.max(dragStart, dragCurrent)

      // Only create if there's at least 1 beat difference
      if (Math.abs(endBeat - startBeat) >= 1) {
        onAdd(startBeat, endBeat)
      } else if (hasClipboard && onPaste) {
        // Short click with clipboard → paste at this beat
        onPaste(snapToBeat(startBeat))
      }
    }

    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
    setResizingTimeframeId(null)
    setResizingEdge(null)
    setMovingTimeframeId(null)
    setMoveStartBeat(null)
    setMoveOriginalStart(null)
    setMoveOriginalEnd(null)
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
            const newStart = Math.min(beat, timeframe.endTime - 1)
            onUpdate(resizingTimeframeId, { startTime: newStart })
          } else {
            // Ensure end doesn't go before start, maintain at least 4 beats difference
            const newEnd = Math.max(beat, timeframe.startTime + 1)
            onUpdate(resizingTimeframeId, { endTime: newEnd })
          }
        }
      }

      // Update timeframe position in real-time while moving
      if (movingTimeframeId && moveStartBeat !== null && moveOriginalStart !== null && moveOriginalEnd !== null) {
        const duration = moveOriginalEnd - moveOriginalStart
        const deltaBeat = beat - moveStartBeat
        let newStart = snapToBeat(moveOriginalStart + deltaBeat)
        newStart = Math.max(0, Math.min(maxTime - duration, newStart))
        const newEnd = newStart + duration
        onUpdate(movingTimeframeId, { startTime: newStart, endTime: newEnd })
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
        setMovingTimeframeId(null)
        setMoveStartBeat(null)
        setMoveOriginalStart(null)
        setMoveOriginalEnd(null)
        return
      }

      if (movingTimeframeId && moveStartBeat !== null && moveOriginalStart !== null && moveOriginalEnd !== null && dragCurrent !== null) {
        const duration = moveOriginalEnd - moveOriginalStart
        const deltaBeat = dragCurrent - moveStartBeat
        let newStart = snapToBeat(moveOriginalStart + deltaBeat)
        newStart = Math.max(0, Math.min(maxTime - duration, newStart))
        const newEnd = newStart + duration
        onUpdate(movingTimeframeId, { startTime: newStart, endTime: newEnd })
      } else if (resizingTimeframeId && resizingEdge && dragCurrent !== null) {
        const timeframe = timeframes.find(tf => tf.id === resizingTimeframeId)
        if (timeframe) {
          const newBeat = dragCurrent
          if (resizingEdge === 'start') {
            // Ensure start doesn't go past end, maintain at least 4 beats difference
            const newStart = Math.min(newBeat, timeframe.endTime - 1)
            onUpdate(resizingTimeframeId, { startTime: newStart })
          } else {
            // Ensure end doesn't go before start, maintain at least 4 beats difference
            const newEnd = Math.max(newBeat, timeframe.startTime + 1)
            onUpdate(resizingTimeframeId, { endTime: newEnd })
          }
        }
      } else if (dragStart !== null && dragCurrent !== null) {
        const startBeat = Math.min(dragStart, dragCurrent)
        const endBeat = Math.max(dragStart, dragCurrent)

        // Only create if there's at least 4 beats difference
        if (Math.abs(endBeat - startBeat) >= 1) {
          onAdd(startBeat, endBeat)
        }
      }

      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      setResizingTimeframeId(null)
      setResizingEdge(null)
      setMovingTimeframeId(null)
      setMoveStartBeat(null)
      setMoveOriginalStart(null)
      setMoveOriginalEnd(null)
    }

    if (isDragging || isDraggingTimeIndicator) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, isDraggingTimeIndicator, dragStart, dragCurrent, resizingTimeframeId, resizingEdge, movingTimeframeId, moveStartBeat, moveOriginalStart, moveOriginalEnd, timeframes, onAdd, onUpdate, maxTime, onCurrentTimeChange])

  const dragStartBeat = dragStart !== null ? dragStart : 0
  const dragEndBeat = dragCurrent !== null ? dragCurrent : dragStartBeat
  const dragStartPos = Math.min(dragStartBeat, dragEndBeat)
  const dragEndPos = Math.max(dragStartBeat, dragEndBeat)

  return (
    <div className="timeline-container">
      <div className="timeline-zoom-controls">
        <button onClick={handleZoomIn} disabled={beatsPerScreen <= 4} title="Zoom in">+</button>
        <span className="timeline-zoom-label">{beatsPerScreen}b</span>
        <button onClick={handleZoomOut} disabled={beatsPerScreen >= 256} title="Zoom out">-</button>
      </div>
      <div className="timeline-scroll-view" ref={timelineScrollViewRef}>
        <div 
          className="timeline-wrapper"
          ref={timelineWrapperRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ 
            cursor: isDragging ? 'grabbing' : hasClipboard ? 'crosshair' : 'grab',
            height: `${wrapperHeightPx}px`,
          }}
        >
        <div className="timeline-line"></div>
        <div className="timeframes">
          {timeframes.map((timeframe, index) => {
            const { topPx, heightPx } = getTimeframePosition(timeframe)
            const isEditing = editingId === timeframe.id
            const laneInfo = timeframeLanes.get(index)
            const leftPct = laneInfo && laneInfo.totalLanes > 1 ? (laneInfo.lane / laneInfo.totalLanes) * 100 : 0
            const rightPct = laneInfo && laneInfo.totalLanes > 1 ? ((laneInfo.totalLanes - laneInfo.lane - 1) / laneInfo.totalLanes) * 100 : 0
            const isFocused = focusedTimeframeId === timeframe.id
            const typographyVars = getTimeframeTypographyVars(heightPx)

            return (
              <div
                key={timeframe.id}
                className={`timeframe ${isFocused ? 'timeframe-focused' : ''} ${timeframe.disabled ? 'timeframe-disabled' : ''}`}
                data-timeframe-id={timeframe.id}
                onClick={(e) => handleTimeframeFocus(timeframe.id, e)}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx}px`,
                  backgroundColor: timeframe.color,
                  left: leftPct > 0 ? `${leftPct}%` : undefined,
                  right: rightPct > 0 ? `${rightPct}%` : undefined,
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
                    {onCopy && (
                      <button
                        className="copy-button"
                        onClick={() => onCopy(timeframe.id)}
                        title="Copy timeframe"
                      >
                        ⎘
                      </button>
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
                    {(timeframe.cycles?.length ?? 0) > 0 && (
                      <span className="timeframe-cycles-inline">
                        , {formatCyclesLine(timeframe.cycles!)}
                      </span>
                    )}
                    <span className="timeframe-rings-inline">
                      , Rings: {ringsToDisplayLabel(timeframe.rings)}
                    </span>
                    <span className="timeframe-mapping-inline">
                      , Mapping: {timeframe.mapping ?? 'all'}
                    </span>
                    <span className="timeframe-effects-inline">
                      , Effects: {getTimeframeEffects(timeframe).map(e => e.effectKey).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {isDragging && dragStart !== null && dragCurrent !== null && !movingTimeframeId && (
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
            const sec = beatToSeconds(beat, bpm, beatTimestampsMs)
            const secLabel = sec % 1 === 0 ? `${sec}s` : `${sec.toFixed(1)}s`
            return (
              <div
                key={beat}
                className={`time-mark ${isLarge ? 'time-mark-large' : ''}`}
                style={{ top: `${beat * pxPerBeat}px` }}
              >
                <div className={`time-mark-line ${isLarge ? 'time-mark-line-large' : ''}`}></div>
                <span className={`time-mark-label ${isLarge ? 'time-mark-label-large' : ''}`}>
                  <span className="time-mark-sec">{secLabel}</span> {beat}b
                </span>
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
