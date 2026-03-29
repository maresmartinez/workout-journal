import { useState } from 'react'

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
