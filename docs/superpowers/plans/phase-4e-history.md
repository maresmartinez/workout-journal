# Phase 4e: History + Session Detail Pages

**Goal:** Build the History page (list past sessions) and Session Detail page (view completed session).

**Depends on:** Phase 3

**Verification:** `cd client && npm run build` succeeds.

---

## Task 1: History Page

**Files:**
- Create: `client/src/pages/History.tsx`

- [ ] **Step 1: Create History page**

Create `client/src/pages/History.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire into App router**

In `client/src/App.tsx`, replace the `History` placeholder with:

```tsx
import History from './pages/History'
```

Remove old inline `function History() { ... }`.

- [ ] **Step 3: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 4: Commit**

```bash
git add client/src/ && git commit -m "feat: add History page with session list"
```

---

## Task 2: Session Detail Page

**Files:**
- Create: `client/src/pages/SessionDetail.tsx`

- [ ] **Step 1: Create SessionDetail page**

Create `client/src/pages/SessionDetail.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire into App router**

In `client/src/App.tsx`, replace the `SessionDetail` placeholder with:

```tsx
import SessionDetail from './pages/SessionDetail'
```

Remove old inline `function SessionDetail() { ... }`.

- [ ] **Step 3: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 4: Commit**

```bash
git add client/src/ && git commit -m "feat: add Session Detail page with exercise log tables"
```
