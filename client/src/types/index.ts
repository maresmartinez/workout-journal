export interface ExerciseMetric {
  id: number
  name: string
  metric_type: 'integer' | 'decimal' | 'text'
  unit: string | null
  required: boolean
}

export interface Exercise {
  id: number
  name: string
  description: string | null
  exercise_type: 'built_in' | 'custom'
  exercise_metrics: ExerciseMetric[]
  created_at: string
  updated_at: string
}

export interface WorkoutTemplateExercise {
  id: number
  exercise_id: number
  position: number
  notes: string | null
  exercise?: Exercise
}

export interface WorkoutTemplate {
  id: number
  name: string
  description: string | null
  workout_template_exercises: WorkoutTemplateExercise[]
  created_at: string
  updated_at: string
}

export interface SessionExerciseLog {
  id: number
  session_exercise_id: number
  values: Record<string, string | number | null>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SessionExercise {
  id: number
  workout_session_id: number
  exercise_id: number
  position: number
  notes: string | null
  exercise?: Exercise
  session_exercise_logs: SessionExerciseLog[]
}

export interface WorkoutSession {
  id: number
  name: string | null
  started_at: string
  ended_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  session_exercises?: SessionExercise[]
  created_at: string
  updated_at: string
}

export interface ProgressDataPoint {
  date: string
  values: Record<string, string | number | null>
  session_id: number
}

export interface ExerciseProgress {
  exercise_id: number
  exercise_name: string
  data_points: ProgressDataPoint[]
}

export interface SessionSummary {
  total_sessions: number
  completed_sessions: number
}
