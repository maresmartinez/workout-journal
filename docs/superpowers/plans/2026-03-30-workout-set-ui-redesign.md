# Workout Set UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the confusing "sets" metric column and add per-set notes input to the active workout UI.

**Architecture:** Three independent changes: (1) a Rails migration to delete "sets" metrics, (2) seed data cleanup, (3) client-side notes input wiring in SessionExerciseCard and ActiveWorkout. No API or model changes needed.

**Tech Stack:** Rails 8.1 migration, Ruby seeds, React 19, TypeScript, Tailwind CSS

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `server/db/migrate/YYYYMMDDHHMMSS_remove_sets_metric.rb` | Create | Migration to delete ExerciseMetric rows where name = 'sets' |
| `server/db/seeds.rb` | Modify | Remove `{ name: 'sets', ... }` from all exercise definitions |
| `client/src/components/SessionExerciseCard.tsx` | Modify | Add notes input to add-set row and edit mode; wire notes to callbacks |
| `client/src/pages/ActiveWorkout.tsx` | Modify | Forward notes parameter in onCreateLog and onUpdateLog callbacks |

---

### Task 1: Remove "sets" metric from seed data

**Files:**
- Modify: `server/db/seeds.rb`

- [ ] **Step 1: Remove `sets` metric entries from seed data**

In `server/db/seeds.rb`, remove the `{ name: 'sets', metric_type: :integer },` line from every exercise that has it (Bench Press, Squat, Deadlift, Overhead Press, Pull-Up, Barbell Row, Push-Up). The cardio and other bodyweight exercises (Running, Cycling, Jump Rope, Plank) do not have a "sets" metric and should not be changed.

For example, Bench Press changes from:
```ruby
  { name: 'Bench Press', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
```
to:
```ruby
  { name: 'Bench Press', metrics: [
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' }
  ] },
```

Apply this same change to all seven exercises: Bench Press, Squat, Deadlift, Overhead Press, Pull-Up, Barbell Row, Push-Up.

- [ ] **Step 2: Commit**

```bash
git add server/db/seeds.rb
git commit -m "Remove 'sets' metric from exercise seed data"
```

---

### Task 2: Add migration to remove "sets" metrics from existing databases

**Files:**
- Create: `server/db/migrate/YYYYMMDDHHMMSS_remove_sets_from_exercise_metrics.rb`

- [ ] **Step 1: Generate the migration**

Run: `bin/rails generate migration RemoveSetsFromExerciseMetrics`
(in `server/` directory)

- [ ] **Step 2: Write the migration**

Replace the generated migration file contents with:

```ruby
class RemoveSetsFromExerciseMetrics < ActiveRecord::Migration[8.1]
  def up
    ExerciseMetric.where(name: 'sets').delete_all
  end

  def down
    # No-op: re-seed to restore sets metrics
  end
end
```

- [ ] **Step 3: Run the migration**

Run: `bin/rails db:migrate`
(in `server/` directory)

- [ ] **Step 4: Commit**

```bash
git add server/db/migrate/
git commit -m "Add migration to remove 'sets' metrics from existing databases"
```

---

### Task 3: Add per-set notes input in SessionExerciseCard

**Files:**
- Modify: `client/src/components/SessionExerciseCard.tsx`

This is the main UI change. We need to:
1. Add `newNotes` state for the add-set notes input
2. Add notes input to the edit mode
3. Wire notes through to `onCreateLog` and `onUpdateLog` callbacks

- [ ] **Step 1: Add `newNotes` state**

After the existing `editValues` state (around line 56), add:

```tsx
const [newNotes, setNewNotes] = useState('')
const [editNotes, setEditNotes] = useState('')
```

- [ ] **Step 2: Update `handleAddSet` to pass notes**

In `handleAddSet` (line 58), change the call to `onCreateLog` from:

```tsx
onCreateLog(sessionExercise.id, parsed)
```

to:

```tsx
onCreateLog(sessionExercise.id, parsed, newNotes || undefined)
setNewNotes('')
```

- [ ] **Step 3: Update `handleSaveEdit` to pass notes**

In `handleSaveEdit` (line 69), change the call to `onUpdateLog` from:

```tsx
onUpdateLog(sessionExercise.id, logId, parsed)
```

to:

```tsx
onUpdateLog(sessionExercise.id, logId, parsed, editNotes || undefined)
```

- [ ] **Step 4: Update `startEdit` to capture existing notes**

In `startEdit` (line 80), after the `setEditValues(sv)` call, add:

```tsx
setEditNotes(log.notes || '')
```

Also update the function signature to accept the log object. Change the function signature from:

```tsx
function startEdit(logId: number, currentValues: Record<string, unknown>) {
```

to:

```tsx
function startEdit(log: { id: number; values: Record<string, unknown>; notes?: string | null }) {
```

Then update all internal references:
- `logId` → `log.id`
- `currentValues` → `log.values`
- The `setEditingLogId(logId)` → `setEditingLogId(log.id)`

And update the caller in the JSX (around line 155) from:

```tsx
<button onClick={() => startEdit(log.id, log.values)} ...>
```

to:

```tsx
<button onClick={() => startEdit(log)} ...>
```

- [ ] **Step 5: Add notes input to the add-set row**

In the add-set row (lines 167-192), after the metrics input loop and before the "+ Add Set" button, add:

```tsx
<div className="flex-1">
  <label className="block text-xs text-gray-400">Notes</label>
  <input
    type="text"
    value={newNotes}
    onChange={(e) => setNewNotes(e.target.value)}
    className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleAddSet()
    }}
  />
</div>
```

- [ ] **Step 6: Add notes input to edit mode**

In the edit row (lines 126-145), after the metrics input loop (the `</td>` that closes the last metric) and before the Save/Cancel buttons, add a notes `<td>`:

```tsx
<td className="px-3 py-2">
  <input
    type="text"
    value={editNotes}
    onChange={(e) => setEditNotes(e.target.value)}
    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
  />
</td>
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/SessionExerciseCard.tsx
git commit -m "Add per-set notes input to active workout exercise cards"
```

---

### Task 4: Forward notes in ActiveWorkout callbacks

**Files:**
- Modify: `client/src/pages/ActiveWorkout.tsx`

- [ ] **Step 1: Update `onCreateLog` callback to forward notes**

In `ActiveWorkout.tsx` line 95-97, change:

```tsx
onCreateLog={(seId, values) =>
  createLog.mutate({ sessionId, seId, data: { values } })
}
```

to:

```tsx
onCreateLog={(seId, values, notes) =>
  createLog.mutate({ sessionId, seId, data: { values, notes } })
}
```

- [ ] **Step 2: Update `onUpdateLog` callback to forward notes**

In `ActiveWorkout.tsx` line 98-100, change:

```tsx
onUpdateLog={(seId, logId, values) =>
  updateLog.mutate({ sessionId, seId, logId, data: { values } })
}
```

to:

```tsx
onUpdateLog={(seId, logId, values, notes) =>
  updateLog.mutate({ sessionId, seId, logId, data: { values, notes } })
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ActiveWorkout.tsx
git commit -m "Forward per-set notes through ActiveWorkout callbacks"
```

---

### Task 5: Verify

- [ ] **Step 1: Run server linting**

Run: `bundle exec rubocop`
(in `server/` directory)
Expected: No offenses

- [ ] **Step 2: Run server tests**

Run: `bundle exec rspec`
(in `server/` directory)
Expected: All specs pass

- [ ] **Step 3: Run client linting**

Run: `npm run lint`
(in `client/` directory)
Expected: No errors

- [ ] **Step 4: Run client type-check**

Run: `npm run build`
(in `client/` directory)
Expected: Build succeeds with no type errors
