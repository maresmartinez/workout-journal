import { useNavigate } from 'react-router-dom'
import { useSessions, useDeleteSession } from '../hooks/useSessions'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

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

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
}

export default function History() {
  const navigate = useNavigate()
  const { data: sessions, isLoading, error } = useSessions()
  const deleteSession = useDeleteSession()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const completed = (sessions || [])
    .filter((s) => s.status === 'completed' || s.status === 'abandoned')

  return (
    <div>
      <PageHeader
        title="History"
        subtitle={`${completed.length} workouts`}
      />

      <div className="px-6 pb-6 space-y-2">
        {completed.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No workout history yet.</p>
        )}
        {completed.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/history/${s.id}`)}
              className="flex-1 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.name || 'Workout'}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status] || ''}`}>
                  {s.status === 'completed' ? 'Done' : s.status}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(s.started_at)}</span>
                <span>{formatTime(s.started_at)}</span>
                <span>{formatDuration(s.started_at, s.ended_at)}</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this session?')) deleteSession.mutate(s.id)
              }}
              className="rounded border border-gray-200 px-2 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
