# Workout Set UI Redesign

## Problem

When starting a workout via a template, the active workout page shows a "sets" column alongside reps and weight for each log row. This is confusing because each row IS a set — the set count is the number of rows. Additionally, the notes field per set exists in the data model, API, and display column, but there is no input field for users to enter notes.

## Design

### 1. Remove "sets" as a metric

Each log row represents one set. The `#` column already indicates the set number. The "sets" metric is redundant and confusing.

**Changes:**

- **Seed data** (`server/db/seeds.rb`): Remove `{ name: 'sets', metric_type: :integer }` from all strength and bodyweight exercises. Cardio exercises are unaffected (they don't have a "sets" metric).
- **Migration**: Add a Rails migration to delete all `ExerciseMetric` records where `name = 'sets'`. This cleans up existing databases that were seeded with the old data.
- **Client**: No code changes needed. Metrics drive columns dynamically — once "sets" metrics are gone, the column disappears automatically.

After this change, the log table for Bench Press shows:

```
# | reps | weight (lbs) | Notes | (actions)
1 | 10   | 135          | —     | Edit Del
```

### 2. Add notes input per set

The `SessionExerciseLog` model already has a `notes` column. The API accepts `notes` on create and update. The display column already renders `log.notes`. Only the input UI is missing.

**Changes in `client/src/components/SessionExerciseCard.tsx`:**

- **State**: Add `newNotes` (string) for the add-set input. Extend `editValues` to include a `__notes` key for the edit mode.
- **Add Set row**: Add a text input labeled "Notes" after the metric inputs. On submit, pass the notes value to `onCreateLog`.
- **Edit mode**: Add a notes text input in the inline edit row. On save, pass the notes value to `onUpdateLog`.
- **Prefill behavior**: Notes do NOT carry forward from the previous set. Each new set starts with a blank notes field.

### Scope

- No server controller or model changes needed.
- No API changes needed.
- No changes to the read-only `SessionDetail` page (it already displays notes correctly).
- No changes to `useSessions.ts` hooks (they already pass `notes` through).
