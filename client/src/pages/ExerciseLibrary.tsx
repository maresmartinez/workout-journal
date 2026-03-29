import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises, useCreateExercise, useDeleteExercise } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ExerciseFormModal from '../components/ExerciseFormModal'

export default function ExerciseLibrary() {
  const navigate = useNavigate()
  const { data: exercises, isLoading, error } = useExercises()
  const createExercise = useCreateExercise()
  const deleteExercise = useDeleteExercise()
  const [modalOpen, setModalOpen] = useState(false)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const builtIn = (exercises || []).filter((e) => e.exercise_type === 'built_in')
  const custom = (exercises || []).filter((e) => e.exercise_type === 'custom')

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle={`${builtIn.length} built-in · ${custom.length} custom`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New Exercise
          </button>
        }
      />

      <div className="px-6 pb-6">
        {builtIn.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Built-In</h2>
            <div className="space-y-2">
              {builtIn.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/exercises/${ex.id}`)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-gray-400">
                      {ex.exercise_metrics.map((m) => m.name).join(', ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {custom.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Custom</h2>
            <div className="space-y-2">
              {custom.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/exercises/${ex.id}`)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ex.name}</span>
                      <span className="text-xs text-gray-400">
                        {ex.exercise_metrics.map((m) => m.name).join(', ')}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteExercise.mutate(ex.id)}
                    className="rounded border border-gray-200 px-2 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ExerciseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createExercise.mutate(data, {
            onSuccess: () => setModalOpen(false),
          })
        }}
        isPending={createExercise.isPending}
      />
    </div>
  )
}
