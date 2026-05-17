/**
 * Generates an "All<Category>.json" UI song file from all presets in a category.
 * Each preset occupies 30 seconds (at the given BPM), allowing the user to preview
 * every preset in sequence by loading the file into the timeline UI.
 *
 * Usage:
 *   yarn gen-ui-song <category> [bpm]
 *   yarn gen-ui-song party 120
 *   yarn gen-ui-song chill 90
 */

import * as fs from 'fs'
import * as path from 'path'
import { presetToTimeframes, type PresetData, type ConvertedTimeframe } from '../shared/preset-conversion'

interface Song {
  name: string
  lengthSeconds: number
  bpm: number
  animationType?: string
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PRESET_DURATION_SECONDS = 30

const generate = (categoryName: string, bpm: number) => {
  const presetsDir = path.join(__dirname, '..', 'presets', categoryName)

  if (!fs.existsSync(presetsDir)) {
    console.error(`Preset directory not found: ${presetsDir}`)
    console.log('Available categories: party, chill, mystery, psychedelic, background')
    process.exit(1)
  }

  const files = fs.readdirSync(presetsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  if (files.length === 0) {
    console.log(`No preset files found in ${categoryName}`)
    process.exit(1)
  }

  const beatsPerPreset = (PRESET_DURATION_SECONDS * bpm) / 60
  const totalBeats = files.length * beatsPerPreset
  const totalSeconds = files.length * PRESET_DURATION_SECONDS

  const allTimeframes: ConvertedTimeframe[] = []

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(presetsDir, files[i])
    const displayName = files[i].replace('.json', '').replace(/_/g, ' ')
    const data: PresetData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const insertBeat = i * beatsPerPreset

    const tfs = presetToTimeframes({
      data,
      displayName,
      insertBeat,
      durationBeats: beatsPerPreset,
      bpm,
      generateId: (segIdx) => `gen-${displayName}-${segIdx}`,
      generateEffectId: (segIdx, effectIdx) => `gen-${segIdx}-${effectIdx}`,
    })
    allTimeframes.push(...tfs)
    console.log(`[${i + 1}/${files.length}] ${displayName}: ${tfs.length} timeframe(s) at beat ${insertBeat}`)
  }

  const categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
  const song: Song = {
    name: `All${categoryTitle}`,
    lengthSeconds: totalSeconds,
    bpm,
    animationType: 'trigger',
  }

  const payload = { song, timeframes: allTimeframes }

  const outDir = path.join(__dirname, '..', 'ui', 'public', 'category-previews')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `All${categoryTitle}.json`)
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))

  console.log(`\nGenerated ${files.length} presets (${totalBeats} beats / ${totalSeconds}s at ${bpm} BPM)`)
  console.log(`Saved to: ${outPath}`)
}

const categoryArg = process.argv[2]
const bpmArg = Number(process.argv[3]) || 120

if (!categoryArg) {
  console.log('Usage: yarn gen-ui-song <category> [bpm]')
  console.log('Example: yarn gen-ui-song party 120')
  process.exit(1)
}

generate(categoryArg, bpmArg)
