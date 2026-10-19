import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './RingSelector.css'
import { RING_GROUPS, ringGroupName, type RingGroupName } from '../../../shared/ring-groups'

interface RingSelectorProps {
  rings: number[]
  onChange: (rings: number[]) => void
}

const RingSelector = ({ rings, onChange }: RingSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Ring 12 first: it hangs nearest the top of the installation, so the grid
  // reads clockwise from the top.
  const allRings = [12, ...RING_GROUPS.all.filter(r => r !== 12)]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current && panelRef.current) {
          const buttonRect = buttonRef.current.getBoundingClientRect()
          const panelRect = panelRef.current.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          let top = buttonRect.bottom + 4
          let left = buttonRect.left
          
          // Adjust if panel would go off bottom of screen
          if (top + panelRect.height > viewportHeight) {
            top = buttonRect.top - panelRect.height - 4
          }
          
          // Adjust if panel would go off right side of screen
          if (left + panelRect.width > viewportWidth) {
            left = viewportWidth - panelRect.width - 10
          }
          
          // Adjust if panel would go off left side of screen
          if (left < 10) {
            left = 10
          }
          
          setPanelPosition({ top, left })
        } else if (buttonRef.current) {
          // Initial position before panel is rendered
          const rect = buttonRef.current.getBoundingClientRect()
          setPanelPosition({
            top: rect.bottom + 4,
            left: rect.left
          })
        }
      }
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        updatePosition()
      })
      
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isExpanded])

  const toggleRing = (ring: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (rings.includes(ring)) {
      onChange(rings.filter(r => r !== ring))
    } else {
      onChange([...rings, ring].sort((a, b) => a - b))
    }
  }

  const quickSelect = (preset: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const group = RING_GROUPS[preset as RingGroupName]
    onChange(group ? [...group] : [])
  }

  useEffect(() => {
    if (containerRef.current) {
      const timeframe = containerRef.current.closest('.timeframe')
      if (timeframe) {
        if (isExpanded) {
          timeframe.classList.add('ring-selector-open')
        } else {
          timeframe.classList.remove('ring-selector-open')
        }
      }
    }
  }, [isExpanded])

  return (
    <div className="ring-selector" ref={containerRef}>
      <button
        ref={buttonRef}
        className="ring-selector-toggle"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        title="Select rings"
      >
        Rings: {rings.length === 0 ? 'None' : ringGroupName(rings) === 'all' ? 'All' : rings.join(', ')}
        <span className={`ring-selector-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>
      {isExpanded && createPortal(
        <div 
          className="ring-selector-panel" 
          ref={panelRef}
          style={{
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`
          }}
        >
          <div className="ring-quick-select">
            <button onClick={(e) => quickSelect('all', e)}>All</button>
            <button onClick={(e) => quickSelect('even', e)}>Even</button>
            <button onClick={(e) => quickSelect('odd', e)}>Odd</button>
            <button onClick={(e) => quickSelect('left', e)}>Left</button>
            <button onClick={(e) => quickSelect('right', e)}>Right</button>
            <button onClick={(e) => quickSelect('top', e)}>Top</button>
            <button onClick={(e) => quickSelect('bottom', e)}>Bottom</button>
            <button onClick={(e) => quickSelect('b1', e)}>B1</button>
            <button onClick={(e) => quickSelect('b2', e)}>B2</button>
          </div>
          <div className="ring-grid">
            {allRings.map(ring => (
              <button
                key={ring}
                className={`ring-button ${rings.includes(ring) ? 'active' : ''}`}
                onClick={(e) => toggleRing(ring, e)}
              >
                {ring}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default RingSelector
