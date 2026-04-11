import React from 'react'
import { Timeframe } from '../App'
import { isRingActiveAtBeat } from '../movementGenerators'
import RingVisualization from './RingVisualization'
import './PlaybackRingsPanel.css'

interface PlaybackRingsPanelProps {
  currentTime: number
  timeframes: Timeframe[]
  isPlaying: boolean
  liveMode: boolean
  sendSequenceLoading: boolean
  apiAvailable: boolean
  onPlayPause: () => void
  onStop: () => void
  onSendSequence: () => void
  onLiveModeChange: (value: boolean) => void
  muteAudio?: boolean
  onMuteAudioChange?: (value: boolean) => void
  playbackSpeed: number
  onPlaybackSpeedChange: (speed: number) => void
  useSimSpeed: boolean
  onSimPlayPause: () => void
  runFromSeconds: number
  onRunFromChange: (n: number) => void
}

function getActiveTimeframesAt(time: number, timeframes: Timeframe[]): Timeframe[] {
  return timeframes.filter(
    (tf) => !tf.disabled && time >= tf.startTime && time < tf.endTime
  )
}

const ZOOM_STEP = 0.25
const ZOOM_MIN = 0.25
const ZOOM_MAX = 10

const SPEED_MIN = 0.1
const SPEED_MAX = 4.0
const SPEED_STEP = 0.1
const SPEED_TICKS = [0.5, 1.0, 2.0, 3.0, 4.0]

const PlaybackRingsPanel = ({
  currentTime,
  timeframes,
  isPlaying,
  liveMode,
  sendSequenceLoading,
  apiAvailable,
  onPlayPause,
  onStop,
  onSendSequence,
  onLiveModeChange,
  muteAudio,
  onMuteAudioChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  useSimSpeed,
  onSimPlayPause,
  runFromSeconds,
  onRunFromChange,
}: PlaybackRingsPanelProps) => {
  // FPS counter: measure time between renders, keep a rolling window of 30 samples
  const fpsRef = React.useRef<number>(0)
  const lastFrameTime = React.useRef<number>(0)
  const frameTimes = React.useRef<number[]>([])
  const now = performance.now()
  if (lastFrameTime.current > 0) {
    const delta = now - lastFrameTime.current
    frameTimes.current.push(delta)
    if (frameTimes.current.length > 30) frameTimes.current.shift()
    const avg = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
    fpsRef.current = Math.round(1000 / avg)
  }
  lastFrameTime.current = now

  const [zoom, setZoom] = React.useState(1.0)
  const [resetPanToken, setResetPanToken] = React.useState(0)
  const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * 100) / 100))

  const activeTimeframes = getActiveTimeframesAt(currentTime, timeframes)
  const activeRings = Array.from(new Set(
    activeTimeframes.flatMap(tf =>
      tf.rings.filter(r =>
        isRingActiveAtBeat(tf.startTime, tf.endTime, tf.rings, tf.movement, r, currentTime)
      )
    )
  ))

  return (
    <div className="playback-rings-panel">
      <div className="playback-rings-panel-header">
        <div className="playback-rings-panel-header-top">
          <h2>Playback</h2>
          <div className="playback-rings-panel-time">
            Time: {currentTime.toFixed(1)}b
          </div>
          <label className="playback-run-from" title="Timeline position when you press Run">
            <span>Run from</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={runFromSeconds}
              onChange={(e) => { const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0) onRunFromChange(n) }}
              className="playback-run-from-input"
            />
            <span>sec</span>
          </label>
          <div className="playback-rings-panel-fps">
            {fpsRef.current > 0 ? `${fpsRef.current} fps` : '—'}
          </div>
        </div>
        <div className="playback-rings-panel-controls">
          <label className="playback-live-mode" title="When on, Run also starts the song on the device; Stop sends stop.">
            <input
              type="checkbox"
              checked={liveMode}
              onChange={(e) => onLiveModeChange(e.target.checked)}
            />
            <span>Live</span>
          </label>
          <label className="playback-live-mode" title="Mute simulator audio (useful in Live mode to avoid echo from device)">
            <input
              type="checkbox"
              checked={muteAudio ?? false}
              onChange={(e) => onMuteAudioChange?.(e.target.checked)}
            />
            <span>Mute</span>
          </label>
          <button
            className={`playback-ctrl-btn ${isPlaying && !useSimSpeed ? 'playing' : ''}`}
            onClick={onPlayPause}
          >
            {isPlaying && !useSimSpeed ? '⏸ Pause' : '▶ Run'}
          </button>
          <button className="playback-ctrl-btn stop" onClick={onStop}>
            ⏹ Stop
          </button>
          <button
            className="playback-ctrl-btn send"
            onClick={onSendSequence}
            disabled={sendSequenceLoading || !apiAvailable}
            title={!apiAvailable ? 'Control server is not running' : 'Send current sequence to LEDs'}
          >
            {sendSequenceLoading ? '…' : 'Send to LEDs'}
          </button>
          {!liveMode && (
            <div className="playback-speed-group">
              <div className="playback-speed-divider" />
              <span className="playback-speed-label">Speed</span>
              <button
                className={`playback-speed-btn ${isPlaying && useSimSpeed ? 'playing' : ''}`}
                onClick={onSimPlayPause}
                title="Play/pause at sim speed"
              >
                {isPlaying && useSimSpeed ? '⏸' : '▶'}
              </button>
              <div className="playback-speed-slider-wrap">
                <input
                  type="range"
                  className="playback-speed-slider"
                  min={SPEED_MIN}
                  max={SPEED_MAX}
                  step={SPEED_STEP}
                  value={playbackSpeed}
                  onChange={(e) => onPlaybackSpeedChange(parseFloat(e.target.value))}
                />
                <div className="playback-speed-ticks">
                  {SPEED_TICKS.map(t => (
                    <div
                      key={t}
                      className={`playback-speed-tick ${t === 1.0 ? 'playback-speed-tick-one' : ''}`}
                      style={{ left: `${((t - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100}%` }}
                    >
                      <div className="playback-speed-tick-mark" />
                    </div>
                  ))}
                </div>
              </div>
              <input
                type="number"
                className="playback-speed-value"
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                value={playbackSpeed.toFixed(1)}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  if (!isNaN(n)) onPlaybackSpeedChange(Math.max(SPEED_MIN, Math.min(SPEED_MAX, Math.round(n * 10) / 10)))
                }}
                title="Playback speed"
              />
            </div>
          )}
        </div>
      </div>
      <div className="playback-rings-panel-content">
        {activeTimeframes.length > 0 ? (
          <>
            <div className="playback-rings-panel-segment">
              <span className="playback-rings-panel-segment-label">{activeTimeframes.length} active segment{activeTimeframes.length > 1 ? 's' : ''}</span>
              <span className="playback-rings-panel-segment-range">{activeRings.length} active ring{activeRings.length > 1 ? 's' : ''}</span>
              <div className="playback-zoom-controls">
                <span className="playback-zoom-label">Zoom</span>
                <button className="playback-zoom-btn" onClick={() => setZoom(z => clampZoom(z - ZOOM_STEP))} disabled={zoom <= ZOOM_MIN} title="Zoom out">−</button>
                <span className="playback-zoom-value" title="Ctrl+scroll over visualizer to zoom">{Math.round(zoom * 100)}%</span>
                <button className="playback-zoom-btn" onClick={() => setZoom(z => clampZoom(z + ZOOM_STEP))} disabled={zoom >= ZOOM_MAX} title="Zoom in">+</button>
                <button className="playback-zoom-btn" onClick={() => { setZoom(1.0); setResetPanToken(t => t + 1) }} title="Reset zoom" style={{ fontSize: 10 }}>1:1</button>
              </div>
            </div>
            <div className="playback-rings-panel-visualization">
              <RingVisualization
                mapping="all"
                activeRings={activeRings}
                timeframes={activeTimeframes}
                currentTime={currentTime}
                zoom={zoom}
                onZoomChange={z => setZoom(clampZoom(z))}
                resetPanToken={resetPanToken}
              />
            </div>
          </>
        ) : (
          <div className="playback-rings-panel-empty">
            <p>No active segment at {currentTime.toFixed(1)}b</p>
            <p className="playback-rings-panel-empty-hint">
                Scrub the timeline or press Run to see rings update
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaybackRingsPanel
