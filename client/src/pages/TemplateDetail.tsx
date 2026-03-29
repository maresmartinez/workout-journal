import { useParams, useNavigate } from 'react-router-dom'
import { useTemplate } from '../hooks/useTemplates'
import { useCreateSession } from '../hooks/useSessions'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const templateId = Number(id)
  const { data: template, isLoading, error } = useTemplate(templateId)
  const createSession = useCreateSession()

  async function handleStartFromTemplate() {
    const session = await createSession.mutateAsync({
      name: template!.name,
      started_at: new Date().toISOString(),
    })
    navigate(`/workout/${session.id}`)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!template) return <ErrorMessage message="Template not found" />

  const exercises = template.workout_template_exercises
    .slice()
    .sort((a, b) => a.position - b.position)

  return (
    <div>
      <PageHeader
        title={template.name}
        subtitle={template.description || undefined}
        action={
          <button
            onClick={handleStartFromTemplate}
            disabled={createSession.isPending}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Start Workout
          </button>
        }
      />

      <div className="px-6 pb-6">
        <div className="space-y-2">
          {exercises.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No exercises in this template.</p>
          )}
          {exercises.map((wte, i) => (
            <div
              key={wte.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">{i + 1}.</span>
                  <span className="ml-2 font-medium">
                    {wte.exercise?.name || `Exercise #${wte.exercise_id}`}
                  </span>
                </div>
                {wte.notes && (
                  <span className="text-xs text-gray-400">{wte.notes}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
