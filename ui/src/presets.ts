/**
 * Preset loading, color extraction, and reverse-mapping from renderer format
 * to editable UI Timeframes.
 */

import type { Timeframe } from './App'
import {
  hsvToHex,
  extractPresetColor,
  extractPresetColors,
  summarizePresetEffects,
  presetToTimeframes as sharedPresetToTimeframes,
  type PresetData,
  type ConvertedTimeframe,
} from '../../shared/preset-conversion'

// Re-export shared utilities so existing imports from other UI files keep working
export { hsvToHex, extractPresetColor, extractPresetColors, summarizePresetEffects }
export type { PresetData }

// ── Types ──────────────────────────────────────────────────────────────────

export interface PresetMetadata {
  id: string            // "category/filename" e.g. "party/3uy8"
  category: string
  displayName: string   // filename without extension, underscores → spaces
  data: PresetData
}

// ── Load all presets via Vite glob ──────────────────────────────────────────

const presetModules = import.meta.glob('../../presets/**/*.json', { eager: true }) as Record<string, { default?: PresetData } & PresetData>

let _cachedPresets: PresetMetadata[] | null = null

export function loadAllPresets(): PresetMetadata[] {
  if (_cachedPresets) return _cachedPresets
  const presets: PresetMetadata[] = []
  for (const [path, mod] of Object.entries(presetModules)) {
    const parts = path.split('/')
    const category = parts[parts.length - 2]
    const filename = parts[parts.length - 1].replace('.json', '')
    const displayName = filename.replace(/_/g, ' ')
    const data: PresetData = (mod.default ?? mod) as PresetData
    presets.push({ id: `${category}/${filename}`, category, displayName, data })
  }
  presets.sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName))
  _cachedPresets = presets
  return presets
}

// ── Main reverse mapper ────────────────────────────────────────────────────

/**
 * Convert a preset into editable UI Timeframes.
 * Groups effects by segment → one timeframe per segment.
 */
export function presetToTimeframes(
  preset: PresetMetadata,
  insertBeat: number,
  bpm: number,
): Timeframe[] {
  const durationBeats = 16
  const converted: ConvertedTimeframe[] = sharedPresetToTimeframes({
    data: preset.data,
    displayName: preset.displayName,
    insertBeat,
    durationBeats,
    bpm,
    generateId: (segIdx) => `preset-${Date.now()}-${segIdx}-${Math.random().toString(36).slice(2, 6)}`,
    generateEffectId: (_segIdx, _effectIdx) => `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  })
  // ConvertedTimeframe is structurally compatible with Timeframe
  return converted as Timeframe[]
}
