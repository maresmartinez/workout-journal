import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionSummary, useSessions, useCreateSession, useCreateSessionFromTemplate } from '../hooks/useSessions'
import { useTemplates } from '../hooks/useTemplates'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StartWorkoutModal from '../components/StartWorkoutModal'

function StatCard({ label, value, sub, bg }: { label: string; value: string; sub?: string; bg: string }) {
  return (
    <div className={`rounded-lg p-4 ${bg}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: summary, isLoading: summaryLoading } = useSessionSummary()
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const { data: templates } = useTemplates()
  const createSession = useCreateSession()
  const createFromTemplate = useCreateSessionFromTemplate()
  const [modalOpen, setModalOpen] = useState(false)

  const recentSessions = (sessions || [])
    .filter((s) => s.status === 'completed')
    .slice(0, 5)

  const lastSession = recentSessions[0]

  const isPending = createSession.isPending || createFromTemplate.isPending

  async function handleStartFromTemplate(templateId: number) {
    const session = await createFromTemplate.mutateAsync({ workout_template_id: templateId })
    navigate(`/workout/${session.id}`)
  }

  async function handleStartBlank() {
    const session = await createSession.mutateAsync({
      name: undefined,
      started_at: new Date().toISOString(),
    })
    navigate(`/workout/${session.id}`)
  }

  if (summaryLoading || sessionsLoading) return <LoadingSpinner />
  if (createSession.isError) return <ErrorMessage message={createSession.error.message} />
  if (createFromTemplate.isError) return <ErrorMessage message={createFromTemplate.error.message} />

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Last Workout"
            value={lastSession ? (lastSession.name || 'Workout') : 'None yet'}
            sub={lastSession ? formatRelativeDate(lastSession.started_at) : undefined}
            bg="bg-blue-50"
          />
          <StatCard
            label="Total Sessions"
            value={summary ? String(summary.completed_sessions) : '0'}
            sub={summary ? `of ${summary.total_sessions} total` : undefined}
            bg="bg-green-50"
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isPending}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Start Workout
        </button>

        {recentSessions.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</h2>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/history/${s.id}`)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name || 'Workout'}</span>
                    <span className="text-xs text-gray-400">{formatRelativeDate(s.started_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <StartWorkoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        templates={templates || []}
        onSelectTemplate={handleStartFromTemplate}
        onSelectBlank={handleStartBlank}
        isPending={isPending}
      />
    </div>
  )
}
