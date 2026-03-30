# Server — Workout Journal API

Ruby on Rails 8.1 API-only backend for the Workout Journal app.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Rails 8.1 (API-only) |
| Ruby | 3.4.8 |
| Database | PostgreSQL |
| Serialization | jsonapi-serializer |
| CORS | rack-cors (allows all origins in development) |
| Testing | RSpec + FactoryBot |
| Linting | Rubocop (rails-omakase) |
| Deployment | Docker + Kamal |

## Getting Started

```bash
bundle install
bin/rails db:setup    # creates DB, loads schema, runs seeds
bin/rails server      # starts on port 3000
```

The server connects to PostgreSQL using the default local socket with database `server_development`. No username or password is needed if your local PostgreSQL trusts your OS user.

## Scripts

| Command | Description |
|---|---|
| `bin/rails server` | Start dev server (port 3000) |
| `bin/rails db:setup` | Create DB, load schema, seed |
| `bin/rails db:migrate` | Run pending migrations |
| `bin/rails db:seed` | Seed built-in exercises |
| `bundle exec rspec` | Run tests |
| `bundle exec rubocop` | Lint |

## API Endpoints

All endpoints are under `/api/v1/`. No authentication required.

### Exercises

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/exercises` | List all exercises (with metrics) |
| POST | `/api/v1/exercises` | Create a custom exercise |
| GET | `/api/v1/exercises/:id` | Get exercise with metrics |
| PATCH | `/api/v1/exercises/:id` | Update a custom exercise |
| DELETE | `/api/v1/exercises/:id` | Delete a custom exercise |

Built-in exercises (`exercise_type: "built_in"`) cannot be modified or deleted.

### Workout Templates

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/workout_templates` | List all templates |
| POST | `/api/v1/workout_templates` | Create a template |
| GET | `/api/v1/workout_templates/:id` | Get template with exercises |
| PATCH | `/api/v1/workout_templates/:id` | Update a template |
| DELETE | `/api/v1/workout_templates/:id` | Delete a template |

### Workout Sessions

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/workout_sessions` | List sessions (most recent first) |
| POST | `/api/v1/workout_sessions` | Create a session |
| GET | `/api/v1/workout_sessions/summary` | Get session counts |
| GET | `/api/v1/workout_sessions/:id` | Get session with exercises and logs |
| PATCH | `/api/v1/workout_sessions/:id` | Update a session |
| DELETE | `/api/v1/workout_sessions/:id` | Delete a session |

### Session Exercises

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/workout_sessions/:id/session_exercises` | Add exercise to session |
| PATCH | `/api/v1/workout_sessions/:id/session_exercises/:id` | Update session exercise |
| DELETE | `/api/v1/workout_sessions/:id/session_exercises/:id` | Remove exercise from session |

### Session Exercise Logs

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/workout_sessions/:id/session_exercises/:id/logs` | Create a log entry |

### Progress

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/progress/exercises/:exercise_id` | Historical progress for an exercise |

## Project Structure

```
app/
  controllers/api/v1/   # API endpoints (Api::V1 namespace)
  models/               # ActiveRecord models
  serializers/          # JSON:API serializers
config/
  routes.rb             # API routes
  database.yml          # PostgreSQL config
db/
  migrate/              # Schema migrations
  schema.rb             # Current schema
  seeds.rb              # Built-in exercise seed data
spec/
  factories/            # FactoryBot factories
  models/               # Model specs
  requests/api/         # Request specs
```

## Data Model

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
- `session_exercise_logs.values` is a jsonb column with a GIN index. Values are keyed by metric name (e.g., `{"sets": 3, "reps": 10, "weight": 135.0}`).
- Exercise metrics define what gets tracked per set; actual logged values go in the jsonb `values` column.
- Templates and sessions are independent — a session can be started from a template or from scratch.

## Conventions

- Controllers are namespaced under `Api::V1`
- JSON:API serialization via `jsonapi-serializer`
- Models use `accepts_nested_attributes_for` for exercise metrics
- Enums are backed by integers in the database
- Standard Rails REST conventions
