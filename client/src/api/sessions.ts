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
  const included = res.data.included || []

  const exercises = included
    .filter((inc) => inc.type === 'exercise')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  const exerciseMetrics = included
    .filter((inc) => inc.type === 'exercise_metric')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  Object.values(exercises).forEach((ex) => {
    const exerciseData = res.data.included!.find(
      (inc) => inc.type === 'exercise' && inc.id === String(ex.id)
    )
    const metricsRel = (exerciseData as { relationships?: { exercise_metrics?: { data?: Array<{ id: string }> } } }).relationships?.exercise_metrics?.data
    if (metricsRel) {
      ex.exercise_metrics = metricsRel.map((m) => exerciseMetrics[m.id]).filter(Boolean)
    }
  })

  const logs = included
    .filter((inc) => inc.type === 'session_exercise_log')
    .reduce<Record<string, Record<string, unknown>>>((map, inc) => {
      map[inc.id] = { ...(inc.attributes as Record<string, unknown>), id: Number(inc.id) }
      return map
    }, {})

  const sessionExercises = included
    .filter((inc) => inc.type === 'session_exercise')
    .map((inc) => {
      const incAttrs = inc.attributes as Record<string, unknown>
      const exerciseRel = (inc as { relationships?: { exercise?: { data?: { id: string } } } }).relationships?.exercise?.data
      const exercise = exerciseRel ? exercises[exerciseRel.id] : undefined
      const logsRel = (inc as { relationships?: { session_exercise_logs?: { data?: Array<{ id: string }> } } }).relationships?.session_exercise_logs?.data
      const sessionExerciseLogs = logsRel
        ? logsRel.map((l) => logs[l.id]).filter(Boolean)
        : []
      return {
        ...incAttrs,
        id: Number(inc.id),
        exercise: exercise as SessionExercise['exercise'],
        session_exercise_logs: sessionExerciseLogs as unknown as SessionExerciseLog[],
      }
    }) as SessionExercise[]

  return { ...attrs, id: Number(res.data.data.id), session_exercises: sessionExercises }
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
