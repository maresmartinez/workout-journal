import apiClient from './client'
import type { ExerciseProgress } from '../types'

export async function getExerciseProgress(exerciseId: number): Promise<ExerciseProgress> {
  const res = await apiClient.get(`/progress/exercises/${exerciseId}`)
  return res.data
}
