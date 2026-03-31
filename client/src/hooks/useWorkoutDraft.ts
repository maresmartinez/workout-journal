import { useState, useEffect, useCallback, useRef } from 'react'
import type { Exercise } from '../types'
import type { WorkoutDraft, DraftLog } from '../types/draft'

const STORAGE_KEY = 'workout_draft'

function loadDraft(): WorkoutDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(draft: WorkoutDraft | null) {
  if (draft) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function useWorkoutDraft() {
  const [draft, setDraft] = useState<WorkoutDraft | null>(loadDraft)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    saveDraft(draft)
  }, [draft])

  const startBlank = useCallback(() => {
    const newDraft: WorkoutDraft = {
      startedAt: new Date().toISOString(),
      exercises: [],
    }
    setDraft(newDraft)
  }, [])

  const startFromTemplate = useCallback(
    (templateId: number, templateName: string, templateExercises: { exercise_id: number; position: number; notes?: string | null; exercise?: Exercise }[]) => {
      const newDraft: WorkoutDraft = {
        name: templateName,
        startedAt: new Date().toISOString(),
        fromTemplateId: templateId,
        exercises: templateExercises.map((te) => ({
          exerciseId: te.exercise_id,
          position: te.position,
          notes: te.notes ?? undefined,
          exercise: te.exercise,
          logs: [],
        })),
      }
      setDraft(newDraft)
    },
    []
  )

  const addExercise = useCallback((exercise: Exercise) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exerciseId: exercise.id,
            position: prev.exercises.length + 1,
            exercise,
            logs: [],
          },
        ],
      }
    })
  }, [])

  const removeExercise = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises
        .filter((_, i) => i !== index)
        .map((e, i) => ({ ...e, position: i + 1 }))
      return { ...prev, exercises }
    })
  }, [])

  const addLog = useCallback((exerciseIndex: number, values: Record<string, string | number | null>, notes?: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        const log: DraftLog = { id: generateId(), values, notes }
        return { ...e, logs: [...e.logs, log] }
      })
      return { ...prev, exercises }
    })
  }, [])

  const updateLog = useCallback((exerciseIndex: number, logId: string, values: Record<string, string | number | null>, notes?: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        const logs = e.logs.map((l) =>
          l.id === logId ? { ...l, values, notes } : l
        )
        return { ...e, logs }
      })
      return { ...prev, exercises }
    })
  }, [])

  const removeLog = useCallback((exerciseIndex: number, logId: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((e, i) => {
        if (i !== exerciseIndex) return e
        return { ...e, logs: e.logs.filter((l) => l.id !== logId) }
      })
      return { ...prev, exercises }
    })
  }, [])

  const clearDraft = useCallback(() => {
    setDraft(null)
    saveDraft(null)
  }, [])

  const toBatchPayload = useCallback(() => {
    if (!draft) return null
    return {
      name: draft.name,
      started_at: draft.startedAt,
      ended_at: new Date().toISOString(),
      status: 'completed' as const,
      session_exercises_attributes: draft.exercises.map((e) => ({
        exercise_id: e.exerciseId,
        position: e.position,
        notes: e.notes,
        session_exercise_logs_attributes: e.logs.map((l) => ({
          values: l.values,
          notes: l.notes,
        })),
      })),
    }
  }, [draft])

  return {
    draft,
    startBlank,
    startFromTemplate,
    addExercise,
    removeExercise,
    addLog,
    updateLog,
    removeLog,
    clearDraft,
    toBatchPayload,
  }
}
