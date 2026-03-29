import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExercises, getExercise, createExercise, updateExercise, deleteExercise } from '../api/exercises'


export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: getExercises,
  })
}

export function useExercise(id: number) {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: () => getExercise(id),
    enabled: !!id,
  })
}

export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; description: string }> }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}
