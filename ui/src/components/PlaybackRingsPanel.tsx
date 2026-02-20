import React from 'react'
import { Timeframe } from '../App'
import RingVisualization from './RingVisualization'
import './PlaybackRingsPanel.css'

interface PlaybackRingsPanelProps {
  currentTime: number
  timeframes: Timeframe[]
}

// Get the active timeframe at a given time (last in list wins if overlapping)
function getActiveTimeframeAt(time: number, timeframes: Timeframe[]): Timeframe | null {
  const active = timeframes.filter(
    (tf) => time >= tf.startTime && time < tf.endTime
  )
  return active.length > 0 ? active[active.length - 1]! : null
}

const PlaybackRingsPanel = ({ currentTime, timeframes }: PlaybackRingsPanelProps) => {
  const activeTimeframe = getActiveTimeframeAt(currentTime, timeframes)

  return (
    <div className="playback-rings-panel">
      <div className="playback-rings-panel-header">
        <h2>Playback</h2>
        <div className="playback-rings-panel-time">
          {currentTime.toFixed(1)}b
        </div>
      </div>
      <div className="playback-rings-panel-content">
        {activeTimeframe ? (
          <>
            <div className="playback-rings-panel-segment">
              <span className="playback-rings-panel-segment-label">
                {activeTimeframe.label}
              </span>
              <span className="playback-rings-panel-segment-range">
                {activeTimeframe.startTime}b → {activeTimeframe.endTime}b
              </span>
            </div>
            <div className="playback-rings-panel-visualization">
              <RingVisualization
                mapping={activeTimeframe.mapping || 'all'}
                activeRings={activeTimeframe.rings}
                timeframe={activeTimeframe}
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
