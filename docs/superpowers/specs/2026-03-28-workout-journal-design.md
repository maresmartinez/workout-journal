# Workout Journal — Design Spec

## Overview

A web-based workout journal for defining exercises with flexible metrics, building reusable workout templates, logging live workout sessions, and tracking progress over time. Built as a responsive web app working on desktop and mobile browsers.

No user authentication in v1, but the data model and API are designed to support multi-user with auth added later.

## Architecture

**Approach:** Rails API-only backend + React TypeScript SPA frontend, in a monorepo.

- **Backend:** `server/` — Ruby on Rails 7+ in `--api` mode, PostgreSQL
- **Frontend:** `client/` — React 18+ with TypeScript, Vite build tooling
- **Communication:** RESTful JSON API over HTTP, versioned at `/api/v1/`

```
workout-journal/
├── client/                   # React TypeScript app
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Page-level components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                   # Rails API app
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   └── serializers/
│   ├── db/
│   ├── config/
│   └── Gemfile
└── README.md
```

## Data Model

### Exercise

A definable exercise. Can be built-in (shipped with the app) or custom (user-created).

| Column          | Type           | Notes                                      |
| --------------- | -------------- | ------------------------------------------ |
| id              | bigint (PK)    |                                            |
| name            | string         | e.g. "Bench Press", "Running"              |
| description     | text           | optional                                   |
| exercise_type   | enum           | `built_in`, `custom`                       |
| user_id         | bigint (FK)    | nullable — null for built-in, set for custom |
| created_at      | datetime       |                                            |
| updated_at      | datetime       |                                            |

Has many **ExerciseMetrics**.

### ExerciseMetric

Defines what and how to log for an exercise. This enables the flexible metrics system.

| Column      | Type           | Notes                                              |
| ----------- | -------------- | -------------------------------------------------- |
| id          | bigint (PK)    |                                                    |
| exercise_id | bigint (FK)    |                                                    |
| name        | string         | e.g. "sets", "reps", "weight", "duration", "distance" |
| metric_type | enum           | `integer`, `decimal`, `text`                       |
| unit        | string         | optional — e.g. "lbs", "kg", "min", "miles"        |
| required    | boolean        | default false                                       |
| created_at  | datetime       |                                                    |
| updated_at  | datetime       |                                                    |

### WorkoutTemplate

A saved workout made up of multiple exercises in order.

| Column      | Type           | Notes                        |
| ----------- | -------------- | ---------------------------- |
| id          | bigint (PK)    |                              |
| name        | string         | e.g. "Push Day", "Leg Day"   |
| description | text           | optional                     |
| user_id     | bigint (FK)    | nullable                     |
| created_at  | datetime       |                              |
| updated_at  | datetime       |                              |

Has many **WorkoutTemplateExercises** (ordered join table).

### WorkoutTemplateExercise

Links a template to an exercise with ordering.

| Column               | Type           | Notes                              |
| -------------------- | -------------- | ---------------------------------- |
| id                   | bigint (PK)    |                                    |
| workout_template_id  | bigint (FK)    |                                    |
| exercise_id          | bigint (FK)    |                                    |
| position             | integer        | ordering within the template       |
| notes                | text           | optional — e.g. "superset with next" |
| created_at           | datetime       |                                    |
| updated_at           | datetime       |                                    |

### WorkoutSession

An actual performed workout.

| Column     | Type           | Notes                                   |
| ---------- | -------------- | --------------------------------------- |
| id         | bigint (PK)    |                                         |
| name       | string         | optional — auto-generated or custom     |
| started_at | datetime       |                                         |
| ended_at   | datetime       | nullable                                |
| status     | enum           | `in_progress`, `completed`, `abandoned` |
| user_id    | bigint (FK)    | nullable                                |
| created_at | datetime       |                                         |
| updated_at | datetime       |                                         |

Has many **SessionExercises**.

### SessionExercise

An exercise performed within a session.

| Column             | Type           | Notes          |
| ------------------ | -------------- | -------------- |
| id                 | bigint (PK)    |                |
| workout_session_id | bigint (FK)    |                |
| exercise_id        | bigint (FK)    |                |
| position           | integer        | ordering       |
| notes              | text           | optional       |
| created_at         | datetime       |                |
| updated_at         | datetime       |                |

Has many **SessionExerciseLogs**.

### SessionExerciseLog

A single logged entry (one set, one interval, etc.).

| Column               | Type           | Notes                                                      |
| -------------------- | -------------- | ---------------------------------------------------------- |
| id                   | bigint (PK)    |                                                            |
| session_exercise_id  | bigint (FK)    |                                                            |
| values               | jsonb          | metric values keyed by metric name, e.g. `{"reps": 10, "weight": 135}` |
| notes                | text           | optional                                                    |
| created_at           | datetime       |                                                            |
| updated_at           | datetime       |                                                            |

The JSONB `values` column is central to the flexible metrics system. It stores whatever metrics are relevant for the exercise without requiring new columns per metric type. PostgreSQL's JSONB supports indexing and querying for progress charts.

## API Design

All endpoints are versioned under `/api/v1/`. No authentication in v1.

### Exercises

| Method   | Path                | Description                      |
| -------- | ------------------- | -------------------------------- |
| GET      | /exercises          | List all (built-in + custom)     |
| POST     | /exercises          | Create custom exercise + metrics |
| GET      | /exercises/:id      | Exercise detail with metrics     |
| PUT      | /exercises/:id      | Update custom exercise           |
| DELETE   | /exercises/:id      | Delete custom exercise           |

### Workout Templates

| Method   | Path                       | Description                     |
| -------- | -------------------------- | ------------------------------- |
| GET      | /workout_templates         | List templates                  |
| POST     | /workout_templates         | Create template with exercises  |
| GET      | /workout_templates/:id     | Template detail with exercises  |
| PUT      | /workout_templates/:id     | Update template                 |
| DELETE   | /workout_templates/:id     | Delete template                 |

### Workout Sessions

| Method   | Path                              | Description                        |
| -------- | --------------------------------- | ---------------------------------- |
| GET      | /workout_sessions                 | List sessions (paginated, sortable) |
| POST     | /workout_sessions                 | Start a session (optionally from template) |
| GET      | /workout_sessions/:id             | Full session detail with exercises and logs |
| PATCH    | /workout_sessions/:id             | Update session (complete, abandon) |
| DELETE   | /workout_sessions/:id             | Delete session                     |

### Session Exercises (nested under sessions)

| Method   | Path                                                          | Description             |
| -------- | ------------------------------------------------------------- | ----------------------- |
| POST     | /workout_sessions/:session_id/session_exercises                      | Add exercise to session |
| PUT      | /workout_sessions/:session_id/session_exercises/:id                  | Reorder / update        |
| DELETE   | /workout_sessions/:session_id/session_exercises/:id                  | Remove from session     |

### Session Exercise Logs (nested under session exercises)

| Method   | Path                                                                         | Description    |
| -------- | ---------------------------------------------------------------------------- | -------------- |
| POST     | /workout_sessions/:session_id/session_exercises/:session_exercise_id/logs                    | Log an entry   |
| PUT      | /workout_sessions/:session_id/session_exercises/:session_exercise_id/logs/:id                | Update log     |
| DELETE   | /workout_sessions/:session_id/session_exercises/:session_exercise_id/logs/:id                | Delete log     |

### Progress / History

| Method   | Path                              | Description                                   |
| -------- | --------------------------------- | --------------------------------------------- |
| GET      | /progress/exercises/:exercise_id  | Time-series data for a specific exercise      |
| GET      | /workout_sessions/summary         | Aggregated stats (total sessions, volume)     |

## Frontend

### Tech Stack

- React 18+ with TypeScript (strict mode)
- Vite for build and dev server
- React Router for client-side routing
- Tailwind CSS for responsive styling
- Recharts for progress charts
- TanStack Query (React Query) for server state management
- React context for UI state
- Axios for HTTP client

### Pages

| Page             | Route              | Description                                                   |
| ---------------- | ------------------ | ------------------------------------------------------------- |
| Dashboard        | `/`                | Quick stats, recent activity, "Start Workout" CTA             |
| Exercise Library | `/exercises`       | Browse built-in + custom exercises, create new with metrics   |
| Exercise Detail  | `/exercises/:id`   | View/edit exercise and its metrics                             |
| Workout Templates| `/templates`       | List, create, edit workout templates                          |
| Template Detail  | `/templates/:id`   | View/edit template with drag-to-reorder exercises             |
| Active Workout   | `/workout/:id`     | Live session: add exercises, log sets/entries, timer, finish  |
| History          | `/history`         | List of past sessions with date filter                        |
| Session Detail   | `/history/:id`     | View completed session details                                |
| Progress         | `/progress`        | Charts per exercise showing trends over time                  |

### Navigation

Consistent top navbar on both desktop and mobile. Logo/app name on the left, nav links to the right. On mobile, links compress horizontally under the title.

### Active Workout Session UX

The core experience:

1. **Starting:** From dashboard "Start Workout" or template detail. If from template, exercises pre-load in order. If from scratch, starts empty.
2. **During:** Each exercise is a card with expandable log entries. "Add Set"/"Add Entry" button per exercise. Previous values auto-populate (e.g., last set's weight/reps carry forward). Form fields adapt to the exercise's defined metrics.
3. **Modifying:** Can add/remove/reorder exercises mid-session via "Add Exercise" button.
4. **Timer:** Running elapsed time display at the top of the session.
5. **Finishing:** "Finish Workout" marks completed and sets `ended_at`. "Cancel" marks abandoned.

## Built-In Exercise Library

The app ships with common exercises pre-seeded. Examples:

**Strength:**
- Bench Press — metrics: sets (integer), reps (integer), weight (decimal, lbs)
- Squat — metrics: sets (integer), reps (integer), weight (decimal, lbs)
- Deadlift — metrics: sets (integer), reps (integer), weight (decimal, lbs)
- Overhead Press — metrics: sets (integer), reps (integer), weight (decimal, lbs)
- Pull-Up — metrics: sets (integer), reps (integer), weight (decimal, lbs, optional)
- Barbell Row — metrics: sets (integer), reps (integer), weight (decimal, lbs)

**Cardio:**
- Running — metrics: duration (integer, min), distance (decimal, mi)
- Cycling — metrics: duration (integer, min), distance (decimal, mi)
- Jump Rope — metrics: duration (integer, min)

**Bodyweight:**
- Push-Up — metrics: sets (integer), reps (integer)
- Plank — metrics: duration (integer, sec)

Users can also create custom exercises with any metrics they define.

## Future-Proofing for Auth & Multi-User

- All tables have a nullable `user_id` FK. When auth is added, scopes filter by `current_user`. Built-in exercises remain `user_id = null` (shared library).
- No auth middleware in v1, but the structure makes it trivial to add `before_action :authenticate_user!` later.
- API is stateless — ready for JWT or session-based auth without restructuring.
- Custom exercises, workout templates, and sessions are user-scoped in the schema.

**Migration path when adding auth:** Add Devise (or similar), add user registration/sessions endpoints, add JWT tokens, add `before_action` to controllers, update frontend to store and send tokens. No schema changes needed beyond adding the users table.

## Testing & Quality

- **Backend:** RSpec — model specs, request specs for API endpoints
- **Frontend:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier for frontend, RuboCop for backend
- **Type safety:** TypeScript strict mode
