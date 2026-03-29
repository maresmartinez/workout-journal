# Phase 4d: Active Workout Page

**Goal:** Build the core live workout session page — the heart of the app. Users add exercises, log sets/entries, see elapsed time, and finish or cancel.

**Depends on:** Phase 3, Phase 4b (exercise data for adding exercises mid-session)

**Verification:** `cd client && npm run build` succeeds.

**Design reference:** `.superpowers/brainstorm/23900-1774744427/content/active-workout.html`

---

## Task 1: ExercisePickerModal Component

**Files:**
- Create: `client/src/components/ExercisePickerModal.tsx`

- [ ] **Step 1: Create ExercisePickerModal**

This modal lets users pick an exercise to add to the active session.

Create `client/src/components/ExercisePickerModal.tsx`:

```tsx
import { useState } from 'react'
import type { Exercise } from '../types'

interface ExercisePickerModalProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSelect: (exerciseId: number) => void
}

export default function ExercisePickerModal({ open, onClose, exercises, onSelect }: ExercisePickerModalProps) {
  const [search, setSearch] = useState('')

  if (!open) return null

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Add Exercise</h2>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No exercises found</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex.id)
                onClose()
              }}
              className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{ex.name}</span>
                <span className="text-xs text-gray-400">
                  {ex.exercise_metrics.map((m) => m.name).join(', ')}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full rounded border border-gray-300 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ExercisePickerModal.tsx && git commit -m "feat: add ExercisePickerModal for adding exercises to session"
```

---

## Task 2: SessionExerciseCard Component

**Files:**
- Create: `client/src/components/SessionExerciseCard.tsx`

- [ ] **Step 1: Create SessionExerciseCard**

This renders one exercise within the active workout — showing logged entries and an "Add Set" button.

Create `client/src/components/SessionExerciseCard.tsx`:

```tsx
import { useState } from 'react'
import type { SessionExercise, Exercise } from '../types'

interface SessionExerciseCardProps {
  sessionExercise: SessionExercise
  exercise?: Exercise
  sessionId: number
  onCreateLog: (seId: number, values: Record<string, unknown>, notes?: string) => void
  onUpdateLog: (seId: number, logId: number, values: Record<string, unknown>, notes?: string) => void
  onDeleteLog: (seId: number, logId: number) => void
  onRemove: (seId: number) => void
  isCreatingLog: boolean
}

function buildEmptyValues(metrics: Exercise['exercise_metrics']): Record<string, string> {
  const values: Record<string, string> = {}
  for (const m of metrics) {
    values[m.name] = ''
  }
  return values
}

function buildPrefilledValues(
  metrics: Exercise['exercise_metrics'],
  lastLogValues: Record<string, unknown> | undefined
): Record<string, string> {
  const values = buildEmptyValues(metrics)
  if (lastLogValues) {
    for (const m of metrics) {
      if (lastLogValues[m.name] !== undefined) {
        values[m.name] = String(lastLogValues[m.name])
      }
    }
  }
  return values
}

export default function SessionExerciseCard({
  sessionExercise,
  exercise,
  sessionId,
  onCreateLog,
  onUpdateLog,
  onDeleteLog,
  onRemove,
  isCreatingLog,
}: SessionExerciseCardProps) {
  const logs = sessionExercise.session_exercise_logs || []
  const metrics = exercise?.exercise_metrics || []
  const lastLogValues = logs.length > 0 ? logs[logs.length - 1].values : undefined

  const [newValues, setNewValues] = useState<Record<string, string>>(
    () => buildPrefilledValues(metrics, lastLogValues)
  )
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  function handleAddSet() {
    const parsed: Record<string, unknown> = {}
    for (const m of metrics) {
      const raw = newValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onCreateLog(sessionExercise.id, parsed)
    setNewValues(buildEmptyValues(metrics))
  }

  function handleSaveEdit(logId: number) {
    const parsed: Record<string, unknown> = {}
    for (const m of metrics) {
      const raw = editValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onUpdateLog(sessionExercise.id, logId, parsed)
    setEditingLogId(null)
  }

  function startEdit(logId: number, currentValues: Record<string, unknown>) {
    const sv: Record<string, string> = {}
    for (const m of metrics) {
      sv[m.name] = currentValues[m.name] !== undefined ? String(currentValues[m.name]) : ''
    }
    setEditValues(sv)
    setEditingLogId(logId)
  }

  const metricHeaders = metrics.map((m) => m.name + (m.unit ? ` (${m.unit})` : ''))

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <strong className="text-sm">
          {sessionExercise.position}. {exercise?.name || `Exercise #${sessionExercise.exercise_id}`}
        </strong>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            onClick={() => onRemove(sessionExercise.id)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
              {metricHeaders.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id} className="border-b border-gray-50">
                {editingLogId === log.id ? (
                  <>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    {metrics.map((m) => (
                      <td key={m.name} className="px-3 py-2">
                        <input
                          type={m.metric_type === 'text' ? 'text' : 'number'}
                          step={m.metric_type === 'decimal' ? '0.1' : undefined}
                          value={editValues[m.name] || ''}
                          onChange={(e) => setEditValues({ ...editValues, [m.name]: e.target.value })}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <button onClick={() => handleSaveEdit(log.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                    </td>
                    <td className="px-2 py-2">
                      <button onClick={() => setEditingLogId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    {metrics.map((m) => (
                      <td key={m.name} className="px-3 py-2">{log.values[m.name] ?? '—'}</td>
                    ))}
                    <td className="px-3 py-2 text-gray-400 text-xs">{log.notes || '—'}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(log.id, log.values)} className="text-xs text-blue-400 hover:text-blue-600">Edit</button>
                        <button onClick={() => onDeleteLog(sessionExercise.id, log.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {metrics.length > 0 && (
        <div className="flex items-end gap-2 border-t border-gray-100 px-4 py-3">
          {metrics.map((m) => (
            <div key={m.name} className="flex-1">
              <label className="block text-xs text-gray-400">{m.name}{m.unit ? ` (${m.unit})` : ''}</label>
              <input
                type={m.metric_type === 'text' ? 'text' : 'number'}
                step={m.metric_type === 'decimal' ? '0.1' : undefined}
                value={newValues[m.name] || ''}
                onChange={(e) => setNewValues({ ...newValues, [m.name]: e.target.value })}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSet()
                }}
              />
            </div>
          ))}
          <button
            onClick={handleAddSet}
            disabled={isCreatingLog}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Add Set
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/SessionExerciseCard.tsx && git commit -m "feat: add SessionExerciseCard component for logging sets"
```

---

## Task 3: Active Workout Page

**Files:**
- Create: `client/src/pages/ActiveWorkout.tsx`
- Create: `client/src/hooks/useTimer.ts`

- [ ] **Step 1: Create useTimer hook**

Create `client/src/hooks/useTimer.ts`:

```typescript
import { useState, useEffect, useRef } from 'react'

export function useTimer(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!startedAt) return

    const start = new Date(startedAt).getTime()

    function update() {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }

    update()
    intervalRef.current = setInterval(update, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return {
    display: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    elapsedSeconds: elapsed,
  }
}
```

- [ ] **Step 2: Create ActiveWorkout page**

Create `client/src/pages/ActiveWorkout.tsx`:

```tsx
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
```

- [ ] **Step 3: Wire into App router**

In `client/src/App.tsx`, replace the `ActiveWorkout` placeholder with:

```tsx
import ActiveWorkout from './pages/ActiveWorkout'
```

Remove old inline `function ActiveWorkout() { ... }`.

- [ ] **Step 4: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 5: Commit**

```bash
git add client/src/ && git commit -m "feat: add Active Workout page with timer, logging, exercise management"
```
