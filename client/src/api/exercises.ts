import apiClient from './client'
import type { Exercise } from '../types'
import type { ExercisesResponse, ExerciseResponse, JsonApiRelationship } from './types'

function extractExercise(data: ExerciseResponse): Exercise {
  const attrs = data.data.attributes
  const metrics = (data.included || [])
    .filter((inc) => inc.type === 'exercise_metric')
    .map((inc) => inc.attributes as Exercise['exercise_metrics'][0])

  return { ...attrs, id: Number(data.data.id), exercise_metrics: metrics }
}

export async function getExercises(): Promise<Exercise[]> {
  const res = await apiClient.get<ExercisesResponse>('/exercises')
  return res.data.data.map((item) => {
    const attrs = item.attributes
    const metricIds = new Set(
      ((item.relationships?.exercise_metrics?.data as JsonApiRelationship[] | undefined) || []).map((r) => r.id)
    )
    const metrics = (res.data.included || [])
      .filter((inc) => inc.type === 'exercise_metric' && metricIds.has(inc.id))
      .map((inc) => inc.attributes as Exercise['exercise_metrics'][0])
    return { ...attrs, id: Number(item.id), exercise_metrics: metrics }
  })
}

export async function getExercise(id: number): Promise<Exercise> {
  const res = await apiClient.get<ExerciseResponse>(`/exercises/${id}`)
  return extractExercise(res.data)
}

export async function createExercise(data: {
  name: string
  description?: string
  exercise_metrics_attributes: Array<{
    name: string
    metric_type: string
    unit?: string
    required?: boolean
  }>
}): Promise<Exercise> {
  const res = await apiClient.post<ExerciseResponse>('/exercises', { exercise: data })
  return extractExercise(res.data)
}

export async function updateExercise(id: number, data: Partial<{ name: string; description: string }>): Promise<Exercise> {
  const res = await apiClient.put<ExerciseResponse>(`/exercises/${id}`, { exercise: data })
  return extractExercise(res.data)
}

export async function deleteExercise(id: number): Promise<void> {
  await apiClient.delete(`/exercises/${id}`)
}
