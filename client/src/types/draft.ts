import type { Exercise } from './index'

export interface DraftLog {
  id: string
  values: Record<string, string | number | null>
  notes?: string
}

export interface DraftExercise {
  exerciseId: number
  position: number
  notes?: string
  exercise?: Exercise
  logs: DraftLog[]
}

export interface WorkoutDraft {
  name?: string
  startedAt: string
  fromTemplateId?: number
  exercises: DraftExercise[]
}
