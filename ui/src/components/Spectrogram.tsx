import React, { useRef, useEffect, useCallback, useState } from 'react'
import { realFftMagnitude } from '../fft'
import './Spectrogram.css'

const FFT_SIZE = 2048
const HOP_SIZE = 512
const SPECTROGRAM_HEIGHT = 128

/** Map 0..255 magnitude to RGB for a heat-style gradient (dark blue -> cyan -> green -> yellow -> red) */
function magnitudeToRgb(n: number): { r: number; g: number; b: number } {
  const t = Math.min(1, n / 255)
  const r = Math.round(Math.min(255, 255 * (t < 0.5 ? 0 : (t - 0.5) * 2)))
  const g = Math.round(255 * (t < 0.25 ? t * 4 : t < 0.75 ? 1 : (1 - t) * 4))
  const b = Math.round(255 * (t < 0.5 ? 0.25 + t * 1.5 : 1 - (t - 0.5) * 1.5))
  return { r: r & 0xff, g: g & 0xff, b: b & 0xff }
}

const AXIS_HEIGHT = 24
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_STEP = 1.25

/** Pick a step (seconds) for time axis labels so we get ~5–12 ticks. */
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
  /** When set, spectrogram shows only this range (zoom to timeline). */
  visibleStartSeconds?: number
  visibleEndSeconds?: number
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
  visibleStartSeconds,
  visibleEndSeconds,
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
  const isProgrammaticScrollRef = useRef(false)
  const [scrollViewWidth, setScrollViewWidth] = useState(0)
  const effectiveDuration = decodedDurationRef.current || durationSeconds || 1
  const isZoomed =
    visibleStartSeconds != null &&
    visibleEndSeconds != null &&
    visibleEndSeconds > visibleStartSeconds
  const baseStart = isZoomed ? visibleStartSeconds! : 0
  const baseEnd = isZoomed ? visibleEndSeconds! : effectiveDuration
  const baseCenter = (baseStart + baseEnd) / 2
  const baseSpan = Math.max(0.001, baseEnd - baseStart)
  const [zoomLevel, setZoomLevel] = useState(1)
  const zoomedSpan = baseSpan / zoomLevel
  const viewStart = Math.max(0, baseCenter - zoomedSpan / 2)
  const viewEnd = Math.min(effectiveDuration, baseCenter + zoomedSpan / 2)
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
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
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

        const numColumns = Math.max(1, Math.floor((length - FFT_SIZE) / HOP_SIZE) + 1)
        const cols: Float32Array[] = []
        const windowBuf = new Float32Array(FFT_SIZE)
        const numBins = FFT_SIZE / 2 + 1

        for (let c = 0; c < numColumns; c++) {
          const start = c * HOP_SIZE
          if (start + FFT_SIZE > length) break
          for (let i = 0; i < FFT_SIZE; i++) windowBuf[i] = mono[start + i]
          const mag = realFftMagnitude(windowBuf, FFT_SIZE)
          const col = new Float32Array(SPECTROGRAM_HEIGHT)
          for (let row = 0; row < SPECTROGRAM_HEIGHT; row++) {
            const binStart = Math.floor((row / SPECTROGRAM_HEIGHT) * numBins)
            const binEnd = Math.floor(((row + 1) / SPECTROGRAM_HEIGHT) * numBins)
            let sum = 0
            let count = 0
            for (let b = binStart; b < binEnd && b < numBins; b++) {
              sum += mag[b]
              count++
            }
            const v = count > 0 ? sum / count : 0
            col[SPECTROGRAM_HEIGHT - 1 - row] = Math.log1p(v)
          }
          cols.push(col)
        }

        let minVal = Infinity
        let maxVal = -Infinity
        for (const col of cols) {
          for (let row = 0; row < col.length; row++) {
            const v = col[row]
            if (Number.isFinite(v)) {
              if (v < minVal) minVal = v
              if (v > maxVal) maxVal = v
            }
          }
        }
        if (minVal === Infinity) minVal = 0
        if (maxVal === -Infinity) maxVal = minVal + 1
        const range = Math.max(1e-6, maxVal - minVal)

        decodedDurationRef.current = buffer.duration
        const w = cols.length
        const h = SPECTROGRAM_HEIGHT
        const imageData = new ImageData(w, h)
        const buf = imageData.data
        for (let py = 0; py < h; py++) {
          for (let px = 0; px < w; px++) {
            const col = cols[px]
            const raw = col ? col[py] : 0
            const norm = Number.isFinite(raw)
              ? Math.round(((raw - minVal) / range) * 255)
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
      analyserRef.current = null
      sourceRef.current = null
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(() => {})
      }
      audioContextRef.current = null
      return
    }
    setupPlayback()
    return () => {
      analyserRef.current = null
      sourceRef.current = null
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(() => {})
      }
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
  useEffect(() => {
    const el = scrollViewRef.current
    if (!el || maxScrollLeft <= 0) return
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
    const startSec = (el.scrollLeft / maxScrollLeft) * scrollableDuration
    onRequestScrollToStartSeconds(Math.max(0, Math.min(effectiveDuration - viewDuration, startSec)))
  }, [scrollableDuration, maxScrollLeft, scrollViewWidth, effectiveDuration, viewDuration, onRequestScrollToStartSeconds])

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

  // Paint spectrogram + playhead + X-axis
  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    const graphHeight = Math.max(0, height - AXIS_HEIGHT)

    const img = spectrogramImageRef.current
    if (!img) {
      ctx.fillStyle = 'rgb(18, 22, 32)'
      ctx.fillRect(0, 0, width, height)
      if (loading) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '14px sans-serif'
        ctx.fillText('Loading spectrogram…', 12, height / 2)
      } else if (error) {
        ctx.fillStyle = 'rgba(255,120,120,0.9)'
        ctx.font = '14px sans-serif'
        ctx.fillText(error, 12, height / 2)
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

    if (isZoomed) {
      const srcX = (viewStart / duration) * img.width
      const srcW = (viewDuration / duration) * img.width
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(offscreen, srcX, 0, srcW, img.height, 0, 0, width, graphHeight)
    } else {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(offscreen, 0, 0, img.width, img.height, 0, 0, width, graphHeight)
    }

    let playheadX =
      viewDuration > 0
        ? ((currentTimeSeconds - viewStart) / viewDuration) * width
        : 0
    playheadX = Math.max(0, Math.min(width, playheadX))
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, graphHeight)
    ctx.stroke()

    // Clear X-axis strip so previous labels don’t linger when visible range changes
    ctx.fillStyle = 'rgb(18, 22, 32)'
    ctx.fillRect(0, graphHeight, width, height - graphHeight)

    // X-axis: seconds markers (drawn after playhead so labels are not covered)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const step = timeAxisStep(viewDuration)
    const firstTick = Math.ceil(viewStart / step) * step
    for (let t = firstTick; t <= viewEnd; t += step) {
      const x = ((t - viewStart) / viewDuration) * width
      if (x < 0 || x > width) continue
      ctx.beginPath()
      ctx.moveTo(x, graphHeight)
      ctx.lineTo(x, height)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
      const label = t % 1 === 0 ? `${Math.round(t)}s` : `${t.toFixed(1)}s`
      ctx.fillText(label, x, graphHeight + 4)
    }
  }, [
    loading,
    error,
    currentTimeSeconds,
    durationSeconds,
    isZoomed,
    viewStart,
    viewEnd,
    viewDuration,
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
            onClick={() => setZoomLevel((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP))}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="spectrogram-zoom-btn"
            onClick={() => setZoomLevel((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP))}
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
          onClick={(e) => {
            if (isPlaying || !onSeekToSeconds) return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const width = rect.width
            if (width <= 0) return
            const seconds = viewStart + (x / width) * viewDuration
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
