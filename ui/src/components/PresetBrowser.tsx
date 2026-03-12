import { useState, useMemo } from 'react'
import { loadAllPresets, extractPresetColors, summarizePresetEffects } from '../presets'
import type { PresetMetadata } from '../presets'
import './PresetBrowser.css'

interface PresetBrowserProps {
  onApplyPreset: (preset: PresetMetadata) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  background: 'Background',
  chill: 'Chill',
  mystery: 'Mystery',
  party: 'Party',
  psychedelic: 'Psychedelic',
}

const CATEGORY_ORDER = ['background', 'chill', 'mystery', 'party', 'psychedelic']

const PresetCard = ({ preset, onApply }: { preset: PresetMetadata; onApply: (p: PresetMetadata) => void }) => {
  const colors = useMemo(() => extractPresetColors(preset.data), [preset.data])
  const summary = useMemo(() => summarizePresetEffects(preset.data), [preset.data])

  return (
    <div className="preset-card" onClick={() => onApply(preset)}>
      <div className="preset-card-colors">
        {colors.slice(0, 3).map((c, i) => (
          <div key={i} className="preset-card-color-swatch" style={{ background: c }} />
        ))}
      </div>
      <div className="preset-card-info">
        <span className="preset-card-name">{preset.displayName}</span>
        {summary && <span className="preset-card-effects">{summary}</span>}
      </div>
    </div>
  )
}

const PresetBrowser = ({ onApplyPreset }: PresetBrowserProps) => {
  const allPresets = useMemo(() => loadAllPresets(), [])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const groupedPresets = useMemo(() => {
    const groups: Record<string, PresetMetadata[]> = {}
    for (const p of allPresets) {
      if (searchTerm && !p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) && !p.category.toLowerCase().includes(searchTerm.toLowerCase())) continue
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    }
    return groups
  }, [allPresets, searchTerm])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="preset-browser">
      <div className="preset-browser-header">
        <h2>Presets</h2>
      </div>
      <div className="preset-browser-search">
        <input
          type="text"
          placeholder="Search presets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="preset-browser-search-input"
        />
      </div>
      <div className="preset-browser-categories">
        {CATEGORY_ORDER.map(cat => {
          const presets = groupedPresets[cat]
          if (!presets || presets.length === 0) return null
          const isExpanded = expandedCategories.has(cat) || !!searchTerm
          return (
            <div key={cat} className="preset-browser-category">
              <button
                className={`preset-browser-category-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCategory(cat)}
              >
                <span className="preset-browser-category-arrow">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                <span className="preset-browser-category-name">{CATEGORY_LABELS[cat] || cat}</span>
                <span className="preset-browser-category-count">{presets.length}</span>
              </button>
              {isExpanded && (
                <div className="preset-browser-preset-list">
                  {presets.map(preset => (
                    <PresetCard key={preset.id} preset={preset} onApply={onApplyPreset} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PresetBrowser
