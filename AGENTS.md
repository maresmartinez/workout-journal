# AGENTS.md

Reference document for AI coding assistants working on this project.

## Project Overview

Workout Journal is a web application for tracking workouts. Users manage a library of exercises, build workout templates, log workout sessions with per-set metrics, and view progress over time via charts.

The app is split into two independent applications that communicate over a JSON API:

- **client/** — React 19 SPA (TypeScript, Vite, Tailwind CSS)
- **server/** — Rails 8.1 API-only backend (Ruby, PostgreSQL)

There is no authentication or multi-tenancy yet. All data is global.

## Architecture

### Client (`client/`)

| Concern | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | react-router-dom 7 |
| Server state | TanStack React Query 5 |
| Charts | Recharts 3 |
| Drag & drop | dnd-kit |
| HTTP | Axios |
| Testing | Vitest + Testing Library |

Directory structure:

```
src/
  api/          # Axios client + per-resource API modules
  components/   # Reusable UI components
  hooks/        # React Query hooks (useExercises, useSessions, etc.)
  pages/        # Route-level page components
  test/         # Test setup (setup.ts)
  types/        # TypeScript interfaces (mirrors API shapes)
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

### Server (`server/`)

| Concern | Technology |
|---|---|
| Framework | Rails 8.1 (API-only) |
| Ruby | 3.4.8 |
| Database | PostgreSQL |
| Serialization | jsonapi-serializer |
| CORS | rack-cors (allows all origins) |
| Testing | RSpec + FactoryBot |
| Linting | Rubocop (rails-omakase) |
| Deployment | Docker + Kamal |

API namespace: `/api/v1/`

### Data Model

```
Exercise
  ├── exercise_metrics (has_many)
  │     name, metric_type (integer|decimal|text), unit, required

WorkoutTemplate
  └── workout_template_exercises (has_many, ordered by position)
        exercise_id, position, notes

WorkoutSession
  ├── status: in_progress | completed | abandoned
  ├── started_at, ended_at
  └── session_exercises (has_many, ordered by position)
        ├── exercise_id, position, notes
        └── session_exercise_logs (has_many)
              values (jsonb), notes
```

Key details:
- Exercises have an `exercise_type` enum: `built_in` (seeded, immutable) or `custom` (user-created).
- `exercise_metrics` define what gets tracked per set (e.g., sets, reps, weight). These are templates; actual values are stored in `session_exercise_logs.values` as a jsonb hash keyed by metric name.
- Workout sessions can be created from templates or from scratch.

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/v1/exercises` | List/create exercises |
| GET/PATCH/DELETE | `/api/v1/exercises/:id` | Show/update/delete exercise |
| GET/POST | `/api/v1/workout_templates` | List/create templates |
| GET/PATCH/DELETE | `/api/v1/workout_templates/:id` | Show/update/delete template |
| GET/POST | `/api/v1/workout_sessions` | List/create sessions |
| GET/PATCH/DELETE | `/api/v1/workout_sessions/:id` | Show/update/delete session |
| GET | `/api/v1/workout_sessions/summary` | Session count summary |
| POST | `/api/v1/workout_sessions/:id/session_exercises` | Add exercise to session |
| PATCH/DELETE | `/api/v1/workout_sessions/:id/session_exercises/:id` | Update/remove session exercise |
| POST | `/api/v1/workout_sessions/:id/session_exercises/:id/logs` | Create a log entry |
| GET | `/api/v1/progress/exercises/:exercise_id` | Historical progress for an exercise |

## Common Commands

### Client

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173, proxies API to :3000)
npm run build        # Type-check and production build
npm run lint         # ESLint
npx vitest           # Run tests
npx vitest --watch   # Run tests in watch mode
```

### Server

```bash
bundle install                    # Install gems
bin/rails db:setup                # Create DB, load schema, run seeds
bin/rails db:migrate              # Run pending migrations
bin/rails server                  # Start dev server (port 3000)
bundle exec rspec                 # Run tests
bundle exec rubocop               # Lint
bin/rails db:seed                 # Seed built-in exercises
```

### Database

The app uses PostgreSQL. In development it connects using the default local socket with database name `server_development`. No username/password needed if your local PostgreSQL trusts the current OS user.

## Code Conventions

- **Client**: TypeScript strict mode, functional components with hooks, React Query for all server state, Tailwind utility classes for styling, no CSS modules. No code comments unless explicitly requested.
- **Server**: Standard Rails conventions. Controllers in `Api::V1` namespace. JSON:API serialization via `jsonapi-serializer`. Models use `accepts_nested_attributes_for` for exercise metrics. Enums backed by integers.
- **General**: No authentication. All API endpoints are currently public. No authorization logic.

## Gotchas

- The Vite dev server must be running for API proxying to work during client development. Alternatively, run both client and server simultaneously.
- Built-in exercises (seeded data) cannot be modified or deleted via the API — the controller enforces this.
- `session_exercise_logs.values` is a jsonb column with a GIN index. Values are keyed by the exercise metric name (e.g., `{"sets": 3, "reps": 10, "weight": 135.0}`).
- The client's `src/types/index.ts` mirrors the API response shapes. When changing API responses, update these types accordingly.
- The Rails test database is `server_test` and needs PostgreSQL running.
