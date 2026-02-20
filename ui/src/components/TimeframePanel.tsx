import React, { useState, useMemo } from 'react'
import { Timeframe, TimeframeCycleEntry, TimeframeCycleBeats, getTimeframeEffects, TimeframeEffectEntry } from '../App'
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

const POSITION_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'position_brightness', label: 'Position Brightness' },
  { value: 'position_hue', label: 'Position Hue' },
  { value: 'position_saturation', label: 'Position Saturation' },
]

const SNAKE_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'snake_brightness', label: 'Snake Brightness' },
  { value: 'snake_hue', label: 'Snake Hue' },
  { value: 'snake_saturation', label: 'Snake Saturation' },
]

const TIMED_EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'timed_brightness', label: 'Timed Brightness' },
  { value: 'timed_hue', label: 'Timed Hue' },
  { value: 'timed_saturation', label: 'Timed Saturation' },
]

// Single combined list for one selector: (none) then Position / Timed / Snake / Brightness / Hue / Motion groups
type EffectCategory = 'Brightness' | 'Hue' | 'Motion' | 'Position' | 'Snake' | 'Timed' | null
const ALL_EFFECT_OPTIONS: { value: string; label: string; category: EffectCategory }[] = [
  { value: '', label: '(none)', category: null },
  ...POSITION_EFFECT_OPTIONS.map(o => ({ ...o, category: 'Position' as const })),
  ...TIMED_EFFECT_OPTIONS.map(o => ({ ...o, category: 'Timed' as const })),
  ...SNAKE_EFFECT_OPTIONS.map(o => ({ ...o, category: 'Snake' as const })),
  ...BRIGHTNESS_EFFECT_OPTIONS.filter(o => o.value).map(o => ({ ...o, category: 'Brightness' as const })),
  ...HUE_EFFECT_OPTIONS.filter(o => o.value).map(o => ({ ...o, category: 'Hue' as const })),
  ...MOTION_EFFECT_OPTIONS.filter(o => o.value).map(o => ({ ...o, category: 'Motion' as const })),
]

// FloatFunction kinds and their parameter definitions (for UI and codegen)
export type FloatFunctionKind = 'const_value' | 'linear' | 'sin' | 'steps'
type FloatFunctionParamDef = { key: string; label: string; type: 'number'; default: number; min?: number; max?: number; step?: number }

const FLOAT_FUNCTION_KINDS: { value: FloatFunctionKind; label: string }[] = [
  { value: 'const_value', label: 'Const' },
  { value: 'linear', label: 'Linear' },
  { value: 'sin', label: 'Sin' },
  { value: 'steps', label: 'Steps' },
]

const FLOAT_FUNCTION_KIND_PARAMS: Record<FloatFunctionKind, FloatFunctionParamDef[]> = {
  const_value: [{ key: 'value', label: 'Value', type: 'number', default: 1, min: 0, max: 2, step: 0.01 }],
  linear: [
    { key: 'start', label: 'Start', type: 'number', default: 0, min: 0, max: 2, step: 0.01 },
    { key: 'end', label: 'End', type: 'number', default: 1, min: 0, max: 2, step: 0.01 },
  ],
  sin: [
    { key: 'min', label: 'Min', type: 'number', default: 0, min: 0, max: 2, step: 0.01 },
    { key: 'max', label: 'Max', type: 'number', default: 1, min: 0, max: 2, step: 0.01 },
    { key: 'phase', label: 'Phase', type: 'number', default: 0, min: 0, max: 1, step: 0.01 },
    { key: 'repeats', label: 'Repeats', type: 'number', default: 1, min: 0.25, max: 16, step: 0.25 },
  ],
  steps: [
    { key: 'num_steps', label: 'Steps', type: 'number', default: 4, min: 1, max: 32, step: 1 },
    { key: 'diff_per_step', label: 'Diff per step', type: 'number', default: 0.25, min: -2, max: 2, step: 0.01 },
    { key: 'first_step_value', label: 'First value', type: 'number', default: 0, min: 0, max: 2, step: 0.01 },
  ],
}

export type FloatFunctionValue = {
  const_value?: { value: number }
  linear?: { start: number; end: number }
  sin?: { min: number; max: number; phase: number; repeats: number }
  steps?: { num_steps: number; diff_per_step: number; first_step_value: number }
}

function defaultFloatFunction(kind: FloatFunctionKind): FloatFunctionValue {
  const params = FLOAT_FUNCTION_KIND_PARAMS[kind]
  const obj: Record<string, number> = {}
  params.forEach(p => { obj[p.key] = p.default })
  return { [kind]: obj } as FloatFunctionValue
}

function getFloatFunctionKind(f: FloatFunctionValue | undefined): FloatFunctionKind {
  if (!f) return 'const_value'
  if (f.const_value) return 'const_value'
  if (f.linear) return 'linear'
  if (f.sin) return 'sin'
  if (f.steps) return 'steps'
  return 'const_value'
}

/** Effects that have "one of" increase OR decrease: show single mode selector + one FloatFunction editor. */
const EFFECT_ONE_OF_INCREASE_DECREASE = new Set([
  'position_brightness', 'position_saturation', 'timed_brightness', 'timed_saturation',
  'snake_brightness', 'snake_saturation',
])
/** Snake effects need head/tail_length/cyclic preserved when updating increase/decrease. */
const SNAKE_EFFECT_KEYS = new Set(['snake_brightness', 'snake_hue', 'snake_saturation'])
const INCREASE_KEY = 'mult_factor_increase'
const DECREASE_KEY = 'mult_factor_decrease'

/** Visible default: decrease from 1 to 0 (linear). */
const DEFAULT_DECREASE_LINEAR: FloatFunctionValue = { linear: { start: 1, end: 0 } }
/** Visible default: head moves 0→1 over time. */
const DEFAULT_HEAD_LINEAR: FloatFunctionValue = { linear: { start: 0, end: 1 } }

/** Build default params for an effect (including FloatFunction defaults for Position/Timed/Snake). */
function getDefaultEffectParams(effectKey: string): Record<string, number | boolean | FloatFunctionValue> | undefined {
  const schema = EFFECT_PARAM_SCHEMAS[effectKey]
  if (!schema) return undefined
  const acc: Record<string, number | boolean | FloatFunctionValue> = {}
  const optionalFloatKeys = schema.filter(d => d.type === 'floatFunction' && d.optional).map(d => d.key)
  for (const def of schema) {
    if (def.type === 'floatFunction') {
      if (!def.optional) {
        // Single required float (e.g. position_hue offset_factor): use visible default
        if ((effectKey === 'position_hue' || effectKey === 'timed_hue') && def.key === 'offset_factor') {
          acc[def.key] = { const_value: { value: 0.5 } }
        } else if (SNAKE_EFFECT_KEYS.has(effectKey) && def.key === 'head') {
          acc[def.key] = DEFAULT_HEAD_LINEAR
        } else if (SNAKE_EFFECT_KEYS.has(effectKey) && def.key === 'tail_length') {
          acc[def.key] = { const_value: { value: 0.5 } }
        } else {
          acc[def.key] = defaultFloatFunction('const_value')
        }
      } else if (optionalFloatKeys.length >= 2 && def.key === optionalFloatKeys[optionalFloatKeys.length - 1]) {
        // Default only the last of the optional pair so exactly one is set; use visible default for position/timed/snake
        const useDecreaseLinear = ['position_brightness', 'position_saturation', 'timed_brightness', 'timed_saturation', 'snake_brightness', 'snake_saturation'].includes(effectKey)
        acc[def.key] = useDecreaseLinear ? DEFAULT_DECREASE_LINEAR : defaultFloatFunction('const_value')
      }
    } else if (def.default !== undefined) {
      acc[def.key] = def.default as number | boolean
    }
  }
  return Object.keys(acc).length ? acc : undefined
}

// Parameter definitions per effect
type EffectParamDef = {
  key: string
  label: string
  type: 'number' | 'boolean' | 'floatFunction'
  default?: number | boolean
  min?: number
  max?: number
  step?: number
  /** For floatFunction: at least one of increase/decrease or single offset must be set */
  optional?: boolean
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
  // Position effects: params are FloatFunctions (by position in segment)
  position_brightness: [
    { key: 'mult_factor_increase', label: 'Increase (by position)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (by position)', type: 'floatFunction', optional: true },
  ],
  position_hue: [
    { key: 'offset_factor', label: 'Offset (by position)', type: 'floatFunction' },
  ],
  position_saturation: [
    { key: 'mult_factor_increase', label: 'Increase (by position)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (by position)', type: 'floatFunction', optional: true },
  ],
  // Timed effects: params are FloatFunctions (by time)
  timed_brightness: [
    { key: 'mult_factor_increase', label: 'Increase (by time)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (by time)', type: 'floatFunction', optional: true },
  ],
  timed_hue: [
    { key: 'offset_factor', label: 'Offset (by time)', type: 'floatFunction' },
  ],
  timed_saturation: [
    { key: 'mult_factor_increase', label: 'Increase (by time)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (by time)', type: 'floatFunction', optional: true },
  ],
  // Snake effects: head/tail along segment, params by position in snake
  snake_brightness: [
    { key: 'head', label: 'Head (time)', type: 'floatFunction' },
    { key: 'tail_length', label: 'Tail length', type: 'floatFunction' },
    { key: 'cyclic', label: 'Cyclic', type: 'boolean', default: false },
    { key: 'mult_factor_increase', label: 'Increase (along snake)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (along snake)', type: 'floatFunction', optional: true },
  ],
  snake_hue: [
    { key: 'head', label: 'Head (time)', type: 'floatFunction' },
    { key: 'tail_length', label: 'Tail length', type: 'floatFunction' },
    { key: 'cyclic', label: 'Cyclic', type: 'boolean', default: false },
    { key: 'offset_factor', label: 'Offset (along snake)', type: 'floatFunction' },
  ],
  snake_saturation: [
    { key: 'head', label: 'Head (time)', type: 'floatFunction' },
    { key: 'tail_length', label: 'Tail length', type: 'floatFunction' },
    { key: 'cyclic', label: 'Cyclic', type: 'boolean', default: false },
    { key: 'mult_factor_increase', label: 'Increase (along snake)', type: 'floatFunction', optional: true },
    { key: 'mult_factor_decrease', label: 'Decrease (along snake)', type: 'floatFunction', optional: true },
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

          {/* Cycles: cycle(beatsInCycle) and cycleBeats(beatsInCycle, startBeat, endBeat) — outermost first */}
          <div className="timeframe-panel-cycles">
            <label className="timeframe-panel-label">Cycles</label>
            <div className="timeframe-panel-cycles-list">
              {(timeframe.cycles ?? []).map((entry, idx) => (
                <div key={idx} className="timeframe-panel-cycle-row">
                  <span className="timeframe-panel-cycle-type">{entry.type === 'cycle' ? 'cycle' : 'cycleBeats'}</span>
                  {entry.type === 'cycle' ? (
                    <>
                      <label className="timeframe-panel-cycle-param">
                        <span>beatsInCycle</span>
                        <input
                          type="number"
                          min={0.01}
                          step={0.25}
                          value={entry.beatsInCycle}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (!isNaN(v) && v > 0) {
                              const next = [...(timeframe.cycles ?? [])]
                              next[idx] = { ...entry, beatsInCycle: v }
                              onUpdate({ cycles: next })
                            }
                          }}
                          className="timeframe-panel-input-small"
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="timeframe-panel-cycle-param">
                        <span>beatsInCycle</span>
                        <input
                          type="number"
                          min={0.01}
                          step={0.25}
                          value={entry.beatsInCycle}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (!isNaN(v) && v > 0) {
                              const next = [...(timeframe.cycles ?? [])]
                              next[idx] = { ...entry, beatsInCycle: v }
                              onUpdate({ cycles: next })
                            }
                          }}
                          className="timeframe-panel-input-small"
                        />
                      </label>
                      <label className="timeframe-panel-cycle-param">
                        <span>startBeat</span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={entry.startBeat}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (!isNaN(v)) {
                              const next = [...(timeframe.cycles ?? [])]
                              next[idx] = { ...entry, startBeat: v }
                              onUpdate({ cycles: next })
                            }
                          }}
                          className="timeframe-panel-input-small"
                        />
                      </label>
                      <label className="timeframe-panel-cycle-param">
                        <span>endBeat</span>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={entry.endBeat}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value)
                            if (!isNaN(v)) {
                              const next = [...(timeframe.cycles ?? [])]
                              next[idx] = { ...entry, endBeat: v }
                              onUpdate({ cycles: next })
                            }
                          }}
                          className="timeframe-panel-input-small"
                        />
                      </label>
                    </>
                  )}
                  <button
                    type="button"
                    className="timeframe-panel-cycle-remove"
                    onClick={() => {
                      const next = (timeframe.cycles ?? []).filter((_, i) => i !== idx)
                      onUpdate({ cycles: next.length ? next : undefined })
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="timeframe-panel-cycles-actions">
              <button
                type="button"
                className="timeframe-panel-cycle-add"
                onClick={() => {
                  const next = [...(timeframe.cycles ?? []), { type: 'cycle', beatsInCycle: 1 } as TimeframeCycleEntry]
                  onUpdate({ cycles: next })
                }}
              >
                + cycle
              </button>
              <button
                type="button"
                className="timeframe-panel-cycle-add"
                onClick={() => {
                  const next = [...(timeframe.cycles ?? []), { type: 'cycleBeats', beatsInCycle: 1, startBeat: 0, endBeat: 0.5 } as TimeframeCycleBeats]
                  onUpdate({ cycles: next })
                }}
              >
                + cycleBeats
              </button>
            </div>
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

        <div className="timeframe-panel-section timeframe-panel-effects-section">
          <label className="timeframe-panel-label">Effects</label>
          {(() => {
            const effects = getTimeframeEffects(timeframe)
            const displayList: TimeframeEffectEntry[] = effects.length > 0
              ? effects
              : [{ id: 'placeholder', effectKey: '', params: undefined }]
            const genId = () => `eff-${Date.now()}-${Math.random().toString(36).slice(2)}`

            const setEffects = (next: TimeframeEffectEntry[]) => {
              const toSave = next.filter(e => e.effectKey !== '')
              onUpdate({ effects: toSave.length > 0 ? toSave : undefined })
            }

            return (
              <>
                <div className="timeframe-panel-effects-list">
                  {displayList.map((entry, idx) => (
                    <div key={entry.id} className="timeframe-panel-effect-row">
                      <div className="timeframe-panel-effect-row-head">
                        <select
                        value={entry.effectKey}
                        onChange={(e) => {
                          const value = e.target.value
                          if (entry.id === 'placeholder') {
                            if (value) {
                              const params = getDefaultEffectParams(value) as Record<string, number | boolean> | undefined
                              setEffects([{ id: genId(), effectKey: value, params }])
                            }
                            return
                          }
                          if (!value) {
                            setEffects(effects.filter((_, i) => i !== idx))
                            return
                          }
                          const params = getDefaultEffectParams(value) as Record<string, number | boolean> | undefined
                          const next = effects.map((e, i) => i === idx ? { ...e, effectKey: value, params } : e)
                          setEffects(next)
                        }}
                        className="timeframe-panel-select"
                      >
                        <option value="">(none)</option>
                        {(['Position', 'Timed', 'Snake', 'Brightness', 'Hue', 'Motion'] as const).map(cat => (
                          <optgroup key={cat} label={cat}>
                            {ALL_EFFECT_OPTIONS.filter(o => o.category === cat).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                        ))}
                        </select>
                        {entry.id !== 'placeholder' && (
                          <button
                            type="button"
                            className="timeframe-panel-effect-remove"
                            onClick={() => setEffects(effects.filter((_, i) => i !== idx))}
                            title="Remove effect"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {entry.effectKey && EFFECT_PARAM_SCHEMAS[entry.effectKey] && (
                        <div className="timeframe-panel-effect-params">
                          {EFFECT_ONE_OF_INCREASE_DECREASE.has(entry.effectKey) ? (
                            (() => {
                              const isSnake = SNAKE_EFFECT_KEYS.has(entry.effectKey)
                              const currentKey = entry.params?.[INCREASE_KEY] != null ? INCREASE_KEY : DECREASE_KEY
                              const fVal = (entry.params?.[currentKey] as FloatFunctionValue | undefined)
                              const kind = getFloatFunctionKind(fVal)
                              const kindParams = FLOAT_FUNCTION_KIND_PARAMS[kind]
                              const currentObj = fVal?.[kind] ?? kindParams.reduce((a, p) => ({ ...a, [p.key]: p.default }), {} as Record<string, number>)
                              const mergeParams = (update: Record<string, unknown>) =>
                                isSnake ? { ...(entry.params || {}), ...update } : update
                              return (
                                <>
                                  {isSnake && (() => {
                                    const headVal = (entry.params?.head as FloatFunctionValue | undefined)
                                    const tailVal = (entry.params?.tail_length as FloatFunctionValue | undefined)
                                    const headKind = getFloatFunctionKind(headVal)
                                    const tailKind = getFloatFunctionKind(tailVal)
                                    const headParams = FLOAT_FUNCTION_KIND_PARAMS[headKind]
                                    const tailParams = FLOAT_FUNCTION_KIND_PARAMS[tailKind]
                                    const headObj = headVal?.[headKind] ?? headParams.reduce((a, p) => ({ ...a, [p.key]: p.default }), {} as Record<string, number>)
                                    const tailObj = tailVal?.[tailKind] ?? tailParams.reduce((a, p) => ({ ...a, [p.key]: p.default }), {} as Record<string, number>)
                                    return (
                                      <>
                                        <div className="timeframe-panel-float-function-block">
                                          <div className="timeframe-panel-effect-param-row">
                                            <label className="timeframe-panel-effect-param-label">Head (time)</label>
                                            <select
                                              value={headKind}
                                              onChange={(e) => {
                                                const newKind = e.target.value as FloatFunctionKind
                                                const nextParams = mergeParams({ head: defaultFloatFunction(newKind) }) as Record<string, number | boolean | FloatFunctionValue>
                                                if (entry.id === 'placeholder') return
                                                const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                                setEffects(next)
                                              }}
                                              className="timeframe-panel-select timeframe-panel-select-small"
                                            >
                                              {FLOAT_FUNCTION_KINDS.map(k => (
                                                <option key={k.value} value={k.value}>{k.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          {headParams.map(pDef => (
                                            <div key={pDef.key} className="timeframe-panel-effect-param-row timeframe-panel-effect-param-row-indent">
                                              <label className="timeframe-panel-effect-param-label">{pDef.label}</label>
                                              <input
                                                type="number"
                                                value={typeof headObj[pDef.key] === 'number' ? headObj[pDef.key] : pDef.default}
                                                min={pDef.min}
                                                max={pDef.max}
                                                step={pDef.step}
                                                onChange={(e) => {
                                                  const num = parseFloat(e.target.value)
                                                  if (isNaN(num)) return
                                                  const nextInner = { ...headObj, [pDef.key]: num }
                                                  const nextParams = mergeParams({ head: { [headKind]: nextInner } }) as Record<string, number | boolean | FloatFunctionValue>
                                                  if (entry.id === 'placeholder') return
                                                  const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                                  setEffects(next)
                                                }}
                                                className="timeframe-panel-effect-param-input"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <div className="timeframe-panel-float-function-block">
                                          <div className="timeframe-panel-effect-param-row">
                                            <label className="timeframe-panel-effect-param-label">Tail length</label>
                                            <select
                                              value={tailKind}
                                              onChange={(e) => {
                                                const newKind = e.target.value as FloatFunctionKind
                                                const nextParams = mergeParams({ tail_length: defaultFloatFunction(newKind) }) as Record<string, number | boolean | FloatFunctionValue>
                                                if (entry.id === 'placeholder') return
                                                const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                                setEffects(next)
                                              }}
                                              className="timeframe-panel-select timeframe-panel-select-small"
                                            >
                                              {FLOAT_FUNCTION_KINDS.map(k => (
                                                <option key={k.value} value={k.value}>{k.label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          {tailParams.map(pDef => (
                                            <div key={pDef.key} className="timeframe-panel-effect-param-row timeframe-panel-effect-param-row-indent">
                                              <label className="timeframe-panel-effect-param-label">{pDef.label}</label>
                                              <input
                                                type="number"
                                                value={typeof tailObj[pDef.key] === 'number' ? tailObj[pDef.key] : pDef.default}
                                                min={pDef.min}
                                                max={pDef.max}
                                                step={pDef.step}
                                                onChange={(e) => {
                                                  const num = parseFloat(e.target.value)
                                                  if (isNaN(num)) return
                                                  const nextInner = { ...tailObj, [pDef.key]: num }
                                                  const nextParams = mergeParams({ tail_length: { [tailKind]: nextInner } }) as Record<string, number | boolean | FloatFunctionValue>
                                                  if (entry.id === 'placeholder') return
                                                  const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                                  setEffects(next)
                                                }}
                                                className="timeframe-panel-effect-param-input"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                        <div className="timeframe-panel-effect-param-row">
                                          <label className="timeframe-panel-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={entry.params?.cyclic === true}
                                              onChange={(e) => {
                                                const nextParams = mergeParams({ cyclic: e.target.checked }) as Record<string, number | boolean | FloatFunctionValue>
                                                if (entry.id === 'placeholder') return
                                                const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                                setEffects(next)
                                              }}
                                              className="timeframe-panel-checkbox"
                                            />
                                            <span>Cyclic</span>
                                          </label>
                                        </div>
                                      </>
                                    )
                                  })()}
                                  <div className="timeframe-panel-effect-param-row">
                                    <label className="timeframe-panel-effect-param-label">Apply</label>
                                    <select
                                      value={currentKey}
                                      onChange={(e) => {
                                        const newKey = e.target.value as typeof INCREASE_KEY | typeof DECREASE_KEY
                                        const valueToKeep = entry.params?.[currentKey] as FloatFunctionValue | undefined
                                        let nextParams: Record<string, number | boolean | FloatFunctionValue>
                                        if (isSnake) {
                                          nextParams = { ...(entry.params || {}), [newKey]: valueToKeep ?? defaultFloatFunction('const_value') }
                                          delete nextParams[currentKey === INCREASE_KEY ? DECREASE_KEY : INCREASE_KEY]
                                        } else {
                                          nextParams = { [newKey]: valueToKeep ?? defaultFloatFunction('const_value') }
                                        }
                                        if (entry.id === 'placeholder') return
                                        const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                        setEffects(next)
                                      }}
                                      className="timeframe-panel-select timeframe-panel-select-small"
                                    >
                                      <option value={DECREASE_KEY}>Decrease</option>
                                      <option value={INCREASE_KEY}>Increase</option>
                                    </select>
                                  </div>
                                  <div className="timeframe-panel-float-function-block">
                                    <div className="timeframe-panel-effect-param-row">
                                      <label className="timeframe-panel-effect-param-label">Function</label>
                                      <select
                                        value={kind}
                                        onChange={(e) => {
                                          const newKind = e.target.value as FloatFunctionKind
                                          const nextF = defaultFloatFunction(newKind)
                                          const nextParams = mergeParams({ [currentKey]: nextF }) as Record<string, number | boolean | FloatFunctionValue>
                                          if (entry.id === 'placeholder') return
                                          const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                          setEffects(next)
                                        }}
                                        className="timeframe-panel-select timeframe-panel-select-small"
                                      >
                                        {FLOAT_FUNCTION_KINDS.map(k => (
                                          <option key={k.value} value={k.value}>{k.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    {kindParams.map(pDef => {
                                      const pVal = typeof currentObj[pDef.key] === 'number' ? currentObj[pDef.key] : pDef.default
                                      return (
                                        <div key={pDef.key} className="timeframe-panel-effect-param-row timeframe-panel-effect-param-row-indent">
                                          <label className="timeframe-panel-effect-param-label">{pDef.label}</label>
                                          <input
                                            type="number"
                                            value={pVal}
                                            min={pDef.min}
                                            max={pDef.max}
                                            step={pDef.step}
                                            onChange={(e) => {
                                              const num = parseFloat(e.target.value)
                                              if (isNaN(num)) return
                                              const nextInner = { ...currentObj, [pDef.key]: num }
                                              const nextF = { [kind]: nextInner } as FloatFunctionValue
                                              const nextParams = mergeParams({ [currentKey]: nextF }) as Record<string, number | boolean | FloatFunctionValue>
                                              if (entry.id === 'placeholder') return
                                              const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                              setEffects(next)
                                            }}
                                            className="timeframe-panel-effect-param-input"
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                </>
                              )
                            })()
                          ) : (
                            EFFECT_PARAM_SCHEMAS[entry.effectKey].map(def => {
                              if (def.type === 'floatFunction') {
                                const fVal = (entry.params?.[def.key] as FloatFunctionValue | undefined)
                                const kind = getFloatFunctionKind(fVal)
                                const kindParams = FLOAT_FUNCTION_KIND_PARAMS[kind]
                                const currentObj = fVal?.[kind] ?? kindParams.reduce((a, p) => ({ ...a, [p.key]: p.default }), {} as Record<string, number>)
                                return (
                                  <div key={def.key} className="timeframe-panel-float-function-block">
                                    <div className="timeframe-panel-effect-param-row">
                                      <label className="timeframe-panel-effect-param-label">{def.label}</label>
                                      <select
                                        value={kind}
                                        onChange={(e) => {
                                          const newKind = e.target.value as FloatFunctionKind
                                          const nextF = defaultFloatFunction(newKind)
                                          const nextParams = { ...entry.params, [def.key]: nextF }
                                          if (entry.id === 'placeholder') return
                                          const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                          setEffects(next)
                                        }}
                                        className="timeframe-panel-select timeframe-panel-select-small"
                                      >
                                        {FLOAT_FUNCTION_KINDS.map(k => (
                                          <option key={k.value} value={k.value}>{k.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    {kindParams.map(pDef => {
                                      const pVal = typeof currentObj[pDef.key] === 'number' ? currentObj[pDef.key] : pDef.default
                                      return (
                                        <div key={pDef.key} className="timeframe-panel-effect-param-row timeframe-panel-effect-param-row-indent">
                                          <label className="timeframe-panel-effect-param-label">{pDef.label}</label>
                                          <input
                                            type="number"
                                            value={pVal}
                                            min={pDef.min}
                                            max={pDef.max}
                                            step={pDef.step}
                                            onChange={(e) => {
                                              const num = parseFloat(e.target.value)
                                              if (isNaN(num)) return
                                              const nextInner = { ...currentObj, [pDef.key]: num }
                                              const nextF = { [kind]: nextInner } as FloatFunctionValue
                                              const nextParams = { ...entry.params, [def.key]: nextF }
                                              if (entry.id === 'placeholder') return
                                              const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                              setEffects(next)
                                            }}
                                            className="timeframe-panel-effect-param-input"
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              }
                              const current = entry.params?.[def.key]
                              const value = current !== undefined ? current : def.default
                              return (
                                <div key={def.key} className="timeframe-panel-effect-param-row">
                                  <label className="timeframe-panel-effect-param-label">{def.label}</label>
                                  {def.type === 'boolean' ? (
                                    <input
                                      type="checkbox"
                                      checked={value === true}
                                      onChange={(e) => {
                                        const nextParams = { ...entry.params, [def.key]: e.target.checked }
                                        if (entry.id === 'placeholder') return
                                        const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                        setEffects(next)
                                      }}
                                      className="timeframe-panel-effect-param-checkbox"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      value={typeof value === 'number' ? value : (typeof def.default === 'number' ? def.default : 0)}
                                      min={def.min}
                                      max={def.max}
                                      step={def.step}
                                      onChange={(e) => {
                                        const num = parseFloat(e.target.value)
                                        if (isNaN(num)) return
                                        const nextParams = { ...entry.params, [def.key]: num }
                                        if (entry.id === 'placeholder') return
                                        const next = effects.map((ex, i) => i === idx ? { ...ex, params: nextParams } : ex)
                                        setEffects(next)
                                      }}
                                      className="timeframe-panel-effect-param-input"
                                    />
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {effects.length > 0 && (
                  <button
                    type="button"
                    className="timeframe-panel-effect-add"
                    onClick={() => {
                      onUpdate({
                        effects: [...effects, { id: genId(), effectKey: '', params: undefined }],
                      })
                    }}
                  >
                    + Add effect
                  </button>
                )}
              </>
            )
          })()}
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
