import { Timeframe } from '../App'
import RingVisualization from './RingVisualization'
import './PlaybackRingsPanel.css'

interface PlaybackRingsPanelProps {
  currentTime: number
  timeframes: Timeframe[]
}

// Get all active timeframes at a given time
function getActiveTimeframesAt(time: number, timeframes: Timeframe[]): Timeframe[] {
  return timeframes.filter(
    (tf) => !tf.disabled && time >= tf.startTime && time < tf.endTime
  )
}

const PlaybackRingsPanel = ({ currentTime, timeframes }: PlaybackRingsPanelProps) => {
  const activeTimeframes = getActiveTimeframesAt(currentTime, timeframes)
  const activeRings = Array.from(new Set(activeTimeframes.flatMap(tf => tf.rings)))

  return (
    <div className="playback-rings-panel">
      <div className="playback-rings-panel-header">
        <h2>Playback</h2>
        <div className="playback-rings-panel-time">
          Time: {currentTime.toFixed(1)}b
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
