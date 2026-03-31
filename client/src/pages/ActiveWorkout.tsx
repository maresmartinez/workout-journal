import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutDraft } from '../hooks/useWorkoutDraft'
import { useNavigationGuard } from '../hooks/useNavigationGuard'
import { useCreateSessionBatch } from '../hooks/useSessions'
import { useExercises } from '../hooks/useExercises'
import { useTimer } from '../hooks/useTimer'
import ErrorMessage from '../components/ErrorMessage'
import DraftExerciseCard from '../components/DraftExerciseCard'
import ExercisePickerModal from '../components/ExercisePickerModal'

export default function ActiveWorkout() {
  const navigate = useNavigate()
  const { draft, addExercise, removeExercise, addLog, updateLog, removeLog, clearDraft, toBatchPayload } = useWorkoutDraft()
  const { data: exercises } = useExercises()
  const createBatch = useCreateSessionBatch()
  const [pickerOpen, setPickerOpen] = useState(false)

  const timer = useTimer(draft?.startedAt)

  useNavigationGuard(!!draft)

  if (!draft) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No active workout.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    )
  }

  function handleAddExercise(exerciseId: number) {
    const exercise = exercises?.find((e) => e.id === exerciseId)
    if (exercise) addExercise(exercise)
  }

  function handleFinish() {
    const payload = toBatchPayload()
    if (!payload) return
    createBatch.mutate(payload, {
      onSuccess: (session) => {
        clearDraft()
        navigate(`/history/${session.id}`)
      },
    })
  }

  function handleDiscard() {
    if (!confirm('Discard this workout? All data will be lost.')) return
    clearDraft()
    navigate('/')
  }

  return (
    <div>
      {createBatch.isError && (
        <div className="bg-red-50 px-6 py-2 text-sm text-red-600">
          Failed to save workout: {createBatch.error.message}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">{draft.name || 'Active Workout'}</h1>
          <span className="text-sm text-gray-500">{timer.display} elapsed</span>
        </div>
        <button
          onClick={() => setPickerOpen(true)}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm text-blue-600 hover:bg-gray-200"
        >
          + Add Exercise
        </button>
      </div>

      <div className="space-y-3 p-6">
        {draft.exercises.map((de, index) => (
          <DraftExerciseCard
            key={de.exerciseId + '-' + de.position}
            draftExercise={de}
            exerciseIndex={index}
            onAddLog={addLog}
            onUpdateLog={updateLog}
            onRemoveLog={removeLog}
            onRemove={() => removeExercise(index)}
          />
        ))}

        {draft.exercises.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p>No exercises yet.</p>
            <button onClick={() => setPickerOpen(true)} className="mt-2 text-blue-600 hover:underline">
              Add an exercise to get started
            </button>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleFinish}
            disabled={draft.exercises.length === 0 || createBatch.isPending}
            className="flex-1 rounded-md bg-green-600 py-3 text-base font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Finish Workout
          </button>
          <button
            onClick={handleDiscard}
            className="rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            Discard
          </button>
        </div>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={exercises || []}
        onSelect={handleAddExercise}
      />
    </div>
  )
}
