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
  sessionId: _sessionId,
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
  const [newNotes, setNewNotes] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function handleAddSet() {
    const parsed: Record<string, unknown> = {}
    for (const m of metrics) {
      const raw = newValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onCreateLog(sessionExercise.id, parsed, newNotes || undefined)
    setNewValues(buildEmptyValues(metrics))
    setNewNotes('')
  }

  function handleSaveEdit(logId: number) {
    const parsed: Record<string, unknown> = {}
    for (const m of metrics) {
      const raw = editValues[m.name]
      if (raw === '' || raw === undefined) continue
      parsed[m.name] = m.metric_type === 'decimal' ? parseFloat(raw) : m.metric_type === 'integer' ? parseInt(raw, 10) : raw
    }
    onUpdateLog(sessionExercise.id, logId, parsed, editNotes || undefined)
    setEditingLogId(null)
  }

  function startEdit(log: { id: number; values: Record<string, unknown>; notes?: string | null }) {
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
                      <td key={m.name} className="px-3 py-2">{log.values[m.name] ?? '—'}</td>
                    ))}
                    <td className="px-3 py-2 text-gray-400 text-xs">{log.notes || '—'}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(log)} className="text-xs text-blue-400 hover:text-blue-600">Edit</button>
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
