import React, { useState, useMemo } from 'react'
import { Timeframe } from '../App'
import segmentsData from '../segments.json'
import RingVisualization from './RingVisualization'
import './TimeframePanel.css'

// Effect options by category (brightness.ts, hue.ts, motion.ts — coloring removed)
const BRIGHTNESS_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '(none)' },
  { value: 'brightness', label: 'Brightness' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'fadeOut', label: 'Fade Out' },
  { value: 'fadeInOut', label: 'Fade In Out' },
  { value: 'fadeOutIn', label: 'Fade Out In' },
  { value: 'blink', label: 'Blink' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'fade', label: 'Fade' },
]

const HUE_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '(none)' },
  { value: 'staticHueShift', label: 'Static Hue Shift' },
  { value: 'hueShiftStartToEnd', label: 'Hue Shift Start To End' },
  { value: 'hueShiftSin', label: 'Hue Shift Sin' },
]

const MOTION_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '(none)' },
  { value: 'snakeHeadMove', label: 'Snake Head Move' },
  { value: 'staticSnake', label: 'Static Snake' },
  { value: 'snake', label: 'Snake' },
  { value: 'snakeHeadSin', label: 'Snake Head Sin' },
  { value: 'snakeFillGrow', label: 'Snake Fill Grow' },
  { value: 'snakeInOut', label: 'Snake In Out' },
  { value: 'snakeSlowFast', label: 'Snake Slow Fast' },
  { value: 'snakeTailShrinkGrow', label: 'Snake Tail Shrink Grow' },
  { value: 'snakeHeadSteps', label: 'Snake Head Steps' },
]

// Parameter definitions per effect (brightness, hue, motion only)
type EffectParamDef = {
  key: string
  label: string
  type: 'number' | 'boolean'
  default?: number | boolean
  min?: number
  max?: number
  step?: number
}

const EFFECT_PARAM_SCHEMAS: Record<string, EffectParamDef[]> = {
  brightness: [{ key: 'value', label: 'Value', type: 'number', default: 1, min: 0, max: 1, step: 0.01 }],
  fadeInOut: [{ key: 'high', label: 'High', type: 'number', default: 1, min: 0, max: 1, step: 0.01 }],
  fadeOutIn: [{ key: 'low', label: 'Low', type: 'number', default: 0, min: 0, max: 1, step: 0.01 }],
  blink: [{ key: 'low', label: 'Low', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 }],
  pulse: [
    { key: 'low', label: 'Low', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'staticPhase', label: 'Static phase', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
  ],
  fade: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
  ],
  staticHueShift: [{ key: 'value', label: 'Value', type: 'number', default: 0, min: 0, max: 1, step: 0.01 }],
  hueShiftStartToEnd: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
  ],
  hueShiftSin: [{ key: 'amount', label: 'Amount', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 }],
  snakeHeadMove: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
    { key: 'tail', label: 'Tail', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01 },
  ],
  staticSnake: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
  ],
  snake: [
    { key: 'tailLength', label: 'Tail length', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01 },
    { key: 'cyclic', label: 'Cyclic', type: 'boolean', default: false },
    { key: 'reverse', label: 'Reverse', type: 'boolean', default: false },
  ],
  snakeHeadSin: [
    { key: 'tailLength', label: 'Tail length', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01 },
    { key: 'cyclic', label: 'Cyclic', type: 'boolean', default: false },
  ],
  snakeFillGrow: [{ key: 'reverse', label: 'Reverse', type: 'boolean', default: false }],
  snakeInOut: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 1, step: 0.01 },
  ],
  snakeSlowFast: [{ key: 'tailLength', label: 'Tail length', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01 }],
  snakeHeadSteps: [
    { key: 'steps', label: 'Steps', type: 'number', default: 4, min: 1, max: 32, step: 1 },
    { key: 'tailLength', label: 'Tail length', type: 'number', default: 0.5, min: 0, max: 2, step: 0.01 },
  ],
}

// Helper function to convert hex to hue
const hexToHue = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  
  if (max !== min) {
    if (max === r) {
      h = ((g - b) / (max - min)) % 6
    } else if (max === g) {
      h = (b - r) / (max - min) + 2
    } else {
      h = (r - g) / (max - min) + 4
    }
  }
  h = h / 6
  if (h < 0) h += 1
  return h
}

// Generate rainbow gradient CSS string based on start color and range
const generateRainbowGradient = (startColor: string, range: number): string => {
  const startHue = hexToHue(startColor) * 360
  const steps = 20 // Number of color stops for smooth gradient
  const colors: string[] = []
  
  for (let i = 0; i <= steps; i++) {
    const hue = (startHue + (i / steps) * range * 360) % 360
    colors.push(`hsl(${hue}, 100%, 50%)`)
  }
  
  return colors.join(', ')
}

interface TimeframePanelProps {
  timeframe: Timeframe | null
  onUpdate: (updates: Partial<Timeframe>) => void
  onClose: () => void
}

const TimeframePanel = ({ timeframe, onUpdate, onClose }: TimeframePanelProps) => {
  const [editingField, setEditingField] = useState<'label' | 'startTime' | 'endTime' | 'color' | 'rainbowRange' | null>(null)
  const [tempStartTime, setTempStartTime] = useState<string>('')
  const [tempEndTime, setTempEndTime] = useState<string>('')
  const [tempRainbowRange, setTempRainbowRange] = useState<string>('')

  // Extract segment names from segments.json, filtering out numeric indices (0-11)
  const segmentNames = useMemo(() => {
    return segmentsData.segments
      .map((segment: { name: string }) => segment.name)
      .filter((name: string) => {
        // Filter out numeric strings (0-11)
        const num = parseInt(name, 10)
        return isNaN(num) || num < 0 || num > 11
      })
  }, [])

  if (!timeframe) {
    return (
      <div className="timeframe-panel">
        <div className="timeframe-panel-empty">
          <p>Select a timeframe to view and edit its properties</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (
    field: 'label' | 'startTime' | 'endTime' | 'color' | 'rainbowRange',
    value: string | number
  ) => {
    if (field === 'label' || field === 'color') {
      onUpdate({ [field]: value as string })
    } else if (field === 'startTime') {
      // Store raw input value while typing
      setTempStartTime(value as string)
    } else if (field === 'endTime') {
      // Store raw input value while typing
      setTempEndTime(value as string)
    } else if (field === 'rainbowRange') {
      // Store raw input value while typing
      setTempRainbowRange(value as string)
    }
  }

  const handleBlur = () => {
    // Apply value without snapping - allow any beat value
    if (editingField === 'startTime' && tempStartTime !== '') {
      const numValue = parseFloat(tempStartTime)
      if (!isNaN(numValue) && numValue >= 0) {
        onUpdate({ startTime: numValue })
      }
      setTempStartTime('')
    } else if (editingField === 'endTime' && tempEndTime !== '') {
      const numValue = parseFloat(tempEndTime)
      if (!isNaN(numValue) && numValue > timeframe.startTime) {
        onUpdate({ endTime: numValue })
      }
      setTempEndTime('')
    } else if (editingField === 'rainbowRange' && tempRainbowRange !== '') {
      const numValue = parseFloat(tempRainbowRange)
      if (!isNaN(numValue) && numValue > 0) {
        onUpdate({ rainbowRange: numValue })
      }
      setTempRainbowRange('')
    }
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  const handleStartTimeFocus = () => {
    setEditingField('startTime')
    setTempStartTime(timeframe.startTime.toString())
  }

  const handleEndTimeFocus = () => {
    setEditingField('endTime')
    setTempEndTime(timeframe.endTime.toString())
  }

  const duration = timeframe.endTime - timeframe.startTime

  return (
    <div className="timeframe-panel">
      <div className="timeframe-panel-header">
        <h2>Timeframe Details</h2>
        <button
          className="timeframe-panel-delete"
          onClick={onClose}
          title="Close details"
        >
          ×
        </button>
      </div>

      <div className="timeframe-panel-content">
        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Label</label>
          {editingField === 'label' ? (
            <input
              type="text"
              value={timeframe.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="timeframe-panel-input"
              autoFocus
            />
          ) : (
            <div
              className="timeframe-panel-value editable"
              onClick={() => setEditingField('label')}
            >
              {timeframe.label}
            </div>
          )}
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Time Range</label>
          <div className="timeframe-panel-time-row">
            {editingField === 'startTime' ? (
              <input
                type="number"
                value={tempStartTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="timeframe-panel-input-small"
                autoFocus
                step="1"
                min="0"
              />
            ) : (
              <div
                className="timeframe-panel-time-value editable"
                onClick={handleStartTimeFocus}
              >
                {timeframe.startTime}b
              </div>
            )}
            <span className="timeframe-panel-time-separator">→</span>
            {editingField === 'endTime' ? (
              <input
                type="number"
                value={tempEndTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="timeframe-panel-input-small"
                autoFocus
                step="1"
                min={timeframe.startTime + 4}
              />
            ) : (
              <div
                className="timeframe-panel-time-value editable"
                onClick={handleEndTimeFocus}
              >
                {timeframe.endTime}b
              </div>
            )}
            <span className="timeframe-panel-duration">({duration}b)</span>
          </div>
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Color</label>
          <div className="timeframe-panel-color-row">
            {editingField === 'color' ? (
              <input
                type="color"
                value={timeframe.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                onBlur={handleBlur}
                className="timeframe-panel-color-input"
                autoFocus
              />
            ) : (
              <>
                <div
                  className="timeframe-panel-color-preview"
                  style={{ backgroundColor: timeframe.color }}
                  onClick={() => setEditingField('color')}
                />
                <div
                  className="timeframe-panel-value editable"
                  onClick={() => setEditingField('color')}
                >
                  {timeframe.color}
                </div>
              </>
            )}
          </div>
          <div className="timeframe-panel-rainbow-row">
            <label className="timeframe-panel-checkbox-label">
              <input
                type="checkbox"
                checked={timeframe.rainbow || false}
                onChange={(e) => onUpdate({ rainbow: e.target.checked, rainbowRange: e.target.checked ? (timeframe.rainbowRange || 1) : undefined })}
                className="timeframe-panel-checkbox"
              />
              <span>Rainbow</span>
            </label>
            {timeframe.rainbow && (
              <div className="timeframe-panel-rainbow-range">
                <span>Range:</span>
                <div className="timeframe-panel-rainbow-slider-container">
                  <div 
                    className="timeframe-panel-rainbow-slider-wrapper"
                    style={{
                      background: `linear-gradient(to right, ${generateRainbowGradient(timeframe.color, timeframe.rainbowRange || 1)})`
                    }}
                  >
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={timeframe.rainbowRange || 1}
                      onChange={(e) => onUpdate({ rainbowRange: parseFloat(e.target.value) })}
                      className="timeframe-panel-rainbow-slider"
                    />
                  </div>
                  <div className="timeframe-panel-rainbow-range-value">
                    {timeframe.rainbowRange || 1}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Rings</label>
          <div className="timeframe-panel-rings">
            <div className="timeframe-panel-rings-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(ring => (
                <button
                  key={ring}
                  className={`timeframe-panel-ring-button ${timeframe.rings.includes(ring) ? 'active' : ''}`}
                  onClick={() => {
                    const newRings = timeframe.rings.includes(ring)
                      ? timeframe.rings.filter(r => r !== ring)
                      : [...timeframe.rings, ring].sort((a, b) => a - b)
                    onUpdate({ rings: newRings })
                  }}
                  title={`Ring ${ring}`}
                >
                  {ring}
                </button>
              ))}
            </div>
            <div className="timeframe-panel-rings-quick-select">
              <button onClick={() => onUpdate({ rings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })}>All</button>
              <button onClick={() => onUpdate({ rings: [2, 4, 6, 8, 10, 12] })}>Even</button>
              <button onClick={() => onUpdate({ rings: [1, 3, 5, 7, 9, 11] })}>Odd</button>
              <button onClick={() => onUpdate({ rings: [1, 2, 3, 4, 5, 6] })}>Left</button>
              <button onClick={() => onUpdate({ rings: [7, 8, 9, 10, 11, 12] })}>Right</button>
              <button onClick={() => onUpdate({ rings: [4, 5, 6, 7, 8, 9] })}>Center</button>
            </div>
          </div>
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Brightness effect</label>
          <select
            value={timeframe.brightnessEffect ?? ''}
            onChange={(e) => {
              const next = e.target.value || undefined
              onUpdate({
                brightnessEffect: next,
                brightnessEffectParams: next ? (EFFECT_PARAM_SCHEMAS[next]?.reduce((acc, def) => {
                  if (def.default !== undefined) acc[def.key] = def.default
                  return acc
                }, {} as Record<string, number | boolean>) ?? undefined) : undefined,
              })
            }}
            className="timeframe-panel-select"
          >
            {BRIGHTNESS_EFFECT_OPTIONS.map(opt => (
              <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {timeframe.brightnessEffect && EFFECT_PARAM_SCHEMAS[timeframe.brightnessEffect] && (
            <div className="timeframe-panel-effect-params">
              {EFFECT_PARAM_SCHEMAS[timeframe.brightnessEffect].map(def => {
                const current = timeframe.brightnessEffectParams?.[def.key]
                const value = current !== undefined ? current : def.default
                return (
                  <div key={def.key} className="timeframe-panel-effect-param-row">
                    <label className="timeframe-panel-effect-param-label">{def.label}</label>
                    {def.type === 'boolean' ? (
                      <input type="checkbox" checked={value === true}
                        onChange={(e) => onUpdate({ brightnessEffectParams: { ...timeframe.brightnessEffectParams, [def.key]: e.target.checked } })}
                        className="timeframe-panel-effect-param-checkbox" />
                    ) : (
                      <input type="number"
                        value={typeof value === 'number' ? value : (typeof def.default === 'number' ? def.default : 0)}
                        min={def.min} max={def.max} step={def.step}
                        onChange={(e) => { const num = parseFloat(e.target.value); if (!isNaN(num)) onUpdate({ brightnessEffectParams: { ...timeframe.brightnessEffectParams, [def.key]: num } }) }}
                        className="timeframe-panel-effect-param-input" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Hue effect</label>
          <select
            value={timeframe.hueEffect ?? ''}
            onChange={(e) => {
              const next = e.target.value || undefined
              onUpdate({
                hueEffect: next,
                hueEffectParams: next ? (EFFECT_PARAM_SCHEMAS[next]?.reduce((acc, def) => {
                  if (def.default !== undefined) acc[def.key] = def.default
                  return acc
                }, {} as Record<string, number | boolean>) ?? undefined) : undefined,
              })
            }}
            className="timeframe-panel-select"
          >
            {HUE_EFFECT_OPTIONS.map(opt => (
              <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {timeframe.hueEffect && EFFECT_PARAM_SCHEMAS[timeframe.hueEffect] && (
            <div className="timeframe-panel-effect-params">
              {EFFECT_PARAM_SCHEMAS[timeframe.hueEffect].map(def => {
                const current = timeframe.hueEffectParams?.[def.key]
                const value = current !== undefined ? current : def.default
                return (
                  <div key={def.key} className="timeframe-panel-effect-param-row">
                    <label className="timeframe-panel-effect-param-label">{def.label}</label>
                    {def.type === 'boolean' ? (
                      <input type="checkbox" checked={value === true}
                        onChange={(e) => onUpdate({ hueEffectParams: { ...timeframe.hueEffectParams, [def.key]: e.target.checked } })}
                        className="timeframe-panel-effect-param-checkbox" />
                    ) : (
                      <input type="number"
                        value={typeof value === 'number' ? value : (typeof def.default === 'number' ? def.default : 0)}
                        min={def.min} max={def.max} step={def.step}
                        onChange={(e) => { const num = parseFloat(e.target.value); if (!isNaN(num)) onUpdate({ hueEffectParams: { ...timeframe.hueEffectParams, [def.key]: num } }) }}
                        className="timeframe-panel-effect-param-input" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Motion effect</label>
          <select
            value={timeframe.motionEffect ?? ''}
            onChange={(e) => {
              const next = e.target.value || undefined
              onUpdate({
                motionEffect: next,
                motionEffectParams: next ? (EFFECT_PARAM_SCHEMAS[next]?.reduce((acc, def) => {
                  if (def.default !== undefined) acc[def.key] = def.default
                  return acc
                }, {} as Record<string, number | boolean>) ?? undefined) : undefined,
              })
            }}
            className="timeframe-panel-select"
          >
            {MOTION_EFFECT_OPTIONS.map(opt => (
              <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {timeframe.motionEffect && EFFECT_PARAM_SCHEMAS[timeframe.motionEffect] && (
            <div className="timeframe-panel-effect-params">
              {EFFECT_PARAM_SCHEMAS[timeframe.motionEffect].map(def => {
                const current = timeframe.motionEffectParams?.[def.key]
                const value = current !== undefined ? current : def.default
                return (
                  <div key={def.key} className="timeframe-panel-effect-param-row">
                    <label className="timeframe-panel-effect-param-label">{def.label}</label>
                    {def.type === 'boolean' ? (
                      <input type="checkbox" checked={value === true}
                        onChange={(e) => onUpdate({ motionEffectParams: { ...timeframe.motionEffectParams, [def.key]: e.target.checked } })}
                        className="timeframe-panel-effect-param-checkbox" />
                    ) : (
                      <input type="number"
                        value={typeof value === 'number' ? value : (typeof def.default === 'number' ? def.default : 0)}
                        min={def.min} max={def.max} step={def.step}
                        onChange={(e) => { const num = parseFloat(e.target.value); if (!isNaN(num)) onUpdate({ motionEffectParams: { ...timeframe.motionEffectParams, [def.key]: num } }) }}
                        className="timeframe-panel-effect-param-input" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="timeframe-panel-section">
          <label className="timeframe-panel-label">Mapping</label>
          <select
            value={timeframe.mapping || 'all'}
            onChange={(e) => onUpdate({ mapping: e.target.value })}
            className="timeframe-panel-select"
          >
            {segmentNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="timeframe-panel-mapping-visualization">
            <RingVisualization 
              mapping={timeframe.mapping || 'all'}
              rainbow={timeframe.rainbow}
              rainbowRange={timeframe.rainbowRange}
              startColor={timeframe.color}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeframePanel
