import type { WorkoutTemplate } from '../types'

interface StartWorkoutModalProps {
  open: boolean
  onClose: () => void
  templates: WorkoutTemplate[]
  onSelectTemplate: (templateId: number) => void
  onSelectBlank: () => void
  isPending: boolean
}

export default function StartWorkoutModal({ open, onClose, templates, onSelectTemplate, onSelectBlank, isPending }: StartWorkoutModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Start Workout</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a template or start blank</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={onSelectBlank}
            disabled={isPending}
            className="w-full border-b border-gray-200 px-4 py-3 text-left hover:bg-blue-50 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-600">Blank Workout</span>
              <span className="text-xs text-gray-400">Start from scratch</span>
            </div>
          </button>
          {templates.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No templates yet</p>
          )}
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              disabled={isPending}
              className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <span className="text-xs text-gray-400">
                  {t.workout_template_exercises.length} exercise{t.workout_template_exercises.length !== 1 ? 's' : ''}
                </span>
              </div>
              {t.description && (
                <p className="mt-0.5 text-xs text-gray-400">{t.description}</p>
              )}
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
