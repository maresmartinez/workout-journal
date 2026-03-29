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
  const templateExercises = (res.data.included || [])
    .filter((inc) => inc.type === 'workout_template_exercise')
    .map((inc) => ({
      ...(inc.attributes as Record<string, unknown>),
      id: Number(inc.id),
    })) as WorkoutTemplate['workout_template_exercises']

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
