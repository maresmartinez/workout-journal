import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionSummary, useSessions } from '../hooks/useSessions'
import { useTemplates } from '../hooks/useTemplates'
import { useWorkoutDraft } from '../hooks/useWorkoutDraft'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import StartWorkoutModal from '../components/StartWorkoutModal'
import type { WorkoutDraft } from '../types/draft'

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
  const { startBlank, startFromTemplate, clearDraft } = useWorkoutDraft()
  const [modalOpen, setModalOpen] = useState(false)
  const [existingDraft, setExistingDraft] = useState<WorkoutDraft | null>(() => {
    try {
      const raw = localStorage.getItem('workout_draft')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const recentSessions = (sessions || [])
    .filter((s) => s.status === 'completed')
    .slice(0, 5)

  const lastSession = recentSessions[0]

  async function handleStartFromTemplate(templateId: number) {
    const template = templates?.find((t) => t.id === templateId)
    if (!template) return
    startFromTemplate(templateId, template.name, template.workout_template_exercises)
    navigate('/workout/draft')
  }

  async function handleStartBlank() {
    startBlank()
    navigate('/workout/draft')
  }

  function handleResume() {
    navigate('/workout/draft')
  }

  function handleDiscardDraft() {
    if (!confirm('Discard this workout? All data will be lost.')) return
    clearDraft()
    setExistingDraft(null)
  }

  if (summaryLoading || sessionsLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="px-6 pb-6">
        {existingDraft && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-amber-800">
                You have an unfinished workout
              </p>
              <p className="text-xs text-amber-600">
                Started {formatRelativeDate(existingDraft.startedAt)} &middot; {existingDraft.exercises.length} exercise{existingDraft.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Resume
              </button>
              <button
                onClick={handleDiscardDraft}
                className="rounded border border-amber-300 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Last Workout"
            value={lastSession ? (lastSession.name || 'Workout') : 'None yet'}
            sub={lastSession ? formatRelativeDate(lastSession.started_at) : undefined}
            bg="bg-blue-50"
          />
          <StatCard
            label="Completed Sessions"
            value={summary ? String(summary.completed_sessions) : '0'}
            bg="bg-green-50"
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
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
        isPending={false}
      />
    </div>
  )
}
