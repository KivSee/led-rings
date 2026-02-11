import React, { useState, useRef, useEffect } from 'react'
import Timeline from './components/Timeline'
import TimeframePanel from './components/TimeframePanel'
import PlaybackRingsPanel from './components/PlaybackRingsPanel'
import { generateSequenceTs } from './generateSequenceTs'
import './App.css'

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
  brightnessEffect?: string
  brightnessEffectParams?: Record<string, number | boolean>
  hueEffect?: string
  hueEffectParams?: Record<string, number | boolean>
  motionEffect?: string
  motionEffectParams?: Record<string, number | boolean>
}

export interface Song {
  name: string
  lengthBeats: number
  bpm: number
  startOffsetMs?: number
}

const LAST_SONG_STORAGE_KEY = 'timelineManager:lastSong'

function App() {
  const snapToBeat = (beat: number): number => {
    return Math.round(beat / 4) * 4
  }

  // Ensure we don't overwrite saved state before we've tried loading it
  const hasLoadedInitialStateRef = useRef(false)

  const [song, setSong] = useState<Song>({
    name: 'New Song',
    lengthBeats: 64,
    bpm: 120,
    startOffsetMs: 0,
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
  const playbackIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const songLengthBeats = Math.max(1, song.lengthBeats || 0)

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
    setIsPlaying(!isPlaying)
  }

  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTime(0)
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

        // Support both "raw array" and "{ timeframes: [...] }" formats
        const maybeArray = Array.isArray(parsed) ? parsed : parsed?.timeframes
        if (!Array.isArray(maybeArray)) {
          console.error('Invalid timeframes file format')
          return
        }

        // Basic shape validation
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
            brightnessEffect: item.brightnessEffect,
            brightnessEffectParams: item.brightnessEffectParams && typeof item.brightnessEffectParams === 'object' ? item.brightnessEffectParams as Record<string, number | boolean> : undefined,
            hueEffect: item.hueEffect,
            hueEffectParams: item.hueEffectParams && typeof item.hueEffectParams === 'object' ? item.hueEffectParams as Record<string, number | boolean> : undefined,
            motionEffect: item.motionEffect,
            motionEffectParams: item.motionEffectParams && typeof item.motionEffectParams === 'object' ? item.motionEffectParams as Record<string, number | boolean> : undefined,
          }))

        if (mapped.length === 0) {
          console.error('No valid timeframes found in file')
          return
        }

        setTimeframes(mapped)
        setFocusedTimeframeId(null)
        setCurrentTime(0)
      } catch (err) {
        console.error('Failed to load timeframes file', err)
      }
    }
    input.click()
  }
  const handleSaveTimeframes = async () => {
    const dataStr = JSON.stringify(timeframes, null, 2)
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

  // Autoload last song on startup
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_SONG_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { song?: Song; timeframes?: Timeframe[] }
      if (parsed.song) {
        setSong({ startOffsetMs: 0, ...parsed.song })
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
    <div className="app">
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
              <label className="song-meta-field">
                <span>Length</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="song-meta-input"
                  value={song.lengthBeats}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    handleSongChange({ lengthBeats: isNaN(val) ? 1 : Math.max(1, val) })
                  }}
                />
                <span className="song-meta-suffix">beats</span>
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
            </div>
          </div>
        </div>
        <div className="app-header-controls">
          <div className="playback-controls">
            <button 
              className={`playback-button ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸ Stop' : '▶ Run'}
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
      <div className="app-content">
        <div className="app-main">
          <PlaybackRingsPanel currentTime={currentTime} timeframes={timeframes} />
          <Timeline
            timeframes={timeframes}
            songLengthBeats={songLengthBeats}
            onUpdate={updateTimeframe}
            onDelete={deleteTimeframe}
            onAdd={addTimeframeFromDrag}
            focusedTimeframeId={focusedTimeframeId}
            onFocusedTimeframeChange={setFocusedTimeframeId}
            currentTime={currentTime}
            onCurrentTimeChange={setCurrentTime}
          />
        </div>
        <TimeframePanel
          timeframe={focusedTimeframe}
          onUpdate={handlePanelUpdate}
          onClose={() => setFocusedTimeframeId(null)}
        />
      </div>
    </div>
  )
}

export default App
