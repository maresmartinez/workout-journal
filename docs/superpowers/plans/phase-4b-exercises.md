# Phase 4b: Exercise Library + Exercise Detail Pages

**Goal:** Build the Exercise Library page (list + create custom exercises) and Exercise Detail page (view/edit exercise with metrics).

**Depends on:** Phase 3 (frontend scaffolding)

**Verification:** `cd client && npm run build` succeeds.

---

## Task 1: Exercise Library Page

**Files:**
- Create: `client/src/pages/ExerciseLibrary.tsx`
- Create: `client/src/components/ExerciseFormModal.tsx`

- [ ] **Step 1: Create ExerciseFormModal component**

Create `client/src/components/ExerciseFormModal.tsx`:

```tsx
import { useState } from 'react'
import type { ExerciseMetric } from '../types'

interface MetricRow {
  name: string
  metric_type: 'integer' | 'decimal' | 'text'
  unit: string
  required: boolean
}

interface ExerciseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    exercise_metrics_attributes: MetricRow[]
  }) => void
  isPending: boolean
}

export default function ExerciseFormModal({ open, onClose, onSubmit, isPending }: ExerciseFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [metrics, setMetrics] = useState<MetricRow[]>([
    { name: '', metric_type: 'integer', unit: '', required: false },
  ])

  if (!open) return null

  function addMetric() {
    setMetrics([...metrics, { name: '', metric_type: 'integer', unit: '', required: false }])
  }

  function removeMetric(index: number) {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  function updateMetric(index: number, field: keyof MetricRow, value: string | boolean) {
    const updated = [...metrics]
    updated[index] = { ...updated[index], [field]: value }
    setMetrics(updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      exercise_metrics_attributes: metrics.filter((m) => m.name.trim() !== ''),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Create Custom Exercise</h2>
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Metrics</label>
              <button type="button" onClick={addMetric} className="text-xs text-blue-600 hover:underline">
                + Add Metric
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="name"
                    value={m.name}
                    onChange={(e) => updateMetric(i, 'name', e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={m.metric_type}
                    onChange={(e) => updateMetric(i, 'metric_type', e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="integer">Integer</option>
                    <option value="decimal">Decimal</option>
                    <option value="text">Text</option>
                  </select>
                  <input
                    type="text"
                    placeholder="unit"
                    value={m.unit}
                    onChange={(e) => updateMetric(i, 'unit', e.target.value)}
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button type="button" onClick={() => removeMetric(i)} className="text-red-400 hover:text-red-600 text-sm">
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ExerciseLibrary page**

Create `client/src/pages/ExerciseLibrary.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises, useCreateExercise, useDeleteExercise } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ExerciseFormModal from '../components/ExerciseFormModal'

export default function ExerciseLibrary() {
  const navigate = useNavigate()
  const { data: exercises, isLoading, error } = useExercises()
  const createExercise = useCreateExercise()
  const deleteExercise = useDeleteExercise()
  const [modalOpen, setModalOpen] = useState(false)

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const builtIn = (exercises || []).filter((e) => e.exercise_type === 'built_in')
  const custom = (exercises || []).filter((e) => e.exercise_type === 'custom')

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle={`${builtIn.length} built-in · ${custom.length} custom`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New Exercise
          </button>
        }
      />

      <div className="px-6 pb-6">
        {builtIn.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Built-In</h2>
            <div className="space-y-2">
              {builtIn.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/exercises/${ex.id}`)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-gray-400">
                      {ex.exercise_metrics.map((m) => m.name).join(', ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {custom.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Custom</h2>
            <div className="space-y-2">
              {custom.map((ex) => (
                <div key={ex.id} className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/exercises/${ex.id}`)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-gray-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ex.name}</span>
                      <span className="text-xs text-gray-400">
                        {ex.exercise_metrics.map((m) => m.name).join(', ')}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteExercise.mutate(ex.id)}
                    className="rounded border border-gray-200 px-2 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ExerciseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createExercise.mutate(data, {
            onSuccess: () => setModalOpen(false),
          })
        }}
        isPending={createExercise.isPending}
      />
    </div>
  )
}
```

- [ ] **Step 3: Wire into App router**

In `client/src/App.tsx`, replace the `Exercises` placeholder with:

```tsx
import ExerciseLibrary from './pages/ExerciseLibrary'
```

Remove the old inline `function Exercises() { ... }`.

Update the route to:
```tsx
<Route path="/exercises" element={<ExerciseLibrary />} />
```

- [ ] **Step 4: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 5: Commit**

```bash
git add client/src/ && git commit -m "feat: add Exercise Library page with create modal"
```

---

## Task 2: Exercise Detail Page

**Files:**
- Create: `client/src/pages/ExerciseDetail.tsx`

- [ ] **Step 1: Create ExerciseDetail page**

Create `client/src/pages/ExerciseDetail.tsx`:

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useExercise, useDeleteExercise } from '../hooks/useExercises'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exerciseId = Number(id)
  const { data: exercise, isLoading, error } = useExercise(exerciseId)
  const deleteExercise = useDeleteExercise()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />
  if (!exercise) return <ErrorMessage message="Exercise not found" />

  function handleDelete() {
    if (!confirm('Delete this exercise?')) return
    deleteExercise.mutate(exerciseId, {
      onSuccess: () => navigate('/exercises'),
    })
  }

  return (
    <div>
      <PageHeader
        title={exercise.name}
        subtitle={exercise.exercise_type === 'built_in' ? 'Built-in' : 'Custom'}
        action={
          exercise.exercise_type === 'custom' ? (
            <button onClick={handleDelete} className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Delete
            </button>
          ) : undefined
        }
      />

      <div className="px-6 pb-6">
        {exercise.description && (
          <p className="mb-4 text-sm text-gray-600">{exercise.description}</p>
        )}

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Metrics
          </div>
          {exercise.exercise_metrics.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No metrics defined</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Unit</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Required</th>
                </tr>
              </thead>
              <tbody>
                {exercise.exercise_metrics.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2 text-gray-500">{m.metric_type}</td>
                    <td className="px-4 py-2 text-gray-500">{m.unit || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{m.required ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into App router**

In `client/src/App.tsx`, replace the `ExerciseDetail` placeholder with:

```tsx
import ExerciseDetail from './pages/ExerciseDetail'
```

Remove the old inline `function ExerciseDetail() { ... }`.

- [ ] **Step 3: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 4: Commit**

```bash
git add client/src/ && git commit -m "feat: add Exercise Detail page with metrics table"
```
