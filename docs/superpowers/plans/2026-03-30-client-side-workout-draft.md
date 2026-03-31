# Client-Side Workout Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move workout session creation entirely to client-side state with localStorage auto-save, batch-saving to the server only when the user finishes the workout.

**Architecture:** A new `useWorkoutDraft` hook manages all draft state (exercises, logs, timer) in React state with localStorage persistence. The `ActiveWorkout` page is refactored to use this hook instead of server mutations. A new batch `create` endpoint on the server accepts nested session exercises and logs. Navigation guards prevent accidental data loss.

**Tech Stack:** React 19, TypeScript, TanStack React Query, localStorage, react-router-dom v7 (useBlocker), Rails 8.1 (accepts_nested_attributes_for), RSpec

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/src/types/draft.ts` | Draft type definitions |
| Create | `client/src/hooks/useWorkoutDraft.ts` | Draft state management + localStorage |
| Create | `client/src/hooks/useNavigationGuard.ts` | beforeunload + useBlocker |
| Modify | `client/src/api/sessions.ts` | Add batch create API function |
| Modify | `client/src/hooks/useSessions.ts` | Add `useCreateSessionBatch` mutation |
| Modify | `client/src/pages/ActiveWorkout.tsx` | Refactor to use draft hook |
| Modify | `client/src/pages/Dashboard.tsx` | Remove server calls, add resume banner |
| Modify | `client/src/App.tsx` | Change route from `/workout/:id` to `/workout/draft` |
| Modify | `server/app/models/workout_session.rb` | Add `accepts_nested_attributes_for` |
| Modify | `server/app/models/session_exercise.rb` | Add `accepts_nested_attributes_for` |
| Modify | `server/app/controllers/api/v1/workout_sessions_controller.rb` | Update `create` + `session_params` for nested attrs |
| Modify | `server/spec/requests/api/v1/workout_sessions_spec.rb` | Add batch create test |
| Modify | `server/spec/models/workout_session_spec.rb` | Add nested attrs test |

---

### Task 1: Server — Add nested attributes to models

**Files:**
- Modify: `server/app/models/workout_session.rb`
- Modify: `server/app/models/session_exercise.rb`
- Test: `server/spec/models/workout_session_spec.rb`

- [ ] **Step 1: Write failing test for nested creation**

Add to `server/spec/models/workout_session_spec.rb` after the last `it` block:

```ruby
it 'accepts nested attributes for session_exercises with logs' do
  exercise = Exercise.create!(name: 'Squat', exercise_type: 'built_in')
  session = WorkoutSession.create!(
    started_at: Time.current,
    status: :completed,
    session_exercises_attributes: [
      {
        exercise_id: exercise.id,
        position: 1,
        session_exercise_logs_attributes: [
          { values: { 'sets' => 3, 'reps' => 10 } }
        ]
      }
    ]
  )
  expect(session.session_exercises.count).to eq(1)
  expect(session.session_exercises.first.session_exercise_logs.count).to eq(1)
  expect(session.session_exercises.first.session_exercise_logs.first.values).to eq({ 'sets' => 3, 'reps' => 10 })
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bundle exec rspec spec/models/workout_session_spec.rb`
Expected: FAIL — `unknown attribute 'session_exercises_attributes'`

- [ ] **Step 3: Add nested attributes to models**

Replace the full contents of `server/app/models/workout_session.rb`:

```ruby
class WorkoutSession < ApplicationRecord
  enum :status, { in_progress: 0, completed: 1, abandoned: 2 }, validate: true

  validates :started_at, presence: true

  has_many :session_exercises, dependent: :destroy

  accepts_nested_attributes_for :session_exercises
end
```

Replace the full contents of `server/app/models/session_exercise.rb`:

```ruby
class SessionExercise < ApplicationRecord
  validates :position, presence: true

  belongs_to :workout_session
  belongs_to :exercise

  has_many :session_exercise_logs, dependent: :destroy

  accepts_nested_attributes_for :session_exercise_logs
end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && bundle exec rspec spec/models/workout_session_spec.rb`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/app/models/workout_session.rb server/app/models/session_exercise.rb server/spec/models/workout_session_spec.rb
git commit -m "feat: add nested attributes to WorkoutSession and SessionExercise models"
```

---

### Task 2: Server — Update controller to accept nested batch create

**Files:**
- Modify: `server/app/controllers/api/v1/workout_sessions_controller.rb`
- Test: `server/spec/requests/api/v1/workout_sessions_spec.rb`

- [ ] **Step 1: Write failing test for batch create**

Add to `server/spec/requests/api/v1/workout_sessions_spec.rb` inside the main `describe` block, after the existing `POST /api/v1/workout_sessions` describe:

```ruby
describe 'POST /api/v1/workout_sessions (batch with nested)' do
  it 'creates a session with exercises and logs in one request' do
    exercise = create(:exercise, name: 'Bench Press')

    expect {
      post '/api/v1/workout_sessions', params: {
        workout_session: {
          name: 'Push Day',
          started_at: Time.current.iso8601,
          ended_at: Time.current.iso8601,
          status: 'completed',
          session_exercises_attributes: [
            {
              exercise_id: exercise.id,
              position: 1,
              notes: 'warm up',
              session_exercise_logs_attributes: [
                { values: { 'sets' => 3, 'reps' => 10, 'weight' => 135.0 } },
                { values: { 'sets' => 3, 'reps' => 8, 'weight' => 185.0 } }
              ]
            }
          ]
        }
      }
    }.to change(WorkoutSession, :count).by(1).and change(SessionExercise, :count).by(1).and change(SessionExerciseLog, :count).by(2)

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json['data']['attributes']['status']).to eq('completed')

    session = WorkoutSession.last
    se = session.session_exercises.first
    expect(se.exercise_id).to eq(exercise.id)
    expect(se.position).to eq(1)
    expect(se.notes).to eq('warm up')
    expect(se.session_exercise_logs.count).to eq(2)
    expect(se.session_exercise_logs.first.values).to eq({ 'sets' => 3, 'reps' => 10, 'weight' => 135.0 })
  end

  it 'creates a session without exercises (blank workout finished)' do
    expect {
      post '/api/v1/workout_sessions', params: {
        workout_session: {
          started_at: Time.current.iso8601,
          ended_at: Time.current.iso8601,
          status: 'completed',
          session_exercises_attributes: []
        }
      }
    }.to change(WorkoutSession, :count).by(1)

    expect(response).to have_http_status(:created)
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb`
Expected: FAIL — nested attributes not permitted in strong params

- [ ] **Step 3: Update controller strong params and create action**

In `server/app/controllers/api/v1/workout_sessions_controller.rb`, replace the `session_params` method:

```ruby
def session_params
  params.require(:workout_session).permit(
    :name, :started_at, :ended_at, :status,
    session_exercises_attributes: [
      :exercise_id, :position, :notes,
      session_exercise_logs_attributes: [ :values, :notes ]
    ]
  )
end
```

Also update the `create` action to remove the forced `status = :in_progress` line (the batch create sends `completed`). Replace the `create` method:

```ruby
def create
  session = WorkoutSession.new(session_params)

  if session.save
    render json: WorkoutSessionSerializer.new(session, include: [ :session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs' ]).serializable_hash.to_json, status: :created
  else
    render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
  end
end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/app/controllers/api/v1/workout_sessions_controller.rb server/spec/requests/api/v1/workout_sessions_spec.rb
git commit -m "feat: update workout_sessions create to accept nested exercises and logs"
```

---

### Task 3: Client — Add draft types

**Files:**
- Create: `client/src/types/draft.ts`

- [ ] **Step 1: Create draft types file**

Create `client/src/types/draft.ts`:

```ts
import type { Exercise } from './index'

export interface DraftLog {
  id: string
  values: Record<string, string | number | null>
  notes?: string
}

export interface DraftExercise {
  exerciseId: number
  position: number
  notes?: string
  exercise?: Exercise
  logs: DraftLog[]
}

export interface WorkoutDraft {
  name?: string
  startedAt: string
  fromTemplateId?: number
  exercises: DraftExercise[]
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/types/draft.ts
git commit -m "feat: add WorkoutDraft type definitions"
```

---

### Task 4: Client — Create useWorkoutDraft hook

**Files:**
- Create: `client/src/hooks/useWorkoutDraft.ts`

- [ ] **Step 1: Create the hook**

Create `client/src/hooks/useWorkoutDraft.ts`:

```ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Exercise } from '../types'
import type { WorkoutDraft, DraftExercise, DraftLog } from '../types/draft'

const STORAGE_KEY = 'workout_draft'

function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(draft: WorkoutDraft | null) {
  if (draft) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function useWorkoutDraft() {
  const [draft, setDraft] = useState<WorkoutDraft | null>(loadDraft)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    saveDraft(draft)
  }, [draft])

  const startBlank = useCallback(() => {
    const newDraft: WorkoutDraft = {
      startedAt: new Date().toISOString(),
      exercises: [],
    }
    setDraft(newDraft)
  }, [])

  const startFromTemplate = useCallback(
    (templateId: number, templateName: string, templateExercises: { exercise_id: number; position: number; notes?: string | null; exercise?: Exercise }[]) => {
      const newDraft: WorkoutDraft = {
        name: templateName,
        startedAt: new Date().toISOString(),
        fromTemplateId: templateId,
        exercises: templateExercises.map((te) => ({
          exerciseId: te.exercise_id,
          position: te.position,
          notes: te.notes ?? undefined,
          exercise: te.exercise,
          logs: [],
        })),
      }
      setDraft(newDraft)
    },
    []
  )

  const addExercise = useCallback((exercise: Exercise) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exerciseId: exercise.id,
            position: prev.exercises.length + 1,
            exercise,
            logs: [],
          },
        ],
      }
    })
  }, [])

  const removeExercise = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises
        .filter((_, i) => i !== index)
        .map((e, i) => ({ ...e, position: i + 1 }))
      return { ...prev, exercises }
    })
  }, [])

  const addLog = useCallback((exerciseIndex: number, values: Record<string, string | number | null>, notes?: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        const log: DraftLog = { id: generateId(), values, notes }
        return { ...e, logs: [...e.logs, log] }
      })
      return { ...prev, exercises }
    })
  }, [])

  const updateLog = useCallback((exerciseIndex: number, logId: string, values: Record<string, string | number | null>, notes?: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        const logs = e.logs.map((l) =>
          l.id === logId ? { ...l, values, notes } : l
        )
        return { ...e, logs }
      })
      return { ...prev, exercises }
    })
  }, [])

  const removeLog = useCallback((exerciseIndex: number, logId: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        return { ...e, logs: e.logs.filter((l) => l.id !== logId) }
      })
      return { ...prev, exercises }
    })
  }, [])

  const clearDraft = useCallback(() => {
    setDraft(null)
    saveDraft(null)
  }, [])

  const toBatchPayload = useCallback(() => {
    if (!draft) return null
    return {
      name: draft.name,
      started_at: draft.startedAt,
      ended_at: new Date().toISOString(),
      status: 'completed' as const,
      session_exercises_attributes: draft.exercises.map((e) => ({
        exercise_id: e.exerciseId,
        position: e.position,
        notes: e.notes,
        session_exercise_logs_attributes: e.logs.map((l) => ({
          values: l.values,
          notes: l.notes,
        })),
      })),
    }
  }, [draft])

  return {
    draft,
    startBlank,
    startFromTemplate,
    addExercise,
    removeExercise,
    addLog,
    updateLog,
    removeLog,
    clearDraft,
    toBatchPayload,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useWorkoutDraft.ts
git commit -m "feat: add useWorkoutDraft hook with localStorage persistence"
```

---

### Task 5: Client — Create useNavigationGuard hook

**Files:**
- Create: `client/src/hooks/useNavigationGuard.ts`

- [ ] **Step 1: Create the hook**

Create `client/src/hooks/useNavigationGuard.ts`:

```ts
import { useEffect, useCallback } from 'react'
import { useBlocker } from 'react-router-dom'

export function useNavigationGuard(shouldGuard: boolean) {
  const blocker = useBlocker(shouldGuard)

  useEffect(() => {
    if (!shouldGuard) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldGuard])

  const discardAndProceed = useCallback(() => {
    if (blocker.proceed) {
      blocker.proceed()
    }
  }, [blocker])

  return {
    blocked: blocker.state === 'blocked',
    discardAndProceed,
    stay: blocker.reset,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/useNavigationGuard.ts
git commit -m "feat: add useNavigationGuard hook for beforeunload and useBlocker"
```

---

### Task 6: Client — Add batch create API function and mutation

**Files:**
- Modify: `client/src/api/sessions.ts`
- Modify: `client/src/hooks/useSessions.ts`

- [ ] **Step 1: Add batch create API function**

Add to the end of `client/src/api/sessions.ts` (before the final closing of the file, after `createSessionFromTemplate`):

```ts
export async function createSessionBatch(data: {
  name?: string
  started_at: string
  ended_at: string
  status: string
  session_exercises_attributes: {
    exercise_id: number
    position: number
    notes?: string
    session_exercise_logs_attributes: {
      values: Record<string, unknown>
      notes?: string
    }[]
  }[]
}): Promise<WorkoutSession> {
  const res = await apiClient.post<SessionResponse>('/workout_sessions', { workout_session: data })
  const attrs = res.data.data.attributes
  const included = res.data.included || []

  const exercises = included
    .filter((inc) => inc.type === 'exercise')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  const exerciseMetrics = included
    .filter((inc) => inc.type === 'exercise_metric')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  Object.values(exercises).forEach((ex) => {
    const exerciseData = res.data.included!.find(
      (inc) => inc.type === 'exercise' && inc.id === String(ex.id)
    )
    const metricsRel = (exerciseData as { relationships?: { exercise_metrics?: { data?: Array<{ id: string }> } } }).relationships?.exercise_metrics?.data
    if (metricsRel) {
      ex.exercise_metrics = metricsRel.map((m) => exerciseMetrics[m.id]).filter(Boolean)
    }
  })

  const logs = included
    .filter((inc) => inc.type === 'session_exercise_log')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  const sessionExercises = included
    .filter((inc) => inc.type === 'session_exercise')
    .map((inc) => {
      const incAttrs = inc.attributes as Record<string, unknown>
      const exerciseRel = (inc as { relationships?: { exercise?: { data?: { id: string } } } }).relationships?.exercise?.data
      const exercise = exerciseRel ? exercises[exerciseRel.id] : undefined
      const logsRel = (inc as { relationships?: { session_exercise_logs?: { data?: Array<{ id: string }> } } }).relationships?.session_exercise_logs?.data
      const sessionExerciseLogs = logsRel
        ? logsRel.map((l) => logs[l.id]).filter(Boolean)
        : []
      return {
        ...incAttrs,
        id: Number(inc.id),
        exercise: exercise as SessionExercise['exercise'],
        session_exercise_logs: sessionExerciseLogs as unknown as SessionExerciseLog[],
      }
    }) as SessionExercise[]

  return { ...attrs, id: Number(res.data.data.id), session_exercises: sessionExercises }
}
```

- [ ] **Step 2: Add batch create mutation hook**

Add to the end of `client/src/hooks/useSessions.ts`:

```ts
export function useCreateSessionBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSessionBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
```

Also add `createSessionBatch` to the import from `../api/sessions` at line 3.

- [ ] **Step 3: Commit**

```bash
git add client/src/api/sessions.ts client/src/hooks/useSessions.ts
git commit -m "feat: add batch session create API function and mutation hook"
```

---

### Task 7: Client — Refactor ActiveWorkout page to use draft

**Files:**
- Modify: `client/src/pages/ActiveWorkout.tsx`

- [ ] **Step 1: Rewrite ActiveWorkout to use draft state**

Replace the full contents of `client/src/pages/ActiveWorkout.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutDraft } from '../hooks/useWorkoutDraft'
import { useNavigationGuard } from '../hooks/useNavigationGuard'
import { useCreateSessionBatch } from '../hooks/useSessions'
import { useExercises } from '../hooks/useExercises'
import { useTimer } from '../hooks/useTimer'
import ErrorMessage from '../components/ErrorMessage'
import DraftExerciseCard from '../components/DraftExerciseCard'
import ExercisePickerModal from '../components/ExercisePickerModal'

export default function ActiveWorkout() {
  const navigate = useNavigate()
  const { draft, addExercise, removeExercise, addLog, updateLog, removeLog, clearDraft, toBatchPayload } = useWorkoutDraft()
  const { data: exercises } = useExercises()
  const createBatch = useCreateSessionBatch()
  const [pickerOpen, setPickerOpen] = useState(false)

  const timer = useTimer(draft?.startedAt)

  useNavigationGuard(!!draft)

  if (!draft) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No active workout.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    )
  }

  function handleAddExercise(exerciseId: number) {
    const exercise = exercises?.find((e) => e.id === exerciseId)
    if (exercise) addExercise(exercise)
  }

  function handleFinish() {
    const payload = toBatchPayload()
    if (!payload) return
    createBatch.mutate(payload, {
      onSuccess: (session) => {
        clearDraft()
        navigate(`/history/${session.id}`)
      },
    })
  }

  function handleDiscard() {
    if (!confirm('Discard this workout? All data will be lost.')) return
    clearDraft()
    navigate('/')
  }

  return (
    <div>
      {createBatch.isError && (
        <div className="bg-red-50 px-6 py-2 text-sm text-red-600">
          Failed to save workout: {createBatch.error.message}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">{draft.name || 'Active Workout'}</h1>
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
        {draft.exercises.map((de, index) => (
          <DraftExerciseCard
            key={de.exerciseId + '-' + de.position}
            draftExercise={de}
            exerciseIndex={index}
            onAddLog={addLog}
            onUpdateLog={updateLog}
            onRemoveLog={removeLog}
            onRemove={() => removeExercise(index)}
          />
        ))}

        {draft.exercises.length === 0 && (
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
            disabled={draft.exercises.length === 0 || createBatch.isPending}
            className="flex-1 rounded-md bg-green-600 py-3 text-base font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Finish Workout
          </button>
          <button
            onClick={handleDiscard}
            className="rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            Discard
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

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/ActiveWorkout.tsx
git commit -m "feat: refactor ActiveWorkout to use client-side draft state"
```

---

### Task 8: Client — Create DraftExerciseCard component

**Files:**
- Create: `client/src/components/DraftExerciseCard.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/DraftExerciseCard.tsx`:

```tsx
import { useState } from 'react'
import type { DraftExercise, DraftLog } from '../types/draft'
import type { Exercise } from '../types'

interface DraftExerciseCardProps {
  draftExercise: DraftExercise
  exerciseIndex: number
  onAddLog: (exerciseIndex: number, values: Record<string, string | number | null>, notes?: string) => void
  onUpdateLog: (exerciseIndex: number, logId: string, values: Record<string, string | number | null>, notes?: string) => void
  onRemoveLog: (exerciseIndex: number, logId: string) => void
  onRemove: () => void
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

export default function DraftExerciseCard({
  draftExercise,
  exerciseIndex,
  onAddLog,
  onUpdateLog,
  onRemoveLog,
  onRemove,
}: DraftExerciseCardProps) {
  const metrics = draftExercise.exercise?.exercise_metrics || []
  const logs = draftExercise.logs
  const lastLogValues = logs.length > 0 ? logs[logs.length - 1].values : undefined

  const [newValues, setNewValues] = useState<Record<string, string>>(
    () => buildPrefilledValues(metrics, lastLogValues as Record<string, unknown> | undefined)
  )
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [newNotes, setNewNotes] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function handleAddSet() {
    const parsed: Record<string, string | number | null> = {}
    for (const m of metrics) {
      const raw = newValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onAddLog(exerciseIndex, parsed, newNotes || undefined)
    setNewValues(buildEmptyValues(metrics))
    setNewNotes('')
  }

  function handleSaveEdit(logId: string) {
    const parsed: Record<string, string | number | null> = {}
    for (const m of metrics) {
      const raw = editValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onUpdateLog(exerciseIndex, logId, parsed, editNotes || undefined)
    setEditingLogId(null)
  }

  function startEdit(log: DraftLog) {
    const sv: Record<string, string> = {}
    for (const m of metrics) {
      sv[m.name] = log.values[m.name] !== undefined ? String(log.values[m.name]) : ''
    }
    setEditValues(sv)
    setEditNotes(log.notes || '')
    setEditingLogId(log.id)
  }

  const metricHeaders = metrics.map((m) => m.name + (m.unit ? ` (${m.unit})` : ''))

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <strong className="text-sm">
          {draftExercise.position}. {draftExercise.exercise?.name || `Exercise #${draftExercise.exerciseId}`}
        </strong>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            onClick={onRemove}
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
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleSaveEdit(log.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                        <button onClick={() => setEditingLogId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    {metrics.map((m) => (
                      <td key={m.name} className="px-3 py-2">{log.values[m.name] ?? '\u2014'}</td>
                    ))}
                    <td className="px-3 py-2 text-gray-400 text-xs">{log.notes || '\u2014'}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(log)} className="text-xs text-blue-400 hover:text-blue-600">Edit</button>
                        <button onClick={() => onRemoveLog(exerciseIndex, log.id)} className="text-xs text-red-400 hover:text-red-600">Del</button>
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
          <div className="flex-1">
            <label className="block text-xs text-gray-400">Notes</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSet()
              }}
            />
          </div>
          <button
            onClick={handleAddSet}
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
git add client/src/components/DraftExerciseCard.tsx
git commit -m "feat: add DraftExerciseCard component for draft-based workout logging"
```

---

### Task 9: Client — Update Dashboard to use draft and show resume banner

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Rewrite Dashboard to use draft and add resume banner**

Replace the full contents of `client/src/pages/Dashboard.tsx`:

```tsx
import { useState, useEffect } from 'react'
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
  const [existingDraft, setExistingDraft] = useState<WorkoutDraft | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('workout_draft')
      if (raw) setExistingDraft(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: update Dashboard to use draft, add resume banner, remove server session creation"
```

---

### Task 10: Client — Update route from `/workout/:id` to `/workout/draft`

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Update route**

In `client/src/App.tsx`, change the workout route:

Replace:
```tsx
<Route path="/workout/:id" element={<ActiveWorkout />} />
```

With:
```tsx
<Route path="/workout/draft" element={<ActiveWorkout />} />
```

- [ ] **Step 2: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat: change active workout route to /workout/draft"
```

---

### Task 11: Client — Verify build and fix issues

- [ ] **Step 1: Run TypeScript build**

Run: `cd client && npx tsc -b --noEmit`
Expected: No errors

If there are type errors, fix them before proceeding.

- [ ] **Step 2: Run ESLint**

Run: `cd client && npm run lint`
Expected: No errors

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type and lint errors from draft refactor"
```
(Only if fixes were needed)

---

### Task 12: Server — Run full test suite

- [ ] **Step 1: Run RSpec**

Run: `cd server && bundle exec rspec`
Expected: All tests PASS

If there are failures, fix them before proceeding. The existing `POST /api/v1/workout_sessions` test should still pass because the controller still accepts simple params (the `session_params` permit list now also includes the nested attributes, but doesn't require them).

- [ ] **Step 2: Run Rubocop**

Run: `cd server && bundle exec rubocop`
Expected: No offenses

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve server test failures from batch create changes"
```
(Only if fixes were needed)
