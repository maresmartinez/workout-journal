import { useState } from 'react'
import type { Exercise } from '../types'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSubmit: (data: {
    name: string
    description: string
    workout_template_exercises_attributes: Array<{
      exercise_id: number
      position: number
      notes: string
    }>
  }) => void
  isPending: boolean
}

export default function TemplateFormModal({ open, onClose, exercises, onSubmit, isPending }: TemplateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  if (!open) return null

  function toggleExercise(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      workout_template_exercises_attributes: selectedIds.map((exerciseId, index) => ({
        exercise_id: exerciseId,
        position: index + 1,
        notes: '',
      })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Create Workout Template</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Exercises</label>
            <p className="text-xs text-gray-400 mb-2">Select exercises in order</p>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {exercises.map((ex) => (
                <label
                  key={ex.id}
                  className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${
                    selectedIds.includes(ex.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ex.id)}
                    onChange={() => toggleExercise(ex.id)}
                    className="rounded"
                  />
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-xs text-gray-400">
                    {ex.exercise_metrics.map((m) => m.name).join(', ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="text-xs text-gray-500">
              Order: {selectedIds.map((id) => exercises.find((e) => e.id === id)?.name).join(' → ')}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
