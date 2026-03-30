import apiClient from './client'
import type { WorkoutTemplate } from '../types'
import type { TemplatesResponse, TemplateResponse } from './types'

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const res = await apiClient.get<TemplatesResponse>('/workout_templates')
  return res.data.data.map((item) => ({
    ...item.attributes,
    id: Number(item.id),
    workout_template_exercises: [],
  }))
}

export async function getTemplate(id: number): Promise<WorkoutTemplate> {
  const res = await apiClient.get<TemplateResponse>(`/workout_templates/${id}`)
  const attrs = res.data.data.attributes
  const included = res.data.included || []

  const exercises = included
    .filter((inc) => inc.type === 'exercise')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  const templateExercises = included
    .filter((inc) => inc.type === 'workout_template_exercise')
    .map((inc) => {
      const incAttrs = inc.attributes as Record<string, unknown>
      const relData = (inc as { relationships?: { exercise?: { data?: { id: string } } } }).relationships?.exercise?.data
      const exercise = relData ? exercises[relData.id] : undefined
      return {
        ...incAttrs,
        id: Number(inc.id),
        exercise: exercise as WorkoutTemplate['workout_template_exercises'][number]['exercise'],
      }
    }) as WorkoutTemplate['workout_template_exercises']

  return { ...attrs, id: Number(res.data.data.id), workout_template_exercises: templateExercises }
}

export async function createTemplate(data: {
  name: string
  description?: string
  workout_template_exercises_attributes: Array<{
    exercise_id: number
    position: number
    notes?: string
  }>
}): Promise<WorkoutTemplate> {
  const res = await apiClient.post<TemplateResponse>('/workout_templates', { workout_template: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id), workout_template_exercises: [] }
}

export async function updateTemplate(id: number, data: Partial<{ name: string; description: string; workout_template_exercises_attributes: unknown[] }>): Promise<WorkoutTemplate> {
  const res = await apiClient.put<TemplateResponse>(`/workout_templates/${id}`, { workout_template: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id), workout_template_exercises: [] }
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiClient.delete(`/workout_templates/${id}`)
}
