import { useParams, useNavigate } from 'react-router-dom'
import { useExercise, useDeleteExercise } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exerciseId = Number(id)
  const { data: exercise, isLoading, error } = useExercise(exerciseId)
  const deleteExercise = useDeleteExercise()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!exercise) return <ErrorMessage message="Exercise not found" />

  function handleDelete() {
    if (!confirm('Delete this exercise?')) return
    deleteExercise.mutate(exerciseId, {
      onSuccess: () => navigate('/exercises'),
    })
  }

  return (
    <div>
      <PageHeader
        title={exercise.name}
        subtitle={exercise.exercise_type === 'built_in' ? 'Built-in' : 'Custom'}
        action={
          exercise.exercise_type === 'custom' ? (
            <button onClick={handleDelete} className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Delete
            </button>
          ) : undefined
        }
      />

      <div className="px-6 pb-6">
        {exercise.description && (
          <p className="mb-4 text-sm text-gray-600">{exercise.description}</p>
        )}

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Metrics
          </div>
          {exercise.exercise_metrics.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No metrics defined</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Unit</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Required</th>
                </tr>
              </thead>
              <tbody>
                {exercise.exercise_metrics.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2 text-gray-500">{m.metric_type}</td>
                    <td className="px-4 py-2 text-gray-500">{m.unit || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{m.required ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
