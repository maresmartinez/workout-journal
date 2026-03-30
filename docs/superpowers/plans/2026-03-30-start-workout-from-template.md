# Start Workout from Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken "add exercise to session" bug and enable starting a workout from a template with exercises pre-populated.

**Architecture:** Server gets a new `create_from_template` endpoint that copies template exercises into session exercises in one transaction. Client fixes `getSession()` JSON:API parsing and adds a template picker modal on the Dashboard.

**Tech Stack:** Rails 8.1 (server), React 19 + TanStack React Query + Tailwind CSS (client)

---

## Task 1: Fix `getSession()` JSON:API parsing (client)

This is the critical bug — `getSession()` hardcodes `session_exercises: []`, so exercises never appear in the UI even though the server returns them correctly.

**Files:**
- Modify: `client/src/api/sessions.ts`

- [ ] **Step 1: Replace `getSession()` with proper JSON:API parsing**

Replace the entire `getSession` function (lines 13-17) with:

```typescript
export async function getSession(id: number): Promise<WorkoutSession> {
  const res = await apiClient.get<SessionResponse>(`/workout_sessions/${id}`)
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
        session_exercise_logs: sessionExerciseLogs as SessionExerciseLog[],
      }
    }) as SessionExercise[]

  return { ...attrs, id: Number(res.data.data.id), session_exercises: sessionExercises }
}
```

- [ ] **Step 2: Add missing type imports**

Update the import on line 2 to include `SessionExercise` (already there) — no change needed since it's already imported. Verify it compiles:

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/api/sessions.ts
git commit -m "fix: parse JSON:API included resources in getSession()"
```

---

## Task 2: Add server `create_from_template` endpoint

**Files:**
- Modify: `server/config/routes.rb`
- Modify: `server/app/controllers/api/v1/workout_sessions_controller.rb`
- Modify: `server/spec/requests/api/v1/workout_sessions_spec.rb`

- [ ] **Step 1: Write the failing test**

Add to `server/spec/requests/api/v1/workout_sessions_spec.rb`, after the `POST /api/v1/workout_sessions` describe block (after line 52):

```ruby
  describe 'POST /api/v1/workout_sessions/create_from_template' do
    it 'creates a session with exercises from a template' do
      template = create(:workout_template, name: 'Push Day')
      ex1 = create(:exercise, name: 'Bench Press')
      ex2 = create(:exercise, name: 'Overhead Press')
      create(:workout_template_exercise, workout_template: template, exercise: ex1, position: 1, notes: 'warm up')
      create(:workout_template_exercise, workout_template: template, exercise: ex2, position: 2)

      expect {
        post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id }
      }.to change(WorkoutSession, :count).by(1).and change(SessionExercise, :count).by(2)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Push Day')
      expect(json['data']['attributes']['status']).to eq('in_progress')

      session = WorkoutSession.last
      ses = session.session_exercises.order(:position)
      expect(ses.pluck(:exercise_id)).to eq([ex1.id, ex2.id])
      expect(ses.first.notes).to eq('warm up')
    end

    it 'returns 404 when template not found' do
      post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: 999999 }

      expect(response).to have_http_status(:not_found)
    end

    it 'creates session even if template has no exercises' do
      template = create(:workout_template, name: 'Empty')

      expect {
        post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id }
      }.to change(WorkoutSession, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'uses provided name over template name' do
      template = create(:workout_template, name: 'Push Day')

      post '/api/v1/workout_sessions/create_from_template', params: { workout_template_id: template.id, name: 'Custom Name' }

      json = JSON.parse(response.body)
      expect(json['data']['attributes']['name']).to eq('Custom Name')
    end
  end
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb`
Expected: FAIL — no route matches `POST /api/v1/workout_sessions/create_from_template`

- [ ] **Step 3: Add the route**

In `server/config/routes.rb`, add the new route **before** the existing `resources :workout_sessions` line. Insert between line 8 (the summary route) and line 9 (`resources :workout_sessions`):

```ruby
      post "/workout_sessions/create_from_template", to: "workout_sessions#create_from_template"
```

The routes file should now have this block:

```ruby
      get "/workout_sessions/summary", to: "workout_sessions#summary"
      post "/workout_sessions/create_from_template", to: "workout_sessions#create_from_template"
      resources :workout_sessions do
```

- [ ] **Step 4: Add the controller action**

Add to `server/app/controllers/api/v1/workout_sessions_controller.rb`, after the `create` method (after line 32), before `def update`:

```ruby
  def create_from_template
    template = WorkoutTemplate.find_by(id: params[:workout_template_id])
    unless template
      render json: { error: "Workout template not found" }, status: :not_found
      return
    end

    session = WorkoutSession.new(
      name: params[:name] || template.name,
      started_at: Time.current,
      status: :in_progress
    )

    ActiveRecord::Base.transaction do
      session.save!
      template.workout_template_exercises.order(:position).each do |wte|
        session.session_exercises.create!(
          exercise_id: wte.exercise_id,
          position: wte.position,
          notes: wte.notes
        )
      end
    end

    render json: WorkoutSessionSerializer.new(session, include: [:session_exercises, :'session_exercises.exercise', :'session_exercises.session_exercise_logs']).serializable_hash.to_json, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bundle exec rspec spec/requests/api/v1/workout_sessions_spec.rb`
Expected: All tests PASS (including the 4 new ones)

- [ ] **Step 6: Run full server test suite and lint**

Run: `bundle exec rspec && bundle exec rubocop`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add server/config/routes.rb server/app/controllers/api/v1/workout_sessions_controller.rb server/spec/requests/api/v1/workout_sessions_spec.rb
git commit -m "feat: add create_from_template endpoint for workout sessions"
```

---

## Task 3: Add client API function and hook for `createSessionFromTemplate`

**Files:**
- Modify: `client/src/api/sessions.ts`
- Modify: `client/src/hooks/useSessions.ts`

- [ ] **Step 1: Add the API function**

Add to the end of `client/src/api/sessions.ts` (after line 64):

```typescript
export async function createSessionFromTemplate(data: { workout_template_id: number; name?: string }): Promise<WorkoutSession> {
  const res = await apiClient.post<SessionResponse>('/workout_sessions/create_from_template', data)
  const attrs = res.data.data.attributes
  const included = res.data.included || []

  const exercises = included
    .filter((inc) => inc.type === 'exercise')
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
      return {
        ...incAttrs,
        id: Number(inc.id),
        exercise: exercise as SessionExercise['exercise'],
        session_exercise_logs: [] as SessionExerciseLog[],
      }
    }) as SessionExercise[]

  return { ...attrs, id: Number(res.data.data.id), session_exercises: sessionExercises }
}
```

Note: Since this is a fresh session from template, `session_exercise_logs` will be empty. We still build the structure for consistency.

- [ ] **Step 2: Add the React Query hook**

Add to `client/src/hooks/useSessions.ts`:

First, add `createSessionFromTemplate` to the import on line 3:

```typescript
import {
  getSessions, getSession, createSession, createSessionFromTemplate, updateSession, deleteSession, getSummary,
  addSessionExercise,  removeSessionExercise,
  createLog, updateLog, deleteLog,
} from '../api/sessions'
```

Then add the hook after `useCreateSession` (after line 39):

```typescript
export function useCreateSessionFromTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSessionFromTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add client/src/api/sessions.ts client/src/hooks/useSessions.ts
git commit -m "feat: add createSessionFromTemplate API function and hook"
```

---

## Task 4: Create `StartWorkoutModal` component

**Files:**
- Create: `client/src/components/StartWorkoutModal.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/StartWorkoutModal.tsx`:

```tsx
import type { WorkoutTemplate } from '../types'

interface StartWorkoutModalProps {
  open: boolean
  onClose: () => void
  templates: WorkoutTemplate[]
  onSelectTemplate: (templateId: number) => void
  onSelectBlank: () => void
  isPending: boolean
}

export default function StartWorkoutModal({ open, onClose, templates, onSelectTemplate, onSelectBlank, isPending }: StartWorkoutModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Start Workout</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a template or start blank</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={onSelectBlank}
            disabled={isPending}
            className="w-full border-b border-gray-200 px-4 py-3 text-left hover:bg-blue-50 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-600">Blank Workout</span>
              <span className="text-xs text-gray-400">Start from scratch</span>
            </div>
          </button>
          {templates.length === 0 && (
            <p className="p-4 text-sm text-gray-400">No templates yet</p>
          )}
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              disabled={isPending}
              className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <span className="text-xs text-gray-400">
                  {t.workout_template_exercises.length} exercise{t.workout_template_exercises.length !== 1 ? 's' : ''}
                </span>
              </div>
              {t.description && (
                <p className="mt-0.5 text-xs text-gray-400">{t.description}</p>
              )}
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

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/components/StartWorkoutModal.tsx
git commit -m "feat: add StartWorkoutModal component"
```

---

## Task 5: Wire up Dashboard and TemplateDetail to use new flow

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`
- Modify: `client/src/pages/TemplateDetail.tsx`

- [ ] **Step 1: Update Dashboard to use StartWorkoutModal**

Replace the entire content of `client/src/pages/Dashboard.tsx` with:

```tsx
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
```

- [ ] **Step 2: Update TemplateDetail to use `useCreateSessionFromTemplate`**

Replace the entire content of `client/src/pages/TemplateDetail.tsx` with:

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useTemplate } from '../hooks/useTemplates'
import { useCreateSessionFromTemplate } from '../hooks/useSessions'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const templateId = Number(id)
  const { data: template, isLoading, error } = useTemplate(templateId)
  const createFromTemplate = useCreateSessionFromTemplate()

  async function handleStartFromTemplate() {
    const session = await createFromTemplate.mutateAsync({ workout_template_id: templateId })
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
            disabled={createFromTemplate.isPending}
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
```

- [ ] **Step 3: Verify it compiles and lint**

Run: `npm run build && npm run lint`
Expected: Both pass

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Dashboard.tsx client/src/pages/TemplateDetail.tsx
git commit -m "feat: wire up template-based workout start in Dashboard and TemplateDetail"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run server tests**

Run: `bundle exec rspec`
Expected: All tests pass

- [ ] **Step 2: Run server lint**

Run: `bundle exec rubocop`
Expected: No offenses

- [ ] **Step 3: Run client build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Run client lint**

Run: `npm run lint`
Expected: No errors
