import React, { useRef, useEffect, useCallback, useState } from 'react'
import { realFftMagnitude } from '../fft'
import './Spectrogram.css'

const FFT_SIZE = 2048
const HOP_SIZE = 512
const SPECTROGRAM_HEIGHT = 256
const DB_FLOOR = -80 // dB floor for magnitude scaling (Audacity default)
const DB_GAIN = 20 // dB gain boost (Audacity default spectrogram gain)
const SAMPLE_RATE = 44100 // assumed sample rate for frequency mapping

/**
 * Piecewise-linear frequency mapping: allocates display space unevenly across
 * frequency bands so the musically-important mid range gets the most room.
 *   0–500 Hz   →  5% of height
 *   500–10 kHz → 80% of height
 *   10–22 kHz  → 15% of height
 * Returns a fraction 0..1 (0 = bottom / 0 Hz, 1 = top / Nyquist).
 */
const FREQ_BANDS: { freqFrac: number; displayFrac: number }[] = [
  { freqFrac: 0, displayFrac: 0 },           // 0 Hz  → bottom
  { freqFrac: 500 / 22050, displayFrac: 0.05 },  // 500 Hz  → 5%
  { freqFrac: 10000 / 22050, displayFrac: 0.85 }, // 10 kHz → 85%
  { freqFrac: 1, displayFrac: 1 },           // Nyquist → top
]
function freqFracToDisplay(freqFrac: number): number {
  for (let i = 0; i < FREQ_BANDS.length - 1; i++) {
    const a = FREQ_BANDS[i], b = FREQ_BANDS[i + 1]
    if (freqFrac <= b.freqFrac) {
      const t = (freqFrac - a.freqFrac) / (b.freqFrac - a.freqFrac)
      return a.displayFrac + t * (b.displayFrac - a.displayFrac)
    }
  }
  return 1
}
function displayFracToFreqFrac(displayFrac: number): number {
  for (let i = 0; i < FREQ_BANDS.length - 1; i++) {
    const a = FREQ_BANDS[i], b = FREQ_BANDS[i + 1]
    if (displayFrac <= b.displayFrac) {
      const t = (displayFrac - a.displayFrac) / (b.displayFrac - a.displayFrac)
      return a.freqFrac + t * (b.freqFrac - a.freqFrac)
    }
  }
  return 1
}

/**
 * Audacity-style spectrogram color gradient.
 * Maps 0..255 magnitude → RGB: black → dark blue → purple → red → orange → yellow → white
 */
function magnitudeToRgb(n: number): { r: number; g: number; b: number } {
  const t = Math.min(1, Math.max(0, n / 255))
  // 6-stop gradient matching Audacity's spectrogram palette
  const stops = [
    { p: 0.0, r: 0, g: 0, b: 0 },       // black (silence)
    { p: 0.16, r: 35, g: 10, b: 90 },     // dark indigo
    { p: 0.33, r: 100, g: 10, b: 120 },   // purple
    { p: 0.5, r: 180, g: 20, b: 30 },     // red
    { p: 0.7, r: 230, g: 140, b: 20 },    // orange
    { p: 0.85, r: 255, g: 230, b: 60 },   // yellow
    { p: 1.0, r: 255, g: 255, b: 255 },   // white (loudest)
  ]
  let i = 0
  while (i < stops.length - 2 && stops[i + 1].p < t) i++
  const a = stops[i], b_ = stops[i + 1]
  const f = (t - a.p) / (b_.p - a.p)
  return {
    r: Math.round(a.r + (b_.r - a.r) * f),
    g: Math.round(a.g + (b_.g - a.g) * f),
    b: Math.round(a.b + (b_.b - a.b) * f),
  }
}

const AXIS_HEIGHT = 36
const Y_AXIS_WIDTH = 48

/** Frequency ticks for the Y-axis (log-scale). */
const FREQ_TICKS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
function freqLabel(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : String(hz)
}
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_STEP = 1.25

/** Pick a step in whole beats for axis ticks. Step 1 when span ≤ 64 so grid matches timeline zoom. */
function beatAxisStep(rangeBeats: number): number {
  if (rangeBeats <= 0) return 1
  const rough = rangeBeats / 8
  if (rough <= 8) return 1   // span ≤ 64 beats → every beat
  if (rough <= 16) return 2
  if (rough <= 32) return 4
  if (rough <= 64) return 8
  if (rough <= 128) return 16
  if (rough <= 256) return 32
  return 64
}

/** Pick a step in seconds for axis when BPM unknown (fallback). */
function timeAxisStep(rangeSec: number): number {
  if (rangeSec <= 0) return 1
  const rough = rangeSec / 8
  if (rough <= 1) return 1
  if (rough <= 2) return 2
  if (rough <= 5) return 5
  if (rough <= 10) return 10
  if (rough <= 30) return 30
  return 60
}

export interface SpectrogramProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  hasAudio: boolean
  /** URL to fetch for pre-computing full-song spectrogram (path or blob URL) */
  audioSrc: string
  /** Current playback time in seconds (for playhead) */
  currentTimeSeconds: number
  /** Total duration in seconds (song length or decoded buffer duration) */
  durationSeconds: number
  /** BPM for showing beat labels under the time axis (seconds → beat = seconds * bpm / 60). */
  bpm?: number
  /** Offset in seconds where beat 0 starts in the audio (startOffsetMs / 1000). */
  beatOffset?: number
  /** Detected beat timestamps in milliseconds. When present, drawn as markers on the spectrogram. */
  beatTimestampsMs?: number[]
  /** When set, spectrogram shows only this range (zoom to timeline). */
  visibleStartSeconds?: number
  visibleEndSeconds?: number
  /** Visible beat span from timeline (e.g. 16 at max zoom). Used for grid density so it stays consistent when time span varies. */
  visibleSpanBeats?: number
  /** When user scrolls the spectrogram horizontally, request timeline to show this start time (seconds). */
  onRequestScrollToStartSeconds?: (startSeconds: number) => void
  /** When not playing, user clicked the spectrogram at this time (seconds). Seek marker and Run from. */
  onSeekToSeconds?: (seconds: number) => void
}

export default function Spectrogram({
  audioRef,
  isPlaying,
  hasAudio,
  audioSrc,
  currentTimeSeconds,
  durationSeconds,
  bpm,
  beatOffset = 0,
  beatTimestampsMs,
  visibleStartSeconds,
  visibleEndSeconds,
  visibleSpanBeats,
  onRequestScrollToStartSeconds,
  onSeekToSeconds,
}: SpectrogramProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollViewRef = useRef<HTMLDivElement>(null)
  const paintRef = useRef<() => void>(() => {})
  const spectrogramImageRef = useRef<ImageData | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const decodedDurationRef = useRef(0)
  const decodedSampleRateRef = useRef(SAMPLE_RATE)
  const isProgrammaticScrollRef = useRef(false)
  const userScrollingUntilRef = useRef(0)
  const [scrollViewWidth, setScrollViewWidth] = useState(0)
  const effectiveDuration = decodedDurationRef.current || durationSeconds || 1
  const isZoomed =
    visibleStartSeconds != null &&
    visibleEndSeconds != null &&
    visibleEndSeconds > visibleStartSeconds
  const rawBaseStart = isZoomed ? visibleStartSeconds! : 0
  const rawBaseEnd = isZoomed ? visibleEndSeconds! : effectiveDuration
  const rawBaseSpan = Math.max(0.001, rawBaseEnd - rawBaseStart)
  const baseCenter = (rawBaseStart + rawBaseEnd) / 2
  // Enforce minimum visible duration so we don't stretch a tiny image slice to full width (breaks view at high timeline zoom)
  const MIN_VIEW_DURATION_SEC = 2
  const baseSpan = Math.max(rawBaseSpan, MIN_VIEW_DURATION_SEC)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomPanOffset, setZoomPanOffset] = useState(0)
  const zoomLevelRef = useRef(zoomLevel)
  zoomLevelRef.current = zoomLevel
  const zoomPanOffsetRef = useRef(zoomPanOffset)
  zoomPanOffsetRef.current = zoomPanOffset
  const lastMouseFracRef = useRef(0.5)
  const isHoveredRef = useRef(false)

  // Reset pan offset when the timeline's visible range changes
  const prevBaseCenterRef = useRef(baseCenter)
  const prevBaseSpanRef = useRef(baseSpan)
  if (prevBaseCenterRef.current !== baseCenter || prevBaseSpanRef.current !== baseSpan) {
    prevBaseCenterRef.current = baseCenter
    prevBaseSpanRef.current = baseSpan
    if (zoomPanOffset !== 0) setZoomPanOffset(0)
  }

  const effectiveCenter = baseCenter + zoomPanOffset
  const zoomedSpan = baseSpan / zoomLevel
  // Anchor view at start/end of audio so the beginning (0s) and end stay visible at any zoom
  let viewStart: number
  let viewEnd: number
  if (effectiveCenter - zoomedSpan / 2 < 0) {
    viewStart = 0
    viewEnd = Math.min(effectiveDuration, zoomedSpan)
  } else if (effectiveCenter + zoomedSpan / 2 > effectiveDuration) {
    viewEnd = effectiveDuration
    viewStart = Math.max(0, effectiveDuration - zoomedSpan)
  } else {
    viewStart = effectiveCenter - zoomedSpan / 2
    viewEnd = effectiveCenter + zoomedSpan / 2
  }
  const viewDuration = Math.max(0.001, viewEnd - viewStart)
  const scrollableDuration = Math.max(0, effectiveDuration - viewDuration)
  const contentWidthPx = scrollViewWidth > 0 && viewDuration > 0
    ? scrollViewWidth * (effectiveDuration / viewDuration)
    : scrollViewWidth
  const maxScrollLeft = Math.max(0, contentWidthPx - scrollViewWidth)
  const targetScrollLeft = scrollableDuration > 0
    ? (viewStart / scrollableDuration) * maxScrollLeft
    : 0

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  const setupPlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !canvasRef.current) return true
    if (audioContextRef.current != null) return true
    try {
      // Reuse AudioContext & MediaElementSourceNode cached on the element so that
      // unmounting / remounting the Spectrogram doesn't permanently disconnect audio
      // output (createMediaElementSource can only be called once per element).
      const anyAudio = audio as any
      let ctx: AudioContext = anyAudio.__audioCtx
      let source: MediaElementAudioSourceNode = anyAudio.__audioSrc
      if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        source = ctx.createMediaElementSource(audio)
        anyAudio.__audioCtx = ctx
        anyAudio.__audioSrc = source
      }
      const analyser = ctx.createAnalyser()
      source.disconnect()
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.6
      audioContextRef.current = ctx
      sourceRef.current = source
      analyserRef.current = analyser
      return true
    } catch {
      return false
    }
  }, [audioRef])

  // Build full-song spectrogram from fetched audio
  useEffect(() => {
    if (!hasAudio || !audioSrc?.trim()) {
      spectrogramImageRef.current = null
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    fetch(audioSrc)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((buffer) => {
        if (cancelled) return
        const numChannels = buffer.numberOfChannels
        const length = buffer.length
        const channel = buffer.getChannelData(0)
        const mono = numChannels > 1 ? new Float32Array(length) : channel
        if (numChannels > 1) {
          const ch1 = buffer.getChannelData(1)
          for (let i = 0; i < length; i++) mono[i] = (channel[i] + ch1[i]) / 2
        }

        const sampleRate = buffer.sampleRate || SAMPLE_RATE
        const numColumns = Math.max(1, Math.floor((length - FFT_SIZE) / HOP_SIZE) + 1)
        const cols: Float32Array[] = []
        const windowBuf = new Float32Array(FFT_SIZE)
        const numBins = FFT_SIZE / 2 + 1

        // Piecewise-linear frequency mapping (5% low, 80% mid, 15% high)
        const rowBinStart = new Uint32Array(SPECTROGRAM_HEIGHT)
        const rowBinEnd = new Uint32Array(SPECTROGRAM_HEIGHT)
        for (let row = 0; row < SPECTROGRAM_HEIGHT; row++) {
          const dispLo = row / SPECTROGRAM_HEIGHT
          const dispHi = (row + 1) / SPECTROGRAM_HEIGHT
          const freqFracLo = displayFracToFreqFrac(dispLo)
          const freqFracHi = displayFracToFreqFrac(dispHi)
          rowBinStart[row] = Math.max(0, Math.floor(freqFracLo * (numBins - 1)))
          rowBinEnd[row] = Math.min(numBins, Math.ceil(freqFracHi * (numBins - 1)) + 1)
        }

        for (let c = 0; c < numColumns; c++) {
          const start = c * HOP_SIZE
          if (start + FFT_SIZE > length) break
          for (let i = 0; i < FFT_SIZE; i++) windowBuf[i] = mono[start + i]
          const mag = realFftMagnitude(windowBuf, FFT_SIZE)
          const col = new Float32Array(SPECTROGRAM_HEIGHT)
          for (let row = 0; row < SPECTROGRAM_HEIGHT; row++) {
            const bStart = rowBinStart[row]
            const bEnd = rowBinEnd[row]
            let sum = 0
            let count = 0
            for (let b = bStart; b < bEnd && b < numBins; b++) {
              sum += mag[b]
              count++
            }
            const v = count > 0 ? sum / count : 0
            // Normalize to 0..1 (dBFS reference), convert to dB, apply gain, clamp
            const normMag = v / (FFT_SIZE / 2)
            const dB = normMag > 0 ? 20 * Math.log10(normMag) + DB_GAIN : DB_FLOOR
            col[SPECTROGRAM_HEIGHT - 1 - row] = Math.max(DB_FLOOR, Math.min(0, dB))
          }
          cols.push(col)
        }

        // Fixed dBFS range: DB_FLOOR → 0 (black), 0 dBFS → 255 (white)
        const range = -DB_FLOOR // 80 dB

        decodedDurationRef.current = buffer.duration
        decodedSampleRateRef.current = sampleRate
        const w = cols.length
        const h = SPECTROGRAM_HEIGHT
        const imageData = new ImageData(w, h)
        const buf = imageData.data
        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const col = cols[px]
            const raw = col ? col[py] : 0
            const norm = Number.isFinite(raw)
              ? Math.round(((raw - DB_FLOOR) / range) * 255)
              : 0
            const mag = Math.max(0, Math.min(255, norm))
            const { r, g, b } = magnitudeToRgb(mag)
            const i = (py * w + px) << 2
            buf[i] = r
            buf[i + 1] = g
            buf[i + 2] = b
            buf[i + 3] = 255
          }
        }
        spectrogramImageRef.current = imageData
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load audio')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (ctx.state !== 'closed') ctx.close().catch(() => {})
    }
  }, [hasAudio, audioSrc])

  // Playback routing (audio -> analyser -> destination)
  useEffect(() => {
    if (!hasAudio) {
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
      }
      // Keep AudioContext & source alive on the audio element so audio output
      // is not permanently disconnected when the Spectrogram unmounts.
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current.connect(audioContextRef.current!.destination)
      }
      sourceRef.current = null
      audioContextRef.current = null
      return
    }
    setupPlayback()
    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current.connect(audioContextRef.current!.destination)
      }
      sourceRef.current = null
      audioContextRef.current = null
    }
  }, [hasAudio, setupPlayback])

  // Measure horizontal scroll viewport width
  useEffect(() => {
    const el = scrollViewRef.current
    if (!el) return
    const update = () => setScrollViewWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [hasAudio])

  // Sync horizontal scroll position to current view (from timeline)
  // Skip if user is actively scrolling to avoid fighting the scrollbar
  useEffect(() => {
    const el = scrollViewRef.current
    if (!el || maxScrollLeft <= 0) return
    if (Date.now() < userScrollingUntilRef.current) return
    isProgrammaticScrollRef.current = true
    el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft))
  }, [targetScrollLeft, maxScrollLeft])

  // When playing and playhead is out of view (e.g. due to zoom), request scroll to keep it in view without changing zoom
  const playheadInView = currentTimeSeconds >= viewStart && currentTimeSeconds <= viewEnd
  useEffect(() => {
    if (!isPlaying || playheadInView || !isZoomed || !onRequestScrollToStartSeconds || baseSpan <= 0) return
    const margin = 0.15 * viewDuration
    const newViewStart = Math.max(0, Math.min(effectiveDuration - viewDuration, currentTimeSeconds - margin))
    const requestStart = Math.max(0, Math.min(effectiveDuration - baseSpan, newViewStart + viewDuration / 2 - baseSpan / 2))
    onRequestScrollToStartSeconds(requestStart)
  }, [isPlaying, playheadInView, isZoomed, currentTimeSeconds, viewStart, viewEnd, viewDuration, baseSpan, effectiveDuration, onRequestScrollToStartSeconds])

  const handleSpectrogramScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false
      return
    }
    const el = scrollViewRef.current
    if (!el || scrollableDuration <= 0 || scrollViewWidth <= 0 || !onRequestScrollToStartSeconds) return
    // Suppress programmatic scroll-back for 200ms so it doesn't fight user input
    userScrollingUntilRef.current = Date.now() + 200
    const startSec = (el.scrollLeft / maxScrollLeft) * scrollableDuration
    onRequestScrollToStartSeconds(Math.max(0, Math.min(effectiveDuration - viewDuration, startSec)))
  }, [scrollableDuration, maxScrollLeft, scrollViewWidth, effectiveDuration, onRequestScrollToStartSeconds, viewDuration])

  // Mouse-wheel on spectrogram: plain scroll = pan, Ctrl+scroll = zoom to cursor
  const handleWheelRef = useRef<(e: WheelEvent) => void>(() => {})
  handleWheelRef.current = (e: WheelEvent) => {
    if (effectiveDuration <= 0 || viewDuration <= 0) return
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+scroll: zoom towards mouse cursor
      const canvas = canvasRef.current
      let frac = 0.5
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left - Y_AXIS_WIDTH
        const graphW = rect.width - Y_AXIS_WIDTH
        if (graphW > 0) frac = Math.max(0, Math.min(1, x / graphW))
      }
      zoomAt(e.deltaY < 0 ? 'in' : 'out', frac)
    } else {
      if (!onRequestScrollToStartSeconds) return
      userScrollingUntilRef.current = Date.now() + 200
      const scrollFraction = 0.15
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
      const deltaSec = (delta > 0 ? 1 : -1) * viewDuration * scrollFraction
      const newStart = Math.max(0, Math.min(effectiveDuration - viewDuration, viewStart + deltaSec))
      onRequestScrollToStartSeconds(newStart)
    }
  }
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const handler = (e: WheelEvent) => handleWheelRef.current(e)
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [hasAudio])

  // Zoom towards a specific horizontal fraction (0 = left edge, 1 = right edge of graph)
  const zoomAt = useCallback((direction: 'in' | 'out', anchorFrac?: number) => {
    const frac = anchorFrac ?? 0.5
    const prevZoom = zoomLevelRef.current
    const prevOffset = zoomPanOffsetRef.current

    const newZoom = direction === 'in'
      ? Math.min(ZOOM_MAX, prevZoom * ZOOM_STEP)
      : Math.max(ZOOM_MIN, prevZoom / ZOOM_STEP)
    if (newZoom === prevZoom) return

    const prevSpan = baseSpan / prevZoom
    const prevCenter = baseCenter + prevOffset
    const prevViewStart = Math.max(0, prevCenter - prevSpan / 2)
    const cursorTime = prevViewStart + frac * prevSpan

    const newSpan = baseSpan / newZoom
    const newViewStart = cursorTime - frac * newSpan
    const newCenter = newViewStart + newSpan / 2
    const newOffset = newCenter - baseCenter

    setZoomLevel(newZoom)
    setZoomPanOffset(newOffset)
  }, [baseSpan, baseCenter])

  // Track mouse position over the spectrogram for cursor-aware zoom
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - Y_AXIS_WIDTH
    const graphW = rect.width - Y_AXIS_WIDTH
    if (graphW > 0) lastMouseFracRef.current = Math.max(0, Math.min(1, x / graphW))
  }, [])

  // Keyboard zoom: Ctrl+Plus / Ctrl+Minus (only when hovering the spectrogram)
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onEnter = () => { isHoveredRef.current = true }
    const onLeave = () => { isHoveredRef.current = false }
    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isHoveredRef.current) return
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        zoomAt('in', lastMouseFracRef.current)
      } else if (e.key === '-') {
        e.preventDefault()
        zoomAt('out', lastMouseFracRef.current)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [hasAudio, zoomAt])

  // Resize canvas to wrapper and repaint (wrapper fills resizable parent height)
  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const updateSize = () => {
      const w = wrapper.clientWidth
      const h = Math.max(80, wrapper.clientHeight)
      if (w > 0 && canvas.width !== w) canvas.width = w
      if (h > 0 && canvas.height !== h) canvas.height = h
      paintRef.current()
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [hasAudio])

  // Paint spectrogram + playhead + X-axis + Y-axis
  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    const graphLeft = Y_AXIS_WIDTH
    const graphWidth = Math.max(0, width - Y_AXIS_WIDTH)
    const graphHeight = Math.max(0, height - AXIS_HEIGHT)

    const img = spectrogramImageRef.current
    if (!img) {
      ctx.fillStyle = 'rgb(18, 22, 32)'
      ctx.fillRect(0, 0, width, height)
      if (loading) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '14px sans-serif'
        ctx.fillText('Loading spectrogram…', graphLeft + 12, height / 2)
      } else if (error) {
        ctx.fillStyle = 'rgba(255,120,120,0.9)'
        ctx.font = '14px sans-serif'
        ctx.fillText(error, graphLeft + 12, height / 2)
      }
      return
    }

    const duration = decodedDurationRef.current || durationSeconds || 1
    if (duration <= 0) return

    let offscreen = offscreenCanvasRef.current
    if (!offscreen || offscreen.width !== img.width || offscreen.height !== img.height) {
      offscreen = document.createElement('canvas')
      offscreen.width = img.width
      offscreen.height = img.height
      offscreenCanvasRef.current = offscreen
    }
    offscreen.getContext('2d')?.putImageData(img, 0, 0)

    // Clear Y-axis area
    ctx.fillStyle = 'rgb(18, 22, 32)'
    ctx.fillRect(0, 0, graphLeft, height)

    if (isZoomed) {
      const srcX = (viewStart / duration) * img.width
      const srcW = (viewDuration / duration) * img.width
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(offscreen, srcX, 0, srcW, img.height, graphLeft, 0, graphWidth, graphHeight)
    } else {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(offscreen, 0, 0, img.width, img.height, graphLeft, 0, graphWidth, graphHeight)
    }

    let playheadX =
      viewDuration > 0
        ? graphLeft + ((currentTimeSeconds - viewStart) / viewDuration) * graphWidth
        : graphLeft
    playheadX = Math.max(graphLeft, Math.min(width, playheadX))
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, graphHeight)
    ctx.stroke()

    // Y-axis: frequency labels (piecewise-linear scale)
    const maxFreq = decodedSampleRateRef.current / 2
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = '10px sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    for (const freq of FREQ_TICKS) {
      if (freq <= 0 || freq > maxFreq) continue
      const frac = freqFracToDisplay(freq / maxFreq) // mapped display fraction
      const y = graphHeight * (1 - frac)
      if (y < 4 || y > graphHeight - 4) continue
      ctx.fillText(freqLabel(freq), graphLeft - 6, y)
      ctx.beginPath()
      ctx.moveTo(graphLeft - 3, y)
      ctx.lineTo(graphLeft, y)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Clear X-axis strip so previous labels don't linger when visible range changes
    ctx.fillStyle = 'rgb(18, 22, 32)'
    ctx.fillRect(graphLeft, graphHeight, graphWidth, height - graphHeight)

    // X-axis: beats (primary, whole numbers) and seconds (secondary, may be fractional)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const hasBpm = bpm != null && bpm > 0
    const viewStartBeat = ((viewStart - beatOffset) * bpm!) / 60
    const viewEndBeat = ((viewEnd - beatOffset) * bpm!) / 60
    const viewSpanBeats = Math.max(0.001, viewEndBeat - viewStartBeat)
    // Use timeline's visible beat span for grid density when available, so at max zoom we always see every beat
    const spanForStep = visibleSpanBeats != null && visibleSpanBeats > 0 ? visibleSpanBeats : viewSpanBeats

    if (beatTimestampsMs && beatTimestampsMs.length > 0) {
      // Detected beats: green vertical lines (primary)
      let beatsInView = 0
      for (let i = 0; i < beatTimestampsMs.length; i++) {
        const sec = beatTimestampsMs[i] / 1000
        if (sec >= viewStart && sec <= viewEnd) beatsInView++
      }
      const stepBeats = beatAxisStep(beatsInView)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '12px sans-serif'
      for (let i = 0; i < beatTimestampsMs.length; i++) {
        if (i % stepBeats !== 0) continue
        const sec = beatTimestampsMs[i] / 1000
        if (sec < viewStart || sec > viewEnd) continue
        const x = graphLeft + ((sec - viewStart) / viewDuration) * graphWidth
        if (x < graphLeft || x > width) continue
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, graphHeight)
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, graphHeight)
        ctx.lineTo(x, height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillText(String(i), x, graphHeight + 2)
        const secLabel = sec % 1 === 0 ? `${Math.round(sec)}s` : `${sec.toFixed(2)}s`
        ctx.font = '10px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText(secLabel, x, graphHeight + 16)
        ctx.font = '12px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      }
    } else if (hasBpm) {
      // No detected beats: draw white BPM grid through spectrogram + axis below
      const stepBeats = beatAxisStep(spanForStep)
      const firstTickBeat = Math.ceil(viewStartBeat / stepBeats) * stepBeats
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '12px sans-serif'
      for (let beat = firstTickBeat; beat <= viewEndBeat; beat += stepBeats) {
        const x = graphLeft + ((beat - viewStartBeat) / viewSpanBeats) * graphWidth
        if (x < graphLeft || x > width) continue
        // White grid line through full spectrogram height
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, graphHeight)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        // Axis tick below spectrogram
        ctx.beginPath()
        ctx.moveTo(x, graphHeight)
        ctx.lineTo(x, height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillText(String(Math.round(beat)), x, graphHeight + 2)
        const sec = (beat * 60) / bpm! + beatOffset
        const secLabel = sec % 1 === 0 ? `${Math.round(sec)}s` : `${sec.toFixed(2)}s`
        ctx.font = '10px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText(secLabel, x, graphHeight + 16)
        ctx.font = '12px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      }
    } else {
      const step = timeAxisStep(viewDuration)
      const firstTick = Math.ceil(viewStart / step) * step
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '12px sans-serif'
      for (let t = firstTick; t <= viewEnd; t += step) {
        const x = graphLeft + ((t - viewStart) / viewDuration) * graphWidth
        if (x < graphLeft || x > width) continue
        ctx.beginPath()
        ctx.moveTo(x, graphHeight)
        ctx.lineTo(x, height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
        const label = t % 1 === 0 ? `${Math.round(t)}s` : `${t.toFixed(1)}s`
        ctx.fillText(label, x, graphHeight + 2)
      }
    }
  }, [
    loading,
    error,
    currentTimeSeconds,
    durationSeconds,
    bpm,
    beatOffset,
    beatTimestampsMs,
    isZoomed,
    viewStart,
    viewEnd,
    viewDuration,
    visibleSpanBeats,
  ])

  paintRef.current = paint
  useEffect(() => {
    paint()
  }, [paint, currentTimeSeconds])

  useEffect(() => {
    if (isPlaying) {
      const ac = audioContextRef.current
      if (ac?.state === 'suspended') ac.resume().catch(() => {})
    }
  }, [isPlaying])

  if (!hasAudio) return null

  return (
    <div className="spectrogram-wrapper">
      <div className="spectrogram-header">
        <span className="spectrogram-label">Spectrogram</span>
        <div className="spectrogram-zoom-controls">
          <button
            type="button"
            className="spectrogram-zoom-btn"
            onClick={() => {
              const playheadFrac = viewDuration > 0
                ? Math.max(0, Math.min(1, (currentTimeSeconds - viewStart) / viewDuration))
                : 0.5
              zoomAt('out', playheadFrac)
            }}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="spectrogram-zoom-btn"
            onClick={() => {
              const playheadFrac = viewDuration > 0
                ? Math.max(0, Math.min(1, (currentTimeSeconds - viewStart) / viewDuration))
                : 0.5
              zoomAt('in', playheadFrac)
            }}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>
      <div className="spectrogram-canvas-wrap" ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          className="spectrogram-canvas"
          width={800}
          height={180}
          title="Full-song spectrogram with playhead; zooms with timeline. When stopped, click to move marker and Run from."
          onMouseMove={handleCanvasMouseMove}
          onClick={(e) => {
            if (isPlaying || !onSeekToSeconds) return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left - Y_AXIS_WIDTH
            const graphW = rect.width - Y_AXIS_WIDTH
            if (graphW <= 0 || x < 0) return
            const seconds = viewStart + (x / graphW) * viewDuration
            onSeekToSeconds(Math.max(0, Math.min(effectiveDuration, seconds)))
          }}
        />
      </div>
      <div
        className="spectrogram-scroll-view"
        ref={scrollViewRef}
        onScroll={handleSpectrogramScroll}
      >
        <div
          className="spectrogram-scroll-content"
          style={{ width: Math.max(scrollViewWidth, contentWidthPx) }}
        />
      </div>
    </div>
  )
}
