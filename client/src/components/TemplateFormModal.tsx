import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Exercise } from '../types'
import SortableExerciseRow from './SortableExerciseRow'
import ExerciseSearchRow from './ExerciseSearchRow'

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
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [isAdding, setIsAdding] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!open) return null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSelectedExercises((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id)
      const newIndex = prev.findIndex((e) => e.id === over.id)
      const updated = [...prev]
      const [moved] = updated.splice(oldIndex, 1)
      updated.splice(newIndex, 0, moved)
      return updated
    })
  }

  function handleSelectExercise(exercise: Exercise) {
    setSelectedExercises((prev) => [...prev, exercise])
    setIsAdding(false)
  }

  function handleRemoveExercise(id: number) {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      workout_template_exercises_attributes: selectedExercises.map((exercise, index) => ({
        exercise_id: exercise.id,
        position: index + 1,
        notes: '',
      })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className="mt-2 space-y-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedExercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  {selectedExercises.map((exercise) => (
                    <SortableExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      onRemove={handleRemoveExercise}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {isAdding && (
                <ExerciseSearchRow
                  exercises={exercises}
                  existingIds={selectedExercises.map((e) => e.id)}
                  onSelect={handleSelectExercise}
                  onCancel={() => setIsAdding(false)}
                />
              )}

              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
                >
                  + Add Exercise
                </button>
              )}
            </div>
          </div>

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
