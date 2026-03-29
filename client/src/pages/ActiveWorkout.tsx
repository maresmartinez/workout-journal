import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession, useUpdateSession, useAddSessionExercise, useRemoveSessionExercise, useCreateLog, useUpdateLog, useDeleteLog } from '../hooks/useSessions'
import { useExercises } from '../hooks/useExercises'
import { useTimer } from '../hooks/useTimer'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import SessionExerciseCard from '../components/SessionExerciseCard'
import ExercisePickerModal from '../components/ExercisePickerModal'

export default function ActiveWorkout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sessionId = Number(id)
  const { data: session, isLoading, error } = useSession(sessionId)
  const { data: exercises } = useExercises()
  const updateSession = useUpdateSession()
  const addSessionExercise = useAddSessionExercise()
  const removeSessionExercise = useRemoveSessionExercise()
  const createLog = useCreateLog()
  const updateLog = useUpdateLog()
  const deleteLog = useDeleteLog()
  const [pickerOpen, setPickerOpen] = useState(false)

  const timer = useTimer(session?.started_at)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!session) return <ErrorMessage message="Session not found" />

  if (session.status !== 'in_progress') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">This workout is {session.status}.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    )
  }

  const sessionExercises = (session.session_exercises || []).slice().sort((a, b) => a.position - b.position)

  function handleAddExercise(exerciseId: number) {
    const position = sessionExercises.length + 1
    addSessionExercise.mutate({
      sessionId,
      data: { exercise_id: exerciseId, position },
    })
  }

  function handleFinish() {
    updateSession.mutate({
      id: sessionId,
      data: { status: 'completed', ended_at: new Date().toISOString() },
    }, {
      onSuccess: () => navigate(`/history/${sessionId}`),
    })
  }

  function handleCancel() {
    if (!confirm('Abandon this workout?')) return
    updateSession.mutate({
      id: sessionId,
      data: { status: 'abandoned' },
    }, {
      onSuccess: () => navigate('/'),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">{session.name || 'Active Workout'}</h1>
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
        {sessionExercises.map((se) => {
          const exercise = exercises?.find((e) => e.id === se.exercise_id)
          return (
            <SessionExerciseCard
              key={se.id}
              sessionExercise={se}
              exercise={exercise}
              sessionId={sessionId}
              onCreateLog={(seId, values) =>
                createLog.mutate({ sessionId, seId, data: { values } })
              }
              onUpdateLog={(seId, logId, values) =>
                updateLog.mutate({ sessionId, seId, logId, data: { values } })
              }
              onDeleteLog={(seId, logId) =>
                deleteLog.mutate({ sessionId, seId, logId })
              }
              onRemove={(seId) => removeSessionExercise.mutate({ sessionId, seId })}
              isCreatingLog={createLog.isPending}
            />
          )
        })}

        {sessionExercises.length === 0 && (
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
            disabled={updateSession.isPending}
            className="flex-1 rounded-md bg-green-600 py-3 text-base font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Finish Workout
          </button>
          <button
            onClick={handleCancel}
            className="rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            Cancel
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
