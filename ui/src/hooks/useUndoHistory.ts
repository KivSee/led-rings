import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50

export interface UndoHistoryResult<T> {
  value: T
  setValue: React.Dispatch<React.SetStateAction<T>>
  /** Update value without pushing to undo stack (use for intermediate drag updates). */
  setValueSilent: React.Dispatch<React.SetStateAction<T>>
  /** Snapshot the current value onto the undo stack without changing it.
   *  Call this once at the start of a drag/resize to mark the "before" state. */
  checkpoint: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

/**
 * Wraps a state value with undo/redo history.
 * - setValue: pushes current state onto undo stack, then updates.
 * - setValueSilent: updates without touching undo stack (for real-time drag).
 * - checkpoint: saves current state to undo stack without changing it
 *   (call once at drag start, then use setValueSilent during drag).
 */
export function useUndoHistory<T>(initialValue: T): UndoHistoryResult<T> {
  const [value, setValueRaw] = useState<T>(initialValue)
  const undoStack = useRef<T[]>([])
  const redoStack = useRef<T[]>([])

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((action) => {
    setValueRaw(prev => {
      const next = typeof action === 'function' ? (action as (prev: T) => T)(prev) : action
      undoStack.current.push(prev)
      if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
      redoStack.current = []
      return next
    })
  }, [])

  const setValueSilent: React.Dispatch<React.SetStateAction<T>> = useCallback((action) => {
    setValueRaw(prev => {
      const next = typeof action === 'function' ? (action as (prev: T) => T)(prev) : action
      return next
    })
  }, [])

  const checkpoint = useCallback(() => {
    setValueRaw(prev => {
      undoStack.current.push(prev)
      if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
      redoStack.current = []
      return prev  // value unchanged
    })
  }, [])

  const undo = useCallback(() => {
    setValueRaw(prev => {
      if (undoStack.current.length === 0) return prev
      redoStack.current.push(prev)
      return undoStack.current.pop()!
    })
  }, [])

  const redo = useCallback(() => {
    setValueRaw(prev => {
      if (redoStack.current.length === 0) return prev
      undoStack.current.push(prev)
      return redoStack.current.pop()!
    })
  }, [])

  const canUndo = undoStack.current.length > 0
  const canRedo = redoStack.current.length > 0

  return { value, setValue, setValueSilent, checkpoint, undo, redo, canUndo, canRedo }
}
