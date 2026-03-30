# Start Workout from Template

## Problem

Two issues prevent a usable workout flow:

1. **Adding exercises to an active workout is broken.** `getSession()` in `client/src/api/sessions.ts` hardcodes `session_exercises: []` and never parses the JSON:API included resources. Even though the server correctly returns session exercises, the client always ignores them. This means exercises never appear in the UI after being added, and completed session details show nothing.

2. **Starting a workout from a template only copies the name.** The "Start Workout" button on `TemplateDetail.tsx` creates a blank session with the template's name but doesn't copy any exercises. There is no server endpoint to create a session from a template.

## Design

### Fix 1: `getSession()` JSON:API parsing

**File:** `client/src/api/sessions.ts`

Replace the hardcoded `session_exercises: []` with proper JSON:API included resource parsing, matching the pattern already used in `getTemplate()` in `client/src/api/templates.ts`.

The parser must:
- Extract session exercises from the `included` array where `type === 'session_exercises'`
- For each session exercise, find its related exercise (`type === 'exercises'`) and session exercise logs (`type === 'session_exercise_logs'`) via `relationships` links
- Build the nested `WorkoutSession` object with fully populated `session_exercises` (each containing its `exercise` and `session_exercise_logs`)

### Fix 2: Server endpoint — Create session from template

**New route:** `POST /api/v1/workout_sessions/create_from_template`

**Parameters:**
- `workout_template_id` (required) — ID of the template to copy from
- `name` (optional) — defaults to the template's name

**Behavior:**
1. Find the workout template and eager-load its `workout_template_exercises` (with nested `exercise`)
2. Create a `WorkoutSession` with `status: :in_progress`, `started_at: Time.current`, and the provided or template name
3. For each `workout_template_exercise` (ordered by position), create a `SessionExercise` copying `exercise_id`, `position`, and `notes`
4. Return the session serialized with included `session_exercises`, nested `exercise`, and `session_exercise_logs` (empty at this point)
5. Wrap in a transaction so a partial failure rolls everything back

**Error cases:**
- Template not found → 404
- Template has no exercises → still creates the session (valid edge case, user can add exercises manually)

### Fix 3: Template picker on Dashboard

Replace the single "Start Workout" button with a flow that shows a modal listing available templates plus a "Blank Workout" option.

**New component:** `StartWorkoutModal`
- Fetches templates via `useTemplates()`
- Displays templates in a scrollable list showing name and exercise count
- Shows a "Blank Workout" option at the top or bottom
- Selecting a template calls the new `createSessionFromTemplate` API function, then navigates to `/workout/:id`
- Selecting "Blank" calls the existing `createSession` API function, then navigates to `/workout/:id`

**Dashboard changes:**
- "Start Workout" button opens `StartWorkoutModal` instead of directly creating a session

### Fix 4: Template detail page update

**File:** `client/src/pages/TemplateDetail.tsx`

Update the "Start Workout" button to call the new `createSessionFromTemplate` endpoint instead of `createSession`. No picker needed — the template is already chosen.

## Files changed

### Server
- `config/routes.rb` — add `create_from_template` route (must be defined before the `:id` member route to avoid Rails interpreting it as an ID)
- `app/controllers/api/v1/workout_sessions_controller.rb` — add `create_from_template` action
- No model changes needed

### Client
- `src/api/sessions.ts` — fix `getSession()` parsing, add `createSessionFromTemplate()` function
- `src/hooks/useSessions.ts` — add `useCreateSessionFromTemplate` hook
- `src/components/StartWorkoutModal.tsx` — new component (template picker modal)
- `src/pages/Dashboard.tsx` — use `StartWorkoutModal` instead of direct session creation
- `src/pages/TemplateDetail.tsx` — use `createSessionFromTemplate` for "Start Workout" button

## Out of scope

- Editing or reordering exercises during an active workout (already works via `SessionExerciseCard`)
- Template versioning or tracking which template a session came from
- Pre-filling default log values from exercise metrics when starting from template (logs are still created per-set during the workout)
