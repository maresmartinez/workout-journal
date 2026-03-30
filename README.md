# Workout Journal

A web application for tracking workouts. Manage a library of exercises, build reusable workout templates, log workout sessions with per-set metrics, and view your progress over time with interactive charts.

## Features

- **Exercise Library** — Pre-loaded with common strength, cardio, and bodyweight exercises. Add your own custom exercises with configurable metrics (sets, reps, weight, duration, distance, etc.).
- **Workout Templates** — Compose reusable workout plans by picking exercises from the library. Reorder them via drag-and-drop.
- **Active Workout Logging** — Start a workout from a template or from scratch. Log sets with the metrics defined for each exercise. Timer runs during the session.
- **Session History** — Browse past workouts, review what you logged, and see session details.
- **Progress Charts** — Track your performance over time for any exercise with line charts per metric.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| State management | TanStack React Query 5 |
| Charts | Recharts 3 |
| Backend | Ruby on Rails 8.1 (API-only) |
| Database | PostgreSQL |
| Deployment | Docker + Kamal |

## Getting Started

### Prerequisites

- **Ruby** 3.4.8
- **Node.js** (current LTS)
- **PostgreSQL** running locally
- **Bundler** (`gem install bundler`)

### Setup

```bash
# 1. Set up the server
cd server
bundle install
bin/rails db:setup    # creates DB, loads schema, seeds built-in exercises
bin/rails server      # starts on port 3000

# 2. Set up the client (in a new terminal)
cd client
npm install
npm run dev           # starts on port 5173, proxies /api to port 3000
```

Open http://localhost:5173 in your browser.

### Running Tests

```bash
# Client
cd client
npx vitest

# Server
cd server
bundle exec rspec
```

### Linting

```bash
# Client
cd client
npm run lint

# Server
cd server
bundle exec rubocop
```

## Project Structure

```
client/           # React SPA
  src/
    api/          # Axios client + per-resource API modules
    components/   # Reusable UI components
    hooks/        # React Query hooks
    pages/        # Route-level page components
    types/        # TypeScript interfaces (mirrors API shapes)
server/           # Rails API
  app/
    controllers/api/v1/  # API endpoints
    models/              # ActiveRecord models
    serializers/         # JSON:API serializers
  config/
  db/
    migrate/             # Database migrations
    seeds.rb             # Built-in exercise seed data
  spec/                  # RSpec tests
```

## API

The server exposes a JSON:API at `/api/v1/`. Key resources:

- `exercises` — Built-in and custom exercises with configurable metrics
- `workout_templates` — Reusable workout plans composed of exercises
- `workout_sessions` — Individual workout instances with logged sets
- `progress` — Historical performance data per exercise

See [server/README.md](server/README.md) for full endpoint documentation.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass (`npx vitest` for client, `bundle exec rspec` for server)
4. Ensure linting passes (`npm run lint` for client, `bundle exec rubocop` for server)
5. Open a pull request

## License

This project is private and not currently licensed for external use.
