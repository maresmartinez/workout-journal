# Phase 5: Seed Data, Integration, and Final Polish

**Goal:** Seed the database with built-in exercises, verify the full stack works end-to-end, and add any final wiring.

**Depends on:** All previous phases complete.

**Verification:** Both servers run, seed data loads, API returns data, frontend renders correctly.

---

## Task 1: Built-In Exercise Seed Data

**Files:**
- Create: `server/db/seeds.rb`

- [x] **Step 1: Write seed file**

Replace `server/db/seeds.rb`:

```ruby
Exercise.destroy_all

strength_exercises = [
  { name: 'Bench Press', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
  { name: 'Squat', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
  { name: 'Deadlift', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
  { name: 'Overhead Press', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
  { name: 'Pull-Up', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
  { name: 'Barbell Row', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
    { name: 'weight', metric_type: :decimal, unit: 'lbs' },
  ]},
]

cardio_exercises = [
  { name: 'Running', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'min' },
    { name: 'distance', metric_type: :decimal, unit: 'mi' },
  ]},
  { name: 'Cycling', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'min' },
    { name: 'distance', metric_type: :decimal, unit: 'mi' },
  ]},
  { name: 'Jump Rope', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'sec' },
  ]},
]

bodyweight_exercises = [
  { name: 'Push-Up', metrics: [
    { name: 'sets', metric_type: :integer },
    { name: 'reps', metric_type: :integer },
  ]},
  { name: 'Plank', metrics: [
    { name: 'duration', metric_type: :integer, unit: 'sec' },
  ]},
]

all_exercises = strength_exercises + cardio_exercises + bodyweight_exercises

all_exercises.each do |data|
  exercise = Exercise.create!(
    name: data[:name],
    exercise_type: :built_in
  )

  data[:metrics].each do |metric_data|
    exercise.exercise_metrics.create!(metric_data)
  end

  puts "  Created: #{exercise.name} (#{exercise.exercise_metrics.count} metrics)"
end

puts "\nSeeded #{Exercise.count} built-in exercises."
```

- [x] **Step 2: Run seeds**

```bash
cd server && rails db:seed
```

Expected: outputs creation of 11 exercises with metrics

- [x] **Step 3: Verify seed data via API**

```bash
cd server && rails runner 'puts Exercise.includes(:exercise_metrics).map { |e| "#{e.name}: #{e.exercise_metrics.map(&:name).join(", ")}" }.join("\n")'
```

Expected: lists all 11 exercises with their metrics

- [x] **Step 4: Commit**

```bash
git add server/db/seeds.rb && git commit -m "feat: add built-in exercise seed data (strength, cardio, bodyweight)"
```

---

## Task 2: Add Rails Root for SPA Fallback (Optional)

**Files:**
- Modify: `server/config/routes.rb` (if serving frontend from Rails in production)
- Create: `server/public/index.html` (placeholder)

> **Note:** In development, Vite's dev server proxies API calls to Rails. In production, you'd configure Rails to serve the built SPA. This task adds a basic fallback.

- [x] **Step 1: Add catch-all route for SPA**

This is optional for dev but useful for production. Skip if you'll deploy them separately.

No action needed for development — Vite dev server handles the frontend and proxies `/api` to Rails.

- [x] **Step 2: Commit if changes made** (skip if no changes)

---

## Task 3: Final Full-Stack Smoke Test

- [x] **Step 1: Run backend specs**

```bash
cd server && bundle exec rspec
```

Expected: all examples PASS, 0 failures

- [x] **Step 2: Run frontend build**

```bash
cd client && npm run build
```

Expected: builds successfully, no errors

- [x] **Step 3: Start Rails server**

```bash
cd server && rails server -p 3000 &
```

- [x] **Step 4: Verify API responds**

```bash
curl -s http://localhost:3000/api/v1/exercises | head -c 200
```

Expected: JSON response with exercise data

- [x] **Step 5: Start Vite dev server**

```bash
cd client && npm run dev &
```

- [x] **Step 6: Open browser**

Open `http://localhost:5173` and verify:
- Navbar renders with all links
- Dashboard loads
- Exercises page shows seeded exercises
- Templates page renders
- History page renders
- Progress page renders

- [x] **Step 7: Kill background servers**

```bash
kill %1 %2 2>/dev/null; true
```

- [x] **Step 8: Final commit (if any remaining changes)**

```bash
git add -A && git status
```

Only commit if there are uncommitted changes.

---

## Task 4: Clean Up App.tsx Placeholders

**Files:**
- Modify: `client/src/App.tsx`

- [x] **Step 1: Remove all remaining placeholder components from App.tsx**

After all page imports are in place, `client/src/App.tsx` should contain only imports and routes — no inline placeholder functions. Verify the file looks clean:

```tsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import ExerciseLibrary from './pages/ExerciseLibrary'
import ExerciseDetail from './pages/ExerciseDetail'
import Templates from './pages/Templates'
import TemplateDetail from './pages/TemplateDetail'
import ActiveWorkout from './pages/ActiveWorkout'
import History from './pages/History'
import SessionDetail from './pages/SessionDetail'
import Progress from './pages/Progress'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/workout/:id" element={<ActiveWorkout />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<SessionDetail />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  )
}
```

- [x] **Step 2: Final build check**

```bash
cd client && npm run build
```

Expected: builds successfully

- [x] **Step 3: Commit**

```bash
git add client/src/App.tsx && git commit -m "refactor: remove inline placeholders, use imported page components"
```
