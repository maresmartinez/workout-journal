import { useParams, useNavigate } from 'react-router-dom'
import { useSession, useDeleteSession } from '../hooks/useSessions'
import { useExercises } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—'
  const start = new Date(startedAt).getTime()
  const end = new Date(endedAt).getTime()
  const minutes = Math.round((end - start) / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remain = minutes % 60
  return `${hours}h ${remain}m`
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sessionId = Number(id)
  const { data: session, isLoading, error } = useSession(sessionId)
  const { data: exercises } = useExercises()
  const deleteSession = useDeleteSession()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!session) return <ErrorMessage message="Session not found" />

  const sessionExercises = (session.session_exercises || []).slice().sort((a, b) => a.position - b.position)

  return (
    <div>
      <PageHeader
        title={session.name || 'Workout'}
        subtitle={`${new Date(session.started_at).toLocaleDateString()} · ${formatDuration(session.started_at, session.ended_at)}`}
        action={
          <button
            onClick={() => {
              if (confirm('Delete this session?')) {
                deleteSession.mutate(sessionId, { onSuccess: () => navigate('/history') })
              }
            }}
            className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        }
      />

      <div className="px-6 pb-6 space-y-3">
        {sessionExercises.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No exercises logged.</p>
        )}
        {sessionExercises.map((se) => {
          const exercise = exercises?.find((e) => e.id === se.exercise_id)
          const metrics = exercise?.exercise_metrics || []
          const logs = se.session_exercise_logs || []

          return (
            <div key={se.id} className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <strong className="text-sm">
                  {se.position}. {exercise?.name || `Exercise #${se.exercise_id}`}
                </strong>
                {se.notes && <span className="ml-2 text-xs text-gray-400">{se.notes}</span>}
              </div>
              {logs.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                      {metrics.map((m) => (
                        <th key={m.name} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          {m.name}{m.unit ? ` (${m.unit})` : ''}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} className="border-b border-gray-50">
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        {metrics.map((m) => (
                          <td key={m.name} className="px-3 py-2">{log.values[m.name] ?? '—'}</td>
                        ))}
                        <td className="px-3 py-2 text-xs text-gray-400">{log.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
