import apiClient from './client'
import type { WorkoutSession, SessionExercise, SessionExerciseLog } from '../types'
import type { SessionsResponse, SessionResponse } from './types'

export async function getSessions(): Promise<WorkoutSession[]> {
  const res = await apiClient.get<SessionsResponse>('/workout_sessions')
  return res.data.data.map((item) => ({
    ...item.attributes,
    id: Number(item.id),
  }))
}

export async function getSession(id: number): Promise<WorkoutSession> {
  const res = await apiClient.get<SessionResponse>(`/workout_sessions/${id}`)
  const attrs = res.data.data.attributes
  return { ...attrs, id: Number(res.data.data.id), session_exercises: [] }
}

export async function createSession(data: { name?: string; started_at: string }): Promise<WorkoutSession> {
  const res = await apiClient.post<SessionResponse>('/workout_sessions', { workout_session: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateSession(id: number, data: Partial<{ name: string; status: string; ended_at: string }>): Promise<WorkoutSession> {
  const res = await apiClient.patch<SessionResponse>(`/workout_sessions/${id}`, { workout_session: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function deleteSession(id: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${id}`)
}

export async function getSummary(): Promise<{ total_sessions: number; completed_sessions: number }> {
  const res = await apiClient.get('/workout_sessions/summary')
  return res.data
}

export async function addSessionExercise(sessionId: number, data: { exercise_id: number; position: number; notes?: string }): Promise<SessionExercise> {
  const res = await apiClient.post(`/workout_sessions/${sessionId}/session_exercises`, { session_exercise: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateSessionExercise(sessionId: number, seId: number, data: Partial<{ position: number; notes: string }>): Promise<SessionExercise> {
  const res = await apiClient.put(`/workout_sessions/${sessionId}/session_exercises/${seId}`, { session_exercise: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function removeSessionExercise(sessionId: number, seId: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${sessionId}/session_exercises/${seId}`)
}

export async function createLog(sessionId: number, seId: number, data: { values: Record<string, unknown>; notes?: string }): Promise<SessionExerciseLog> {
  const res = await apiClient.post(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs`, { session_exercise_log: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateLog(sessionId: number, seId: number, logId: number, data: { values?: Record<string, unknown>; notes?: string }): Promise<SessionExerciseLog> {
  const res = await apiClient.put(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs/${logId}`, { session_exercise_log: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function deleteLog(sessionId: number, seId: number, logId: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs/${logId}`)
}
