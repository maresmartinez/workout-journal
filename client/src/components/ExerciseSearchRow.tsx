import { useState, useRef, useEffect } from 'react'
import type { Exercise } from '../types'

interface ExerciseSearchRowProps {
  exercises: Exercise[]
  existingIds: number[]
  onSelect: (exercise: Exercise) => void
  onCancel: () => void
}

export default function ExerciseSearchRow({ exercises, existingIds, onSelect, onCancel }: ExerciseSearchRowProps) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = exercises
    .filter((e) => !existingIds.includes(e.id))
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="border-2 border-blue-400 rounded-lg p-4">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search exercises..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="mt-2 max-h-40 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-2 text-sm text-gray-400">No exercises found</p>
        )}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full border-b border-gray-100 px-3 py-2 text-left hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{ex.name}</span>
              <span className="text-xs text-gray-400">
                {ex.exercise_metrics.map((m) => m.name).join(', ')}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <button onClick={onCancel} className="w-full rounded border border-gray-300 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
