# Client-Side Workout Draft with localStorage Auto-Save

## Problem

When a user starts a workout, a `WorkoutSession` record is immediately persisted to the database with `status: in_progress`. All exercise additions and log entries are also saved incrementally via individual API calls. If the user navigates away from the active workout page, the session remains in `in_progress` indefinitely — an orphaned session. The dashboard summary counts all sessions regardless of status, showing inflated totals like "0 of 10 total".

Additionally, there is no navigation protection (`beforeunload`, `useBlocker`) to warn the user that they have an active workout.

## Solution

Hold the entire workout draft in React state with localStorage persistence. Nothing is sent to the server until the user explicitly clicks "Finish Workout", at which point everything is batch-saved in a single transaction.

## Design

### 1. Client-Side Draft State

A new `useWorkoutDraft` hook manages the entire workout in React state.

**Draft shape:**

```ts
interface WorkoutDraft {
  name?: string
  startedAt: string          // ISO timestamp when workout was started
  fromTemplateId?: number    // if started from a template
  exercises: DraftExercise[]
}

interface DraftExercise {
  exerciseId: number
  position: number
  notes?: string
  exercise?: Exercise        // full exercise object (with metrics) for rendering
  logs: DraftLog[]
}

interface DraftLog {
  id: string                 // client-generated UUID for React keys
  values: Record<string, string | number | null>
  notes?: string
}
```

**Actions exposed by the hook:**
- `addExercise(exercise)` — appends to exercises array
- `removeExercise(index)` — removes exercise and repositions remaining
- `reorderExercises(fromIndex, toIndex)` — updates position values
- `addLog(exerciseIndex, log)` — adds a log to an exercise
- `updateLog(exerciseIndex, logId, values)` — edits an existing log
- `removeLog(exerciseIndex, logId)` — removes a log

**Starting a workout:**
- "Start Blank Workout" — initializes an empty draft with `startedAt = now()` and navigates to the draft page
- "Start from Template" — loads the template's exercises (name, exercise references, positions, notes) into the draft without any server call. The template data is already in React Query cache from the templates query.

### 2. localStorage Persistence

The hook auto-saves to `localStorage` on every state change (using a `useEffect` with the draft as a dependency). The storage key is `workout_draft`.

**On mount:**
- Check `localStorage` for an existing draft
- If found, restore it into React state
- If found and stale (e.g., older than 24 hours), still restore but show a notice — let the user decide whether to continue or discard

**Draft lifecycle:**
- Created when workout starts
- Auto-saved on every change
- Cleared from `localStorage` on successful "Finish" or explicit "Discard"
- Only one draft at a time — if the user tries to start a new workout while a draft exists, prompt to discard the existing draft or continue it

### 3. Navigation Protection

**`beforeunload` event:** Registered when a draft is active. Warns the user that they have unsaved changes if they try to close the tab or navigate to a different URL.

**react-router `useBlocker`:** Intercepts in-app navigation (clicking Dashboard, History links, etc.) and shows a confirmation dialog. The user can choose to stay or discard and leave.

Both protections are active whenever the draft state is non-empty. They are removed when the draft is cleared (finish or discard).

### 4. Batch Save on "Finish"

When the user clicks "Finish Workout", a single API call persists everything:

```
POST /api/v1/workout_sessions
{
  "workout_session": {
    "name": "...",
    "started_at": "<ISO>",
    "ended_at": "<ISO>",
    "status": "completed",
    "session_exercises_attributes": [
      {
        "exercise_id": 1,
        "position": 1,
        "session_exercise_logs_attributes": [
          { "values": { "sets": 3, "reps": 10, "weight": 135.0 } }
        ]
      }
    ]
  }
}
```

The server wraps this in an `ActiveRecord::Base.transaction`. On success:
- Clear the draft from state and `localStorage`
- Navigate to `/history/:id` (the newly created session)

### 5. "Discard Workout" (replaces "Cancel/Abandon")

The current "Cancel" button sets the session to `abandoned` status. With client-side drafts, there is nothing to abandon on the server. The button becomes "Discard Workout":
- Prompts with `confirm('Discard this workout? All data will be lost.')`
- On confirm: clears draft from state and `localStorage`, navigates to `/`
- No server call needed

### 6. Server Changes

**Modified `WorkoutSessionsController#create`:**
- Accept `session_exercises_attributes` with nested `session_exercise_logs_attributes`
- Wrap creation in a transaction
- Return the created session with includes (session_exercises, exercises, logs)

**Model updates:**
- `WorkoutSession` adds `accepts_nested_attributes_for :session_exercises, allow_destroy: false`
- `SessionExercise` adds `accepts_nested_attributes_for :session_exercise_logs, allow_destroy: false`
- Strong params updated to permit the nested structure

**No changes to existing incremental endpoints** — they remain available but are no longer called from the active workout flow. They may be useful for future features (e.g., editing completed sessions).

### 7. Dashboard Changes

**"Resume Workout" banner:** On mount, check `localStorage` for a draft. If one exists, show a prominent banner at the top of the Dashboard with a "Resume Workout" button that navigates to the draft page. Also show a "Discard" option.

**Summary card:** Only show `completed_sessions`. The `total_sessions` count is no longer meaningful since there are no orphaned sessions.

**Start Workout flow:** The "Start Workout" button no longer calls `createSession.mutateAsync()`. Instead, it initializes the draft and navigates to `/workout/draft`.

### 8. Route Changes

- Remove or redirect `/workout/:id` for `in_progress` sessions (no longer used during active workout)
- New route: `/workout/draft` — the active workout page using draft state
- `/workout/:id` remains for viewing completed sessions (redirects to `/history/:id`)

### 9. Files Changed

**Client — New:**
- `src/hooks/useWorkoutDraft.ts` — draft state management + localStorage persistence
- `src/hooks/useNavigationGuard.ts` — beforeunload + useBlocker logic

**Client — Modified:**
- `src/pages/ActiveWorkout.tsx` — refactor to use `useWorkoutDraft` instead of server mutations
- `src/pages/Dashboard.tsx` — remove immediate session creation, add "Resume" banner
- `src/components/SessionExerciseCard.tsx` — accept draft-based props instead of server mutation callbacks
- `src/api/sessions.ts` — add `createSessionBatch()` function with nested payload
- `src/hooks/useSessions.ts` — add `useCreateSessionBatch()` mutation
- `src/types/index.ts` — add `WorkoutDraft`, `DraftExercise`, `DraftLog` types

**Server — Modified:**
- `app/controllers/api/v1/workout_sessions_controller.rb` — update `create` to accept nested attributes
- `app/models/workout_session.rb` — add `accepts_nested_attributes_for`
- `app/models/session_exercise.rb` — add `accepts_nested_attributes_for`

### 10. Edge Cases

- **Browser crash mid-workout:** Draft is in localStorage, restored on next visit via the "Resume Workout" banner.
- **Multiple tabs:** localStorage is shared. If a user opens a second tab and starts a new workout, it overwrites the existing draft. The first tab's `storage` event listener detects this and warns the user.
- **Empty workout finish:** The "Finish Workout" button is disabled when the draft has no exercises.
- **Very long workout:** localStorage limit is ~5MB. Workout data is tiny (a few KB at most), so this is not a concern.
- **Stale drafts:** A draft older than 24 hours is still restorable but the user is informed it's from a previous session.
