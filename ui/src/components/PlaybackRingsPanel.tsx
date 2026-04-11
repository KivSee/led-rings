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
}

function getActiveTimeframesAt(time: number, timeframes: Timeframe[]): Timeframe[] {
  return timeframes.filter(
    (tf) => !tf.disabled && time >= tf.startTime && time < tf.endTime
  )
}

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
            className={`playback-ctrl-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onPlayPause}
          >
            {isPlaying ? '⏸ Pause' : '▶ Run'}
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
        </div>
      </div>
      <div className="playback-rings-panel-content">
        {activeTimeframes.length > 0 ? (
          <>
            <div className="playback-rings-panel-segment">
              <span className="playback-rings-panel-segment-label">
                {activeTimeframes.length} active segment{activeTimeframes.length > 1 ? 's' : ''}
              </span>
              <span className="playback-rings-panel-segment-range">
                {activeRings.length} ring{activeRings.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="playback-rings-panel-visualization">
              <RingVisualization
                mapping="all"
                activeRings={activeRings}
                timeframes={activeTimeframes}
                currentTime={currentTime}
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
