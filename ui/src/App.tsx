import React, { useState, useRef, useEffect, useCallback } from 'react'
import Timeline from './components/Timeline'
import TimeframePanel from './components/TimeframePanel'
import PlaybackRingsPanel from './components/PlaybackRingsPanel'
import Spectrogram from './components/Spectrogram'
import { generateSequenceTs, generateSequenceRunnerTs } from './generateSequenceTs'
import { presetToTimeframes } from './presets'
import type { PresetMetadata } from './presets'
import './App.css'

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? ''

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

/** A single effect slot: one of brightness / hue / motion effect by key */
export interface TimeframeEffectEntry {
  id: string
  effectKey: string
  params?: Record<string, number | boolean | object>
  phase?: number
}

export interface Timeframe {
  id: string
  startTime: number
  endTime: number
  label: string
  color: string
  hasExplicitColor?: boolean // When false, no constColor is emitted (timeframe only has modifiers/motion)
  rings: number[] // Array of ring numbers (1-12) that participate
  disabled?: boolean // When true, timeframe is excluded from playback and export
  mapping?: string // Segment mapping name from segments.json
  phase?: number // Phase intensity — offsets hue/brightness/motion per ring (0 = none)
  /** Optional list of cycle/cycleBeats wrapping this timeframe's content (outermost first) */
  cycles?: TimeframeCycleEntry[]
  /** Effect slots (one selector per slot, add more as desired). Replaces legacy brightness/hue/motion fields. */
  effects?: TimeframeEffectEntry[]
  /** @deprecated Use effects[] instead. Kept for load compat. */
  brightnessEffect?: string
  /** @deprecated */
  brightnessEffectParams?: Record<string, number | boolean>
  /** @deprecated */
  hueEffect?: string
  /** @deprecated */
  hueEffectParams?: Record<string, number | boolean>
  /** @deprecated */
  motionEffect?: string
  /** @deprecated */
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
  /** Path or URL to the audio file for timeline playback (e.g. /audio/song.wav). Supported: .wav, .mp3, .ogg, etc. */
  audioFilePath?: string
  /** Detected beat positions in milliseconds. When present, beatToMs uses lookup instead of fixed-BPM formula. */
  beatTimestampsMs?: number[]
}

const LAST_SONG_STORAGE_KEY = 'timelineManager:lastSong'

/** Returns normalized effects array: from timeframe.effects or built from legacy brightness/hue/motion fields. */
export function getTimeframeEffects(tf: Timeframe): TimeframeEffectEntry[] {
  if (tf.effects && tf.effects.length > 0) return tf.effects
  const entries: TimeframeEffectEntry[] = []
  const add = (key: string, params?: Record<string, number | boolean>) => {
    if (key) entries.push({ id: `legacy-${key}-${entries.length}`, effectKey: key, params })
  }
  if (tf.brightnessEffect) add(tf.brightnessEffect, tf.brightnessEffectParams)
  if (tf.hueEffect) add(tf.hueEffect, tf.hueEffectParams)
  if (tf.motionEffect) add(tf.motionEffect, tf.motionEffectParams)
  return entries
}

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

  /** Convert beat position to audio seconds (accounts for startOffsetMs and detected beats). */
  const beatsToAudioSec = (beats: number, s: Song): number => {
    const ts = s.beatTimestampsMs
    if (ts && ts.length > 0) {
      const maxIdx = ts.length - 1
      if (beats <= 0) return (ts[0] + (s.startOffsetMs ?? 0)) / 1000
      if (beats >= maxIdx) {
        const avgMs = maxIdx > 0 ? ts[maxIdx] / maxIdx : 60000 / s.bpm
        return (ts[maxIdx] + (beats - maxIdx) * avgMs + (s.startOffsetMs ?? 0)) / 1000
      }
      const floor = Math.floor(beats)
      const ceil = Math.ceil(beats)
      const ms = floor === ceil ? ts[floor] : ts[floor] + (beats - floor) * (ts[ceil] - ts[floor])
      return (ms + (s.startOffsetMs ?? 0)) / 1000
    }
    return (beats / s.bpm) * 60 + (s.startOffsetMs ?? 0) / 1000
  }

  /** Convert audio seconds to beat position (accounts for startOffsetMs and detected beats). */
  const audioSecToBeats = (sec: number, s: Song): number => {
    const ts = s.beatTimestampsMs
    const ms = sec * 1000 - (s.startOffsetMs ?? 0)
    if (ts && ts.length > 0) {
      if (ms <= ts[0]) return 0
      if (ms >= ts[ts.length - 1]) {
        const maxIdx = ts.length - 1
        const avgMs = maxIdx > 0 ? ts[maxIdx] / maxIdx : 60000 / s.bpm
        return maxIdx + (ms - ts[maxIdx]) / avgMs
      }
      // Binary search for surrounding beats
      let lo = 0, hi = ts.length - 1
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1
        if (ts[mid] <= ms) lo = mid; else hi = mid
      }
      const range = ts[hi] - ts[lo]
      return range > 0 ? lo + (ms - ts[lo]) / range : lo
    }
    return ((sec - (s.startOffsetMs ?? 0) / 1000) / 60) * s.bpm
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
  const [liveMode, setLiveMode] = useState(false)
  const [sendSequenceLoading, setSendSequenceLoading] = useState(false)
  const [detectBeatsLoading, setDetectBeatsLoading] = useState(false)
  const playbackIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const appContentRef = React.useRef<HTMLDivElement>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const audioBlobUrlRef = React.useRef<string | null>(null)
  const audioFileInputRef = React.useRef<HTMLInputElement>(null)
  /** Effective audio URL for spectrogram fetch (path or blob URL). */
  const [effectiveAudioSrc, setEffectiveAudioSrc] = useState('')
  /** Visible time range in beats from Timeline scroll (for spectrogram zoom). */
  const [visibleRangeBeats, setVisibleRangeBeats] = useState<{ start: number; end: number } | null>(null)
  const visibleStartBeat = visibleRangeBeats?.start ?? null
  const visibleEndBeat = visibleRangeBeats?.end ?? null
  const [scrollToStartBeat, setScrollToStartBeat] = useState<number | null>(null)
  const songLengthBeats = Math.max(1, (song.lengthSeconds * song.bpm) / 60)

  // Resizable panel widths (px)
  const [playbackPanelWidth, setPlaybackPanelWidth] = useState(380)
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(350)
  const [spectrogramHeight, setSpectrogramHeight] = useState(180)
  const [resizing, setResizing] = useState<'playback' | 'details' | 'spectrogram' | null>(null)
  const spectrogramContainerRef = React.useRef<HTMLDivElement>(null)

  // Stable callbacks to avoid effect loops in Timeline/Spectrogram (they use these in useEffect deps)
  const onVisibleRangeChange = useCallback((startBeat: number, endBeat: number) => {
    setVisibleRangeBeats((prev) => {
      if (prev && prev.start === startBeat && prev.end === endBeat) return prev
      return { start: startBeat, end: endBeat }
    })
  }, [])
  const onScrollToStartDone = useCallback(() => setScrollToStartBeat(null), [])
  const songRef = useRef(song)
  songRef.current = song
  const onRequestScrollToStartSeconds = useCallback((startSeconds: number) => {
    const s = songRef.current
    setScrollToStartBeat(audioSecToBeats(startSeconds, s))
  }, [])

  useEffect(() => {
    if (!resizing) return
    const minPlayback = 240
    const maxPlayback = 600
    const minDetails = 240
    const maxDetails = 600
    const minSpectrogram = 80
    const maxSpectrogram = 500
    const onMove = (e: MouseEvent) => {
      if (resizing === 'spectrogram') {
        const el = spectrogramContainerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const h = e.clientY - rect.top
        setSpectrogramHeight(Math.round(Math.min(maxSpectrogram, Math.max(minSpectrogram, h))))
        return
      }
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

  const addTimeframesFromPreset = (preset: PresetMetadata) => {
    const snappedBeat = Math.round(currentTime)
    const newTimeframes = presetToTimeframes(preset, snappedBeat, song.bpm)
    if (newTimeframes.length > 0) {
      setTimeframes(prev => [...prev, ...newTimeframes])
      setFocusedTimeframeId(newTimeframes[0].id)
    }
  }

  const focusedTimeframe = timeframes.find(tf => tf.id === focusedTimeframeId) || null

  const handlePanelUpdate = (updates: Partial<Timeframe>) => {
    if (focusedTimeframeId) {
      updateTimeframe(focusedTimeframeId, updates)
    }
  }

  // Playback controls
  const handlePlayPause = () => {
    const audio = audioRef.current
    const isSongWithAudio = song.animationType === 'song' && song.audioFilePath && audio

    if (isPlaying) {
      // Pause: stop playback; next Run will resume from current position
      if (isSongWithAudio) audio.pause()
      if (liveMode && API_BASE) {
        fetch(`${API_BASE}/api/stop`, { method: 'POST' }).catch((err) =>
          console.error('Live stop failed', err)
        )
      }
      setNextRunFromStart(false)
      setIsPlaying(false)
    } else {
      // Run: if nextRunFromStart, jump to runStartTimeSeconds; otherwise resume from currentTime
      const startOffsetSeconds = nextRunFromStart
        ? (song.runStartTimeSeconds ?? 0)
        : beatsToAudioSec(currentTime, song)
      if (nextRunFromStart) {
        const startSec = song.runStartTimeSeconds ?? 0
        const startBeats = audioSecToBeats(startSec, song)
        const clamped = Math.max(0, Math.min(songLengthBeats, startBeats))
        setCurrentTime(clamped)
        if (isSongWithAudio) {
          audio.currentTime = Math.max(0, startSec)
          audio.play().catch(() => {})
        }
        setNextRunFromStart(false)
      } else {
        const startSec = beatsToAudioSec(currentTime, song)
        if (isSongWithAudio) {
          audio.currentTime = Math.max(0, startSec)
          audio.play().catch(() => {})
        }
      }
      if (liveMode && API_BASE) {
        const name = (song.name || 'sequence').trim() || 'sequence'
        if (song.animationType === 'trigger') {
          fetch(`${API_BASE}/api/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerName: name }),
          }).catch((err) => console.error('Live trigger failed', err))
        } else {
          fetch(`${API_BASE}/api/start-song`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songName: name, startOffsetSeconds }),
          }).catch((err) => console.error('Live start-song failed', err))
        }
      }
      setIsPlaying(true)
    }
  }

  // Space bar toggles Run / Pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        handlePlayPause()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  const handleStop = () => {
    const audio = audioRef.current
    const isSongWithAudio = song.animationType === 'song' && song.audioFilePath && audio
    if (isSongWithAudio) {
      audio.pause()
      audio.currentTime = Math.max(0, song.runStartTimeSeconds ?? 0)
    }
    if (liveMode && API_BASE) {
      fetch(`${API_BASE}/api/stop`, { method: 'POST' }).catch((err) =>
        console.error('Live stop failed', err)
      )
    }
    setIsPlaying(false)
    setNextRunFromStart(true) // Next Run will start from runStartTimeSeconds
    const startBeats = audioSecToBeats(song.runStartTimeSeconds ?? 0, song)
    const clamped = Math.max(0, Math.min(songLengthBeats, startBeats))
    setCurrentTime(clamped)
  }

  const handleSendSequence = async () => {
    if (!API_BASE) {
      console.warn('VITE_API_URL not set; cannot send sequence')
      return
    }
    setSendSequenceLoading(true)
    handleSaveTimeframes()
    try {
      const runnerCode = generateSequenceRunnerTs(song, timeframes)
      const res = await fetch(`${API_BASE}/api/send-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runnerCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    } catch (err) {
      console.error('Send sequence failed', err)
    } finally {
      setSendSequenceLoading(false)
    }
  }

  const handleDetectBeats = async () => {
    if (!API_BASE || !song.audioFilePath?.trim()) return
    setDetectBeatsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/detect-beats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioFilePath: song.audioFilePath }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      if (data.beatTimestampsMs && Array.isArray(data.beatTimestampsMs)) {
        handleSongChange({ beatTimestampsMs: data.beatTimestampsMs })
      }
    } catch (err) {
      console.error('Beat detection failed', err)
    } finally {
      setDetectBeatsLoading(false)
    }
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
          const s = normalizeLoadedSong(parsed.song as Record<string, unknown>)
          setSong(s)
          setEffectiveAudioSrc(s.audioFilePath ?? '')
        }

        if (Array.isArray(maybeArray)) {
          const mapped: Timeframe[] = maybeArray
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any, idx: number) => {
              const effects = Array.isArray(item.effects)
                ? item.effects
                    .filter((e: any) => e && typeof e === 'object' && typeof e.effectKey === 'string')
                    .map((e: any) => ({
                      id: e.id && typeof e.id === 'string' ? e.id : `eff-${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
                      effectKey: e.effectKey,
                      params: e.params && typeof e.params === 'object' ? e.params as Record<string, number | boolean | object> : undefined,
                      phase: typeof e.phase === 'number' ? e.phase : undefined,
                    }))
                : undefined
              const legacy = {
                brightnessEffect: item.brightnessEffect,
                brightnessEffectParams: item.brightnessEffectParams && typeof item.brightnessEffectParams === 'object' ? item.brightnessEffectParams as Record<string, number | boolean> : undefined,
                hueEffect: item.hueEffect,
                hueEffectParams: item.hueEffectParams && typeof item.hueEffectParams === 'object' ? item.hueEffectParams as Record<string, number | boolean> : undefined,
                motionEffect: item.motionEffect,
                motionEffectParams: item.motionEffectParams && typeof item.motionEffectParams === 'object' ? item.motionEffectParams as Record<string, number | boolean> : undefined,
              }
              return {
                id: item.id?.toString() ?? `tf-${Date.now()}-${idx}`,
                startTime: Number(item.startTime) || 0,
                endTime: Number(item.endTime) || 0,
                label: typeof item.label === 'string' ? item.label : `Timeframe ${idx + 1}`,
                color: typeof item.color === 'string' ? item.color : '#3b82f6',
                hasExplicitColor: item.hasExplicitColor !== false ? undefined : false,
                rings: Array.isArray(item.rings) ? item.rings.map((r: any) => Number(r)).filter((n: number) => !isNaN(n)) : [1,2,3,4,5,6,7,8,9,10,11,12],
                mapping: item.mapping,
                phase: typeof item.phase === 'number' ? item.phase : undefined,
                cycles: normalizeCycles(item.cycles),
                ...(effects && effects.length > 0 ? { effects } : legacy),
              }
            })
          setTimeframes(mapped)
        } else if (!parsed?.song) {
          console.error('Invalid file format: expected array of timeframes or { song, timeframes }')
          return
        }
        // If we have song but no timeframes array, leave timeframes unchanged

        setFocusedTimeframeId(null)
        setCurrentTime(0)

        // Restore window sizes if present (same min/max as resize logic)
        const minPlayback = 240
        const maxPlayback = 600
        const minDetails = 240
        const maxDetails = 600
        const minSpectrogram = 80
        const maxSpectrogram = 500
        const ws = parsed?.windowSizes as { playbackPanelWidth?: number; detailsPanelWidth?: number; spectrogramHeight?: number } | undefined
        if (ws && typeof ws === 'object') {
          if (typeof ws.playbackPanelWidth === 'number') {
            setPlaybackPanelWidth(Math.round(Math.min(maxPlayback, Math.max(minPlayback, ws.playbackPanelWidth))))
          }
          if (typeof ws.detailsPanelWidth === 'number') {
            setDetailsPanelWidth(Math.round(Math.min(maxDetails, Math.max(minDetails, ws.detailsPanelWidth))))
          }
          if (typeof ws.spectrogramHeight === 'number') {
            setSpectrogramHeight(Math.round(Math.min(maxSpectrogram, Math.max(minSpectrogram, ws.spectrogramHeight))))
          }
        }
      } catch (err) {
        console.error('Failed to load timeframes file', err)
      }
    }
    input.click()
  }

  const handleImportTs = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.ts'
    input.onchange = async () => {
      const file = input.files && input.files[0]
      if (!file) return
      try {
        const songCode = await file.text()
        const res = await fetch(`${API_BASE}/api/parse-song`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songCode, fileName: file.name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)

        if (data.song && typeof data.song === 'object') {
          const s = normalizeLoadedSong(data.song as Record<string, unknown>)
          setSong(s)
          setEffectiveAudioSrc(s.audioFilePath ?? '')
        }

        if (Array.isArray(data.timeframes)) {
          const mapped: Timeframe[] = data.timeframes
            .filter((item: any) => item && typeof item === 'object')
            .map((item: any, idx: number) => {
              const effects = Array.isArray(item.effects)
                ? item.effects
                    .filter((e: any) => e && typeof e === 'object' && typeof e.effectKey === 'string')
                    .map((e: any) => ({
                      id: e.id && typeof e.id === 'string' ? e.id : `eff-${Date.now()}-${idx}-${Math.random().toString(36).slice(2)}`,
                      effectKey: e.effectKey,
                      params: e.params && typeof e.params === 'object' ? e.params as Record<string, number | boolean | object> : undefined,
                      phase: typeof e.phase === 'number' ? e.phase : undefined,
                    }))
                : undefined
              return {
                id: item.id?.toString() ?? `tf-${Date.now()}-${idx}`,
                startTime: Number(item.startTime) || 0,
                endTime: Number(item.endTime) || 0,
                label: typeof item.label === 'string' ? item.label : `Timeframe ${idx + 1}`,
                color: typeof item.color === 'string' ? item.color : '#3b82f6',
                hasExplicitColor: item.hasExplicitColor !== false ? undefined : false,
                rings: Array.isArray(item.rings) ? item.rings.map((r: any) => Number(r)).filter((n: number) => !isNaN(n)) : [1,2,3,4,5,6,7,8,9,10,11,12],
                mapping: item.mapping,
                phase: typeof item.phase === 'number' ? item.phase : undefined,
                cycles: normalizeCycles(item.cycles),
                ...(effects && effects.length > 0 ? { effects } : {}),
              }
            })
          setTimeframes(mapped)
        }

        setFocusedTimeframeId(null)
        setCurrentTime(0)
      } catch (err) {
        console.error('Failed to import .ts song file', err)
        alert(`Import failed: ${err instanceof Error ? err.message : err}`)
      }
    }
    input.click()
  }
  const handleSaveTimeframes = async () => {
    const payload = {
      song,
      timeframes: timeframes.map(tf => {
        const effects = tf.effects?.filter(e => e.effectKey !== '')
        return {
          ...tf,
          effects: effects && effects.length > 0 ? effects : undefined,
        }
      }),
      windowSizes: {
        playbackPanelWidth,
        detailsPanelWidth,
        spectrogramHeight,
      },
    }
    const dataStr = JSON.stringify(payload, null, 2)
    const safeName = (song.name || 'song').trim() || 'song'

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
        // Determine import prefix by probing for the services/ directory.
        // If it exists here, we're in src/ (./) — otherwise assume one level below (../).
        let importPrefix = '..'
        try {
          await dirHandle.getDirectoryHandle('services')
          importPrefix = '.'
        } catch {}
        const tsCode = generateSequenceTs(song, timeframes, importPrefix)
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

    // Fallback: generate with default ../ prefix (assumes src/songs/)
    const tsCode = generateSequenceTs(song, timeframes)

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
      audioFilePath: typeof s.audioFilePath === 'string' ? s.audioFilePath : undefined,
      beatTimestampsMs: Array.isArray(s.beatTimestampsMs) ? s.beatTimestampsMs as number[] : undefined,
    }
  }

  // Autoload last song and window sizes on startup
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_SONG_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        song?: Record<string, unknown>
        timeframes?: Timeframe[]
        windowSizes?: { playbackPanelWidth?: number; detailsPanelWidth?: number; spectrogramHeight?: number }
      }
      if (parsed.song && typeof parsed.song === 'object') {
        const s = normalizeLoadedSong(parsed.song)
        setSong(s)
        setEffectiveAudioSrc((s as Song).audioFilePath ?? '')
      }
      if (parsed.timeframes && Array.isArray(parsed.timeframes) && parsed.timeframes.length > 0) {
        setTimeframes(parsed.timeframes)
      }
      const minPlayback = 240, maxPlayback = 600, minDetails = 240, maxDetails = 600, minSpectrogram = 80, maxSpectrogram = 500
      const ws = parsed.windowSizes
      if (ws && typeof ws === 'object') {
        if (typeof ws.playbackPanelWidth === 'number') {
          setPlaybackPanelWidth(Math.round(Math.min(maxPlayback, Math.max(minPlayback, ws.playbackPanelWidth))))
        }
        if (typeof ws.detailsPanelWidth === 'number') {
          setDetailsPanelWidth(Math.round(Math.min(maxDetails, Math.max(minDetails, ws.detailsPanelWidth))))
        }
        if (typeof ws.spectrogramHeight === 'number') {
          setSpectrogramHeight(Math.round(Math.min(maxSpectrogram, Math.max(minSpectrogram, ws.spectrogramHeight))))
        }
      }
    } catch {
      // Ignore corrupted data
    } finally {
      hasLoadedInitialStateRef.current = true
    }
  }, [])

  // Persist last worked-on song, timeframes, and window sizes;
  // only after we've attempted to load any existing data.
  useEffect(() => {
    if (!hasLoadedInitialStateRef.current) return
    try {
      const payload = JSON.stringify({
        song,
        timeframes,
        windowSizes: { playbackPanelWidth, detailsPanelWidth, spectrogramHeight },
      })
      window.localStorage.setItem(LAST_SONG_STORAGE_KEY, payload)
    } catch {
      // Ignore persistence errors
    }
  }, [song, timeframes, playbackPanelWidth, detailsPanelWidth, spectrogramHeight])

  useEffect(() => {
    if (song.animationType !== 'song') setEffectiveAudioSrc('')
    else setEffectiveAudioSrc(audioBlobUrlRef.current || song.audioFilePath?.trim() || '')
  }, [song.animationType])

  // Keep audio element src in sync with song (blob URL from Browse, or path/URL from field)
  useEffect(() => {
    if (song.animationType !== 'song') {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      return
    }
    const effectiveSrc = audioBlobUrlRef.current || song.audioFilePath?.trim()
    if (!effectiveSrc) {
      if (audioRef.current) audioRef.current.src = ''
      return
    }
    if (!audioRef.current) audioRef.current = new Audio()
    if (audioRef.current.src !== effectiveSrc) {
      audioRef.current.src = effectiveSrc
    }
    audioRef.current.loop = false
  }, [song.animationType, song.audioFilePath])

  // Playback animation: use audio time when available (so Run from and timeline stay in sync), else use interval.
  // Stop at song length (same as pressing Stop) instead of looping.
  useEffect(() => {
    const audio = audioRef.current
    const useAudio = isPlaying && song.animationType === 'song' && song.audioFilePath && audio
    const runStartSec = song.runStartTimeSeconds ?? 0
    const runStartBeats = audioSecToBeats(runStartSec, song)
    const maxTime = songLengthBeats

    const performStop = () => {
      if (audio && song.animationType === 'song' && song.audioFilePath) {
        audio.pause()
        audio.currentTime = Math.max(0, runStartSec)
      }
      if (liveMode && API_BASE) {
        fetch(`${API_BASE}/api/stop`, { method: 'POST' }).catch((err) =>
          console.error('Live stop failed', err)
        )
      }
      setIsPlaying(false)
      setNextRunFromStart(true)
      setCurrentTime(Math.max(0, Math.min(maxTime, runStartBeats)))
    }

    if (useAudio) {
      let rafId: number
      const syncFromAudio = () => {
        if (!audioRef.current) return
        const sec = audioRef.current.currentTime
        const beats = audioSecToBeats(sec, song)
        if (beats >= maxTime || audioRef.current.ended) {
          cancelAnimationFrame(rafId)
          performStop()
          return
        }
        setCurrentTime(beats)
        rafId = requestAnimationFrame(syncFromAudio)
      }
      rafId = requestAnimationFrame(syncFromAudio)
      return () => cancelAnimationFrame(rafId)
    }

    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1
          if (next >= maxTime) {
            queueMicrotask(() => {
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current)
                playbackIntervalRef.current = null
              }
              performStop()
            })
            return Math.max(0, Math.min(maxTime, runStartBeats))
          }
          return next
        })
      }, 50)
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
  }, [isPlaying, song.animationType, song.audioFilePath, song.bpm, song.lengthSeconds, song.runStartTimeSeconds, songLengthBeats, liveMode, API_BASE])

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

  const handleCurrentTimeChange = (time: number) => {
    setCurrentTime(time)
    setNextRunFromStart(false)
    const audio = audioRef.current
    const isSongWithAudio = song.animationType === 'song' && song.audioFilePath && audio
    if (isSongWithAudio && isPlaying) {
      audio.currentTime = Math.max(0, beatsToAudioSec(time, song))
    }
  }

  const handleSeekToBeat = (beat: number) => {
    const clamped = Math.max(0, Math.min(songLengthBeats, beat))
    setCurrentTime(clamped)
    const sec = beatsToAudioSec(clamped, song)
    handleSongChange({ runStartTimeSeconds: sec })
    setNextRunFromStart(true)
    const audio = audioRef.current
    if (song.animationType === 'song' && song.audioFilePath && audio && isPlaying) {
      audio.currentTime = Math.max(0, sec)
    }
  }

  const handleAudioFilePathChange = (value: string) => {
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current)
      audioBlobUrlRef.current = null
    }
    setEffectiveAudioSrc(value || '')
    handleSongChange({ audioFilePath: value || undefined })
  }

  const handleBrowseAudio = () => {
    audioFileInputRef.current?.click()
  }

  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current)
    const blobUrl = URL.createObjectURL(file)
    audioBlobUrlRef.current = blobUrl
    setEffectiveAudioSrc(blobUrl)
    handleSongChange({ audioFilePath: file.name })
    if (audioRef.current) audioRef.current.src = blobUrl
  }

  return (
    <div className={`app${resizing ? ' app-resizing' : ''}${resizing === 'spectrogram' ? ' app-resizing-spectrogram' : ''}`}>
      <div className="app-header">
        <div className="app-header-title">
          <h1>KivSee Time Simulator</h1>
          <div className="song-meta">
            <div className="song-meta-row song-meta-row-name">
              <input
                type="text"
                className="song-name-input"
                value={song.name}
                onChange={(e) => handleSongChange({ name: e.target.value })}
                placeholder="Song name"
              />
              {song.animationType === 'song' && (
                <>
                  <label className="song-meta-field song-meta-field-audio" title="Browsers cannot read full disk paths (e.g. C:\...). Use a path relative to the app (e.g. /audio/song.wav with file in ui/public/audio/) or pick a file with Browse.">
                    <span>Audio file</span>
                    <input
                      type="text"
                      className="song-meta-input song-meta-input-audio"
                      value={song.audioFilePath ?? ''}
                      onChange={(e) => handleAudioFilePathChange(e.target.value)}
                      placeholder="e.g. /audio/song.wav (file in public folder) or Browse"
                    />
                  </label>
                  <input
                    ref={audioFileInputRef}
                    type="file"
                    accept="audio/*,.wav,.mp3,.ogg,.m4a"
                    className="song-audio-file-input"
                    onChange={handleAudioFileSelected}
                  />
                  <button
                    type="button"
                    className="secondary-button song-browse-button"
                    onClick={handleBrowseAudio}
                  >
                    Browse…
                  </button>
                </>
              )}
            </div>
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
              {song.animationType === 'song' && (
                <div className="song-meta-field beat-detect-field">
                  <button
                    type="button"
                    className="secondary-button beat-detect-button"
                    onClick={handleDetectBeats}
                    disabled={detectBeatsLoading || !API_BASE || !song.audioFilePath?.trim()}
                    title={!API_BASE ? 'Set VITE_API_URL and run control server' : !song.audioFilePath?.trim() ? 'Set audio file path first' : 'Run beat detection on audio file (requires Python + librosa)'}
                  >
                    {detectBeatsLoading ? 'Detecting…' : 'Detect Beats'}
                  </button>
                  {song.beatTimestampsMs && song.beatTimestampsMs.length > 0 && (
                    <span className="beat-detect-status" title="Click to clear detected beats and revert to fixed BPM">
                      {song.beatTimestampsMs.length} beats
                      <button
                        type="button"
                        className="beat-detect-clear"
                        onClick={() => handleSongChange({ beatTimestampsMs: undefined })}
                      >
                        x
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="app-header-controls">
          <div className="playback-controls">
            <label className="live-mode-checkbox" title="When on, Run also starts the song on the device; Stop sends stop.">
              <input
                type="checkbox"
                checked={liveMode}
                onChange={(e) => setLiveMode(e.target.checked)}
              />
              <span>Live mode</span>
            </label>
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
            <button
              className="playback-button send-sequence-button"
              onClick={handleSendSequence}
              disabled={sendSequenceLoading || !API_BASE}
              title={!API_BASE ? 'Set VITE_API_URL and run control server' : 'Send current sequence to device'}
            >
              {sendSequenceLoading ? '…' : 'Send Sequence'}
            </button>
            <div className="current-time-display">
              <span>Time: {currentTime.toFixed(1)}b</span>
            </div>
          </div>
          <div className="app-header-actions">
            <button className="secondary-button" onClick={handleLoadTimeframes}>
              Load JSON
            </button>
            <button className="secondary-button" onClick={handleImportTs} disabled={!API_BASE} title={!API_BASE ? 'Set VITE_API_URL and run control server' : 'Import a .ts song file'}>
              Import .ts
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
      {song.animationType === 'song' && !!(song.audioFilePath?.trim()) && (
        <div
          className="app-spectrogram-full"
          ref={spectrogramContainerRef}
          style={{ height: spectrogramHeight }}
        >
          <Spectrogram
            audioRef={audioRef}
            isPlaying={isPlaying}
            hasAudio
            audioSrc={effectiveAudioSrc}
            currentTimeSeconds={beatsToAudioSec(currentTime, song)}
            durationSeconds={song.lengthSeconds}
            bpm={song.bpm}
            beatOffset={(song.startOffsetMs ?? 0) / 1000}
            beatTimestampsMs={song.beatTimestampsMs}
            visibleStartSeconds={visibleStartBeat != null && visibleEndBeat != null ? beatsToAudioSec(visibleStartBeat, song) : undefined}
            visibleEndSeconds={visibleStartBeat != null && visibleEndBeat != null ? beatsToAudioSec(visibleEndBeat, song) : undefined}
            onRequestScrollToStartSeconds={onRequestScrollToStartSeconds}
            onSeekToSeconds={(seconds) => handleSeekToBeat(audioSecToBeats(seconds, song))}
          />
        </div>
      )}
      {song.animationType === 'song' && !!(song.audioFilePath?.trim()) && (
        <div
          className="app-resize-handle app-resize-handle-spectrogram"
          onMouseDown={() => setResizing('spectrogram')}
          title="Drag to resize spectrogram"
        />
      )}
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
          <div className="app-main-timeline-wrap">
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
              onCurrentTimeChange={handleCurrentTimeChange}
              onVisibleRangeChange={onVisibleRangeChange}
              scrollToStartBeat={scrollToStartBeat}
              onScrollToStartDone={onScrollToStartDone}
              onSeekToBeat={handleSeekToBeat}
              beatTimestampsMs={song.beatTimestampsMs}
            />
          </div>
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
            onApplyPreset={addTimeframesFromPreset}
          />
        </div>
      </div>
    </div>
  )
}

export default App
