import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Exercise } from '../types'

interface SortableExerciseRowProps {
  exercise: Exercise
  onRemove: (id: number) => void
}

export default function SortableExerciseRow({ exercise, onRemove }: SortableExerciseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        isDragging
          ? 'border-blue-400 bg-white shadow-lg opacity-90'
          : 'border-gray-200 bg-white'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 active:cursor-grabbing select-none"
      >
        ⋮⋮
      </button>

      <span className="flex-1 text-sm font-medium">{exercise.name}</span>

      <button
        onClick={() => onRemove(exercise.id)}
        className="text-red-400 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  )
}
