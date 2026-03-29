import { useQuery } from '@tanstack/react-query'
import { getExerciseProgress } from '../api/progress'

export function useExerciseProgress(exerciseId: number | null) {
  return useQuery({
    queryKey: ['progress', 'exercises', exerciseId],
    queryFn: () => getExerciseProgress(exerciseId!),
    enabled: !!exerciseId,
  })
}
