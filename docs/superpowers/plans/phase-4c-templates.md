# Phase 4c: Workout Templates + Template Detail Pages

**Goal:** Build the Templates list page (create/edit templates) and Template Detail page with exercise ordering.

**Depends on:** Phase 3, Phase 4b (exercise hooks needed for adding exercises to templates)

**Verification:** `cd client && npm run build` succeeds.

---

## Task 1: Workout Templates List Page

**Files:**
- Create: `client/src/pages/Templates.tsx`
- Create: `client/src/components/TemplateFormModal.tsx`

- [x] **Step 1: Create TemplateFormModal component**

Create `client/src/components/TemplateFormModal.tsx`:

```tsx
import { useState } from 'react'
import type { Exercise } from '../types'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onSubmit: (data: {
    name: string
    description: string
    workout_template_exercises_attributes: Array<{
      exercise_id: number
      position: number
      notes: string
    }>
  }) => void
  isPending: boolean
}

export default function TemplateFormModal({ open, onClose, exercises, onSubmit, isPending }: TemplateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  if (!open) return null

  function toggleExercise(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      workout_template_exercises_attributes: selectedIds.map((exerciseId, index) => ({
        exercise_id: exerciseId,
        position: index + 1,
        notes: '',
      })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Create Workout Template</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Exercises</label>
            <p className="text-xs text-gray-400 mb-2">Select exercises in order</p>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {exercises.map((ex) => (
                <label
                  key={ex.id}
                  className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-sm ${
                    selectedIds.includes(ex.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ex.id)}
                    onChange={() => toggleExercise(ex.id)}
                    className="rounded"
                  />
                  <span className="font-medium">{ex.name}</span>
                  <span className="text-xs text-gray-400">
                    {ex.exercise_metrics.map((m) => m.name).join(', ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="text-xs text-gray-500">
              Order: {selectedIds.map((id) => exercises.find((e) => e.id === id)?.name).join(' → ')}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [x] **Step 2: Create Templates list page**

Create `client/src/pages/Templates.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTemplates, useCreateTemplate, useDeleteTemplate } from '../hooks/useTemplates'
import { useExercises } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import TemplateFormModal from '../components/TemplateFormModal'

export default function Templates() {
  const navigate = useNavigate()
  const { data: templates, isLoading: templatesLoading } = useTemplates()
  const { data: exercises } = useExercises()
  const createTemplate = useCreateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const [modalOpen, setModalOpen] = useState(false)

  if (templatesLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Workout Templates"
        subtitle={`${(templates || []).length} templates`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New Template
          </button>
        }
      />

      <div className="px-6 pb-6 space-y-2">
        {(templates || []).length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No templates yet. Create one to get started.</p>
        )}
        {(templates || []).map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/templates/${t.id}`)}
              className="flex-1 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-gray-300"
            >
              <div className="font-medium">{t.name}</div>
              {t.description && <div className="mt-1 text-xs text-gray-400">{t.description}</div>}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this template?')) deleteTemplate.mutate(t.id)
              }}
              className="rounded border border-gray-200 px-2 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <TemplateFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        exercises={exercises || []}
        onSubmit={(data) => {
          createTemplate.mutate(data, {
            onSuccess: () => setModalOpen(false),
          })
        }}
        isPending={createTemplate.isPending}
      />
    </div>
  )
}
```

- [x] **Step 3: Wire into App router**

In `client/src/App.tsx`, replace the `Templates` placeholder with:

```tsx
import Templates from './pages/Templates'
```

Remove old inline `function Templates() { ... }`.

- [x] **Step 4: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [x] **Step 5: Commit**

```bash
git add client/src/ && git commit -m "feat: add Templates list page with create modal"
```

---

## Task 2: Template Detail Page

**Files:**
- Create: `client/src/pages/TemplateDetail.tsx`

- [x] **Step 1: Create TemplateDetail page**

Create `client/src/pages/TemplateDetail.tsx`:

```tsx
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
```

- [x] **Step 2: Wire into App router**

In `client/src/App.tsx`, replace the `TemplateDetail` placeholder with:

```tsx
import TemplateDetail from './pages/TemplateDetail'
```

Remove old inline `function TemplateDetail() { ... }`.

- [x] **Step 3: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [x] **Step 4: Commit**

```bash
git add client/src/ && git commit -m "feat: add Template Detail page with Start Workout button"
```
