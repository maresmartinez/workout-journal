import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises, useCreateExercise, useDeleteExercise } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ExerciseFormModal from '../components/ExerciseFormModal'

function getExerciseCategory(metrics: { name: string }[]): string {
  const names = new Set(metrics.map((m) => m.name))
  if (names.has('weight')) return 'Strength'
  if (names.has('duration') && names.has('distance')) return 'Cardio'
  if (names.has('duration')) return 'Endurance'
  if (names.has('sets') && names.has('reps')) return 'Bodyweight'
  return 'General'
}

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
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{ex.name}</span>
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {getExerciseCategory(ex.exercise_metrics)}
                        </span>
                      </div>
                      {ex.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{ex.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ex.exercise_metrics.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {m.name}{m.unit ? ` (${m.unit})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
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
                <div key={ex.id} className="flex items-start gap-2">
                  <button
                    onClick={() => navigate(`/exercises/${ex.id}`)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{ex.name}</span>
                          <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {getExerciseCategory(ex.exercise_metrics)}
                          </span>
                        </div>
                        {ex.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{ex.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ex.exercise_metrics.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {m.name}{m.unit ? ` (${m.unit})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteExercise.mutate(ex.id)}
                    className="mt-1 rounded border border-gray-200 px-2 py-1.5 text-sm text-red-500 hover:bg-red-50"
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
