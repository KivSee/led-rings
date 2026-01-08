import { useState } from 'react'
import Timeline from './components/Timeline'
import TimeframePanel from './components/TimeframePanel'
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
}

function App() {
  const snapToBeat = (beat: number): number => {
    return Math.round(beat / 4) * 4
  }

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

  const handlePanelDelete = () => {
    if (focusedTimeframeId) {
      deleteTimeframe(focusedTimeframeId)
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Timeline Manager</h1>
        <button className="add-button" onClick={addTimeframe}>
          + Add Timeframe
        </button>
      </div>
      <div className="app-content">
        <Timeline
          timeframes={timeframes}
          onUpdate={updateTimeframe}
          onDelete={deleteTimeframe}
          onAdd={addTimeframeFromDrag}
          focusedTimeframeId={focusedTimeframeId}
          onFocusedTimeframeChange={setFocusedTimeframeId}
        />
        <TimeframePanel
          timeframe={focusedTimeframe}
          onUpdate={handlePanelUpdate}
          onDelete={handlePanelDelete}
        />
      </div>
    </div>
  )
}

export default App
