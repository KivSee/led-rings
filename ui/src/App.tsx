import React, { useState, useRef, useEffect } from 'react'
import Timeline from './components/Timeline'
import TimeframePanel from './components/TimeframePanel'
import PlaybackRingsPanel from './components/PlaybackRingsPanel'
import { generateSequenceTs } from './generateSequenceTs'
import './App.css'

/** cycle(beatsInCycle, cb) — full cycle */
export interface TimeframeCycle {
  type: 'cycle'
  beatsInCycle: number
}

/** cycleBeats(beatsInCycle, startBeat, endBeat, cb) — window within cycle */
export interface TimeframeCycleBeats {
  type: 'cycleBeats'
  beatsInCycle: number
  startBeat: number
  endBeat: number
}

export type TimeframeCycleEntry = TimeframeCycle | TimeframeCycleBeats

export interface Timeframe {
  id: string
  startTime: number
  endTime: number
  label: string
  color: string
  rings: number[] // Array of ring numbers (1-12) that participate
  mapping?: string // Segment mapping name from segments.json
  rainbow?: boolean // Whether to use rainbow coloring
  rainbowRange?: number // Rainbow cycle range (1 = full cycle, 2 = 2 cycles, 0.5 = half cycle)
  /** Optional list of cycle/cycleBeats wrapping this timeframe's content (outermost first) */
  cycles?: TimeframeCycleEntry[]
  brightnessEffect?: string
  brightnessEffectParams?: Record<string, number | boolean>
  hueEffect?: string
  hueEffectParams?: Record<string, number | boolean>
  motionEffect?: string
  motionEffectParams?: Record<string, number | boolean>
}

export type AnimationType = 'song' | 'trigger'

export interface Song {
  name: string
  /** Song length in seconds. Total beats = (lengthSeconds / 60) * bpm */
  lengthSeconds: number
  bpm: number
  startOffsetMs?: number
  /** When pressing Run, start playback at this time (seconds). */
  runStartTimeSeconds?: number
  /** Song = startSong() with offset; Trigger = trigger() one-shot. Affects generated .ts output. */
  animationType?: AnimationType
}

const LAST_SONG_STORAGE_KEY = 'timelineManager:lastSong'

function normalizeCycles(cycles: unknown): TimeframeCycleEntry[] | undefined {
  if (!Array.isArray(cycles) || cycles.length === 0) return undefined
  const out: TimeframeCycleEntry[] = []
  for (const c of cycles) {
    if (!c || typeof c !== 'object') continue
    if (c.type === 'cycle' && typeof c.beatsInCycle === 'number' && c.beatsInCycle > 0) {
      out.push({ type: 'cycle', beatsInCycle: c.beatsInCycle })
    } else if (
      c.type === 'cycleBeats' &&
      typeof c.beatsInCycle === 'number' && c.beatsInCycle > 0 &&
      typeof c.startBeat === 'number' &&
      typeof c.endBeat === 'number'
    ) {
      out.push({
        type: 'cycleBeats',
        beatsInCycle: c.beatsInCycle,
        startBeat: c.startBeat,
        endBeat: c.endBeat,
      })
    }
  }
  return out.length ? out : undefined
}

function App() {
  const snapToBeat = (beat: number): number => {
    return Math.round(beat / 4) * 4
  }

  // Ensure we don't overwrite saved state before we've tried loading it
  const hasLoadedInitialStateRef = useRef(false)

  const [song, setSong] = useState<Song>({
    name: 'New Song',
    lengthSeconds: 32,
    bpm: 120,
    startOffsetMs: 0,
    animationType: 'song',
  })

  const [timeframes, setTimeframes] = useState<Timeframe[]>([
    {
      id: '1',
      startTime: 0,
      endTime: 4,
      label: 'Introduction',
      color: '#3b82f6',
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: 'all'
    },
    {
      id: '2',
      startTime: 4,
      endTime: 12,
      label: 'Main Content',
      color: '#10b981',
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: 'all'
    },
    {
      id: '3',
      startTime: 12,
      endTime: 16,
      label: 'Conclusion',
      color: '#f59e0b',
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: 'all'
    }
  ])

  const [focusedTimeframeId, setFocusedTimeframeId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // Current time in beats
  /** When true, next Run starts from runStartTimeSeconds; when false, next Run resumes from currentTime (after Pause). */
  const [nextRunFromStart, setNextRunFromStart] = useState(true)
  const playbackIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const appContentRef = React.useRef<HTMLDivElement>(null)
  const songLengthBeats = Math.max(1, (song.lengthSeconds * song.bpm) / 60)

  // Resizable panel widths (px)
  const [playbackPanelWidth, setPlaybackPanelWidth] = useState(380)
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(350)
  const [resizing, setResizing] = useState<'playback' | 'details' | null>(null)

  useEffect(() => {
    if (!resizing) return
    const minPlayback = 240
    const maxPlayback = 600
    const minDetails = 240
    const maxDetails = 600
    const onMove = (e: MouseEvent) => {
      const el = appContentRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (resizing === 'playback') {
        const w = Math.round(Math.min(maxPlayback, Math.max(minPlayback, x)))
        setPlaybackPanelWidth(w)
      } else {
        const rightEdge = rect.width
        const w = Math.round(Math.min(maxDetails, Math.max(minDetails, rightEdge - x)))
        setDetailsPanelWidth(w)
      }
    }
    const onUp = () => setResizing(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing])

  const addTimeframe = () => {
    const lastEndTime = timeframes.length > 0 
      ? Math.max(...timeframes.map(t => t.endTime)) 
      : 0
    const newTimeframe: Timeframe = {
      id: Date.now().toString(),
      startTime: snapToBeat(lastEndTime),
      endTime: snapToBeat(lastEndTime + 4),
      label: `Timeframe ${timeframes.length + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: 'all'
    }
    setTimeframes([...timeframes, newTimeframe])
  }

  const updateTimeframe = (id: string, updates: Partial<Timeframe>) => {
    setTimeframes(timeframes.map(tf => 
      tf.id === id ? { ...tf, ...updates } : tf
    ))
  }

  const deleteTimeframe = (id: string) => {
    setTimeframes(timeframes.filter(tf => tf.id !== id))
    if (focusedTimeframeId === id) {
      setFocusedTimeframeId(null)
    }
  }

  const addTimeframeFromDrag = (startTime: number, endTime: number) => {
    const newTimeframe: Timeframe = {
      id: Date.now().toString(),
      startTime: Math.min(startTime, endTime),
      endTime: Math.max(startTime, endTime),
      label: `Timeframe ${timeframes.length + 1}`,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      mapping: 'all'
    }
    setTimeframes([...timeframes, newTimeframe])
  }

  const focusedTimeframe = timeframes.find(tf => tf.id === focusedTimeframeId) || null

  const handlePanelUpdate = (updates: Partial<Timeframe>) => {
    if (focusedTimeframeId) {
      updateTimeframe(focusedTimeframeId, updates)
    }
  }

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause: stop playback; next Run will resume from current position
      setNextRunFromStart(false)
      setIsPlaying(false)
    } else {
      // Run: if nextRunFromStart, jump to runStartTimeSeconds; otherwise resume from currentTime
      if (nextRunFromStart) {
        const startBeats = ((song.runStartTimeSeconds ?? 0) / 60) * song.bpm
        const clamped = Math.max(0, Math.min(songLengthBeats, startBeats))
        setCurrentTime(clamped)
        setNextRunFromStart(false)
      }
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    setIsPlaying(false)
    setNextRunFromStart(true) // Next Run will start from runStartTimeSeconds
    const startBeats = ((song.runStartTimeSeconds ?? 0) / 60) * song.bpm
    const clamped = Math.max(0, Math.min(songLengthBeats, startBeats))
    setCurrentTime(clamped)
  }

  const handleLoadTimeframes = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files && input.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)

        // Support: raw array (timeframes only), { timeframes: [...] }, or { song, timeframes }
        const maybeArray = Array.isArray(parsed) ? parsed : parsed?.timeframes

        if (parsed?.song && typeof parsed.song === 'object') {
          setSong(normalizeLoadedSong(parsed.song as Record<string, unknown>))
        }

        if (Array.isArray(maybeArray)) {
          const mapped: Timeframe[] = maybeArray
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any, idx: number) => ({
              id: item.id?.toString() ?? `tf-${Date.now()}-${idx}`,
              startTime: Number(item.startTime) || 0,
              endTime: Number(item.endTime) || 0,
              label: typeof item.label === 'string' ? item.label : `Timeframe ${idx + 1}`,
              color: typeof item.color === 'string' ? item.color : '#3b82f6',
              rings: Array.isArray(item.rings) ? item.rings.map((r: any) => Number(r)).filter((n: number) => !isNaN(n)) : [1,2,3,4,5,6,7,8,9,10,11,12],
              mapping: item.mapping,
              rainbow: item.rainbow,
              rainbowRange: item.rainbowRange,
              cycles: normalizeCycles(item.cycles),
              brightnessEffect: item.brightnessEffect,
              brightnessEffectParams: item.brightnessEffectParams && typeof item.brightnessEffectParams === 'object' ? item.brightnessEffectParams as Record<string, number | boolean> : undefined,
              hueEffect: item.hueEffect,
              hueEffectParams: item.hueEffectParams && typeof item.hueEffectParams === 'object' ? item.hueEffectParams as Record<string, number | boolean> : undefined,
              motionEffect: item.motionEffect,
              motionEffectParams: item.motionEffectParams && typeof item.motionEffectParams === 'object' ? item.motionEffectParams as Record<string, number | boolean> : undefined,
            }))
          setTimeframes(mapped)
        } else if (!parsed?.song) {
          console.error('Invalid file format: expected array of timeframes or { song, timeframes }')
          return
        }
        // If we have song but no timeframes array, leave timeframes unchanged

        setFocusedTimeframeId(null)
        setCurrentTime(0)
      } catch (err) {
        console.error('Failed to load timeframes file', err)
      }
    }
    input.click()
  }
  const handleSaveTimeframes = async () => {
    const payload = { song, timeframes }
    const dataStr = JSON.stringify(payload, null, 2)
    const safeName = (song.name || 'song').trim() || 'song'

    // Generate TypeScript implementation from current song + timeframes
    const tsCode = generateSequenceTs(song, timeframes)

    const downloadFile = (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    // Single save: pick folder (e.g. src/) and write both JSON and TS there
    const anyWindow = window as any
    if (anyWindow.showDirectoryPicker) {
      try {
        const dirHandle = await anyWindow.showDirectoryPicker({
          mode: 'readwrite',
        })
        const jsonFile = await dirHandle.getFileHandle(`${safeName}.json`, { create: true })
        const tsFile = await dirHandle.getFileHandle(`${safeName}.ts`, { create: true })
        const jsonWritable = await jsonFile.createWritable()
        const tsWritable = await tsFile.createWritable()
        await jsonWritable.write(dataStr)
        await tsWritable.write(tsCode)
        await jsonWritable.close()
        await tsWritable.close()
        return
      } catch {
        // User cancelled or error – fall back to downloads
      }
    }

    // Fallback: download both files (same song name, correct types)
    downloadFile(dataStr, `${safeName}.json`, 'application/json')
    downloadFile(tsCode, `${safeName}.ts`, 'text/typescript')
  }

  // Normalize loaded song to use lengthSeconds/runStartTimeSeconds (support old lengthBeats/runStartTimeBeats)
  const normalizeLoadedSong = (s: Record<string, unknown>): Song => {
    const bpm = Math.max(1, Number(s.bpm) || 120)
    const lengthSeconds =
      s.lengthSeconds != null
        ? Math.max(0.1, Number(s.lengthSeconds))
        : (Math.max(1, Number(s.lengthBeats) || 64) / bpm) * 60
    const runStartTimeSeconds =
      s.runStartTimeSeconds != null
        ? Math.max(0, Number(s.runStartTimeSeconds))
        : s.runStartTimeBeats != null
          ? (Number(s.runStartTimeBeats) / bpm) * 60
          : undefined
    return {
      name: typeof s.name === 'string' ? s.name : 'New Song',
      lengthSeconds,
      bpm,
      startOffsetMs: Math.max(0, Number(s.startOffsetMs) || 0),
      runStartTimeSeconds,
      animationType: (s.animationType === 'trigger' ? 'trigger' : 'song') as AnimationType,
    }
  }

  // Autoload last song on startup
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_SONG_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { song?: Record<string, unknown>; timeframes?: Timeframe[] }
      if (parsed.song && typeof parsed.song === 'object') {
        setSong(normalizeLoadedSong(parsed.song))
      }
      if (parsed.timeframes && Array.isArray(parsed.timeframes) && parsed.timeframes.length > 0) {
        setTimeframes(parsed.timeframes)
      }
    } catch {
      // Ignore corrupted data
    } finally {
      hasLoadedInitialStateRef.current = true
    }
  }, [])

  // Persist last worked-on song and its timeframes,
  // but only after we've attempted to load any existing data.
  useEffect(() => {
    if (!hasLoadedInitialStateRef.current) return
    try {
      const payload = JSON.stringify({ song, timeframes })
      window.localStorage.setItem(LAST_SONG_STORAGE_KEY, payload)
    } catch {
      // Ignore persistence errors
    }
  }, [song, timeframes])

  // Playback animation
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const maxTime = songLengthBeats
          const next = prev + 0.1 // Increment by 0.1 beats per frame (adjust for speed)
          return next >= maxTime ? 0 : next // Loop back to start
        })
      }, 50) // Update every 50ms
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [isPlaying, timeframes])

  // Clamp current time if song length shrinks
  useEffect(() => {
    if (currentTime > songLengthBeats) {
      setCurrentTime(songLengthBeats)
    }
  }, [songLengthBeats, currentTime])

  const handleSongChange = (updates: Partial<Song>) => {
    setSong(prev => ({
      ...prev,
      ...updates,
    }))
  }

  return (
    <div className={`app${resizing ? ' app-resizing' : ''}`}>
      <div className="app-header">
        <div className="app-header-title">
          <h1>Timeline Manager</h1>
          <div className="song-meta">
            <input
              type="text"
              className="song-name-input"
              value={song.name}
              onChange={(e) => handleSongChange({ name: e.target.value })}
              placeholder="Song name"
            />
            <div className="song-meta-fields">
              <label className="song-meta-field" title="Song = startSong() with offset; Trigger = one-shot trigger()">
                <span>Type</span>
                <select
                  className="song-meta-input"
                  value={song.animationType ?? 'song'}
                  onChange={(e) => handleSongChange({ animationType: e.target.value === 'trigger' ? 'trigger' : 'song' })}
                >
                  <option value="song">Song</option>
                  <option value="trigger">Trigger</option>
                </select>
              </label>
              <label className="song-meta-field">
                <span>Length</span>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="song-meta-input"
                  value={song.lengthSeconds}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    handleSongChange({ lengthSeconds: isNaN(val) ? 1 : Math.max(0.1, val) })
                  }}
                />
                <span className="song-meta-suffix">sec</span>
              </label>
              <label className="song-meta-field">
                <span>BPM</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="song-meta-input"
                  value={song.bpm}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    handleSongChange({ bpm: isNaN(val) ? 1 : Math.max(1, val) })
                  }}
                />
              </label>
              <label className="song-meta-field">
                <span>Start offset</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="song-meta-input"
                  value={song.startOffsetMs ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    handleSongChange({ startOffsetMs: isNaN(val) ? 0 : Math.max(0, val) })
                  }}
                />
                <span className="song-meta-suffix">ms</span>
              </label>
              <label className="song-meta-field" title="Timeline position when you press Run">
                <span>Run from</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  className="song-meta-input"
                  value={song.runStartTimeSeconds ?? 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    handleSongChange({ runStartTimeSeconds: isNaN(val) ? 0 : Math.max(0, val) })
                  }}
                />
                <span className="song-meta-suffix">sec</span>
              </label>
            </div>
          </div>
        </div>
        <div className="app-header-controls">
          <div className="playback-controls">
            <button 
              className={`playback-button ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸ Pause' : '▶ Run'}
            </button>
            <button 
              className="playback-button stop-button"
              onClick={handleStop}
            >
              ⏹ Stop
            </button>
            <div className="current-time-display">
              <span>Time: {currentTime.toFixed(1)}b</span>
            </div>
          </div>
          <div className="app-header-actions">
            <button className="secondary-button" onClick={handleLoadTimeframes}>
              Load JSON
            </button>
            <button className="secondary-button" onClick={handleSaveTimeframes}>
              Save Changes
            </button>
            <button className="add-button" onClick={addTimeframe}>
              + Add Timeframe
            </button>
          </div>
        </div>
      </div>
      <div className="app-content" ref={appContentRef}>
        <div
          className="app-playback-wrapper"
          style={{ width: playbackPanelWidth, minWidth: playbackPanelWidth }}
        >
          <PlaybackRingsPanel currentTime={currentTime} timeframes={timeframes} />
        </div>
        <div
          className="app-resize-handle app-resize-handle-playback"
          onMouseDown={() => setResizing('playback')}
          title="Drag to resize Playback panel"
        />
        <div className="app-main">
          <Timeline
            timeframes={timeframes}
            songLengthBeats={songLengthBeats}
            bpm={song.bpm}
            onUpdate={updateTimeframe}
            onDelete={deleteTimeframe}
            onAdd={addTimeframeFromDrag}
            focusedTimeframeId={focusedTimeframeId}
            onFocusedTimeframeChange={setFocusedTimeframeId}
            currentTime={currentTime}
            onCurrentTimeChange={setCurrentTime}
          />
        </div>
        <div
          className="app-resize-handle app-resize-handle-details"
          onMouseDown={() => setResizing('details')}
          title="Drag to resize Details panel"
        />
        <div
          className="app-details-wrapper"
          style={{ width: detailsPanelWidth, minWidth: detailsPanelWidth }}
        >
          <TimeframePanel
            timeframe={focusedTimeframe}
            onUpdate={handlePanelUpdate}
            onClose={() => setFocusedTimeframeId(null)}
          />
        </div>
      </div>
    </div>
  )
}

export default App
