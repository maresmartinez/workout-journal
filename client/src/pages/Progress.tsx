import { useState, useMemo } from 'react'
import { useExercises } from '../hooks/useExercises'
import { useExerciseProgress } from '../hooks/useProgress'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c']

export default function Progress() {
  const { data: exercises, isLoading: exercisesLoading, error: exercisesError } = useExercises()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data: progress, isLoading: progressLoading, error: progressError } = useExerciseProgress(selectedId)

  if (exercisesLoading) return <LoadingSpinner />
  if (exercisesError) return <ErrorMessage message={exercisesError.message} />

  const exercise = exercises?.find((e) => e.id === selectedId)
  const metrics = exercise?.exercise_metrics.filter((m) => m.metric_type !== 'text') || []

  const chartData = useMemo(() => {
    return (progress?.data_points || []).map((dp) => {
      const cleanValues: Record<string, string | number | undefined> = {}
      for (const [key, val] of Object.entries(dp.values)) {
        cleanValues[key] = val ?? undefined
      }
      return {
        date: new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...cleanValues,
      }
    })
  }, [progress])

  return (
    <div>
      <PageHeader title="Progress" subtitle="Track trends over time" />

      <div className="px-6 pb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Exercise</label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value) || null)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Choose an exercise...</option>
            {(exercises || []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedId && (
          <p className="py-12 text-center text-sm text-gray-400">Select an exercise to see progress charts.</p>
        )}

        {selectedId && progressLoading && <LoadingSpinner />}

        {selectedId && progressError && <ErrorMessage message={progressError.message} />}

        {selectedId && progress && chartData.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No data yet for this exercise.</p>
        )}

        {selectedId && chartData.length > 0 && metrics.map((metric, idx) => (
          <div key={metric.name} className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              {metric.name}{metric.unit ? ` (${metric.unit})` : ''}
            </h3>
            <div className="h-64 rounded-lg border border-gray-200 bg-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={metric.name}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
