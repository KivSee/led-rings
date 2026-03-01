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
}: PlaybackRingsPanelProps) => {
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
            title={!apiAvailable ? 'Set VITE_API_URL and run control server' : 'Send current sequence to device'}
          >
            {sendSequenceLoading ? '…' : 'Send'}
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
