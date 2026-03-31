import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSessions, getSession, createSession, createSessionFromTemplate, updateSession, deleteSession, getSummary,
  addSessionExercise,  removeSessionExercise,
  createLog, updateLog, deleteLog,
  createSessionBatch,
} from '../api/sessions'


export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSession(id),
    enabled: !!id,
  })
}

export function useSessionSummary() {
  return useQuery({
    queryKey: ['sessions', 'summary'],
    queryFn: getSummary,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useCreateSessionFromTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSessionFromTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; status: string; ended_at: string }> }) => updateSession(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.id] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useAddSessionExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: { exercise_id: number; position: number; notes?: string } }) => addSessionExercise(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useRemoveSessionExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId }: { sessionId: number; seId: number }) => removeSessionExercise(sessionId, seId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useCreateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, data }: { sessionId: number; seId: number; data: { values: Record<string, unknown>; notes?: string } }) => createLog(sessionId, seId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useUpdateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, logId, data }: { sessionId: number; seId: number; logId: number; data: { values?: Record<string, unknown>; notes?: string } }) => updateLog(sessionId, seId, logId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useDeleteLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, logId }: { sessionId: number; seId: number; logId: number }) => deleteLog(sessionId, seId, logId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useCreateSessionBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSessionBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
