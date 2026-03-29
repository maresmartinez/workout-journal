import { useState } from 'react'
import type { Exercise } from '../types'

interface ExercisePickerModalProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSelect: (exerciseId: number) => void
}

export default function ExercisePickerModal({ open, onClose, exercises, onSelect }: ExercisePickerModalProps) {
  const [search, setSearch] = useState('')

  if (!open) return null

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Add Exercise</h2>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No exercises found</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex.id)
                onClose()
              }}
              className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
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
        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full rounded border border-gray-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
