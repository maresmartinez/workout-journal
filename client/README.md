# Client — Workout Journal Frontend

React 19 single-page application for the Workout Journal app.

## Tech Stack

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

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:5173 and proxies `/api` requests to the Rails server on port 3000. Make sure the server is running first — see [server/README.md](../server/README.md).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR (port 5173) |
| `npm run build` | Type-check and production build |
| `npm run lint` | Run ESLint |
| `npx vitest` | Run tests |
| `npx vitest --watch` | Run tests in watch mode |

## Project Structure

```
src/
  api/          # Axios client + per-resource API modules
  components/   # Reusable UI components (modals, cards, etc.)
  hooks/        # React Query hooks (useExercises, useSessions, etc.)
  pages/        # Route-level page components
  test/         # Test setup (setup.ts)
  types/        # TypeScript interfaces (mirrors API response shapes)
```

## Key Files

- **`vite.config.ts`** — Dev server config with API proxy to `localhost:3000` and Vitest setup
- **`src/api/client.ts`** — Axios instance with base URL `/api/v1` and error handling
- **`src/types/index.ts`** — TypeScript interfaces that mirror the API response shapes. Update these when changing API responses.

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Overview with session summary |
| `/exercises` | Exercise Library | Browse and manage exercises |
| `/exercises/:id` | Exercise Detail | View exercise metrics |
| `/templates` | Templates | List and create workout templates |
| `/templates/:id` | Template Detail | View template with exercises, start workout |
| `/workout/:id` | Active Workout | Log a workout session with timer |
| `/history` | History | Browse past sessions |
| `/history/:id` | Session Detail | Review a completed session |
| `/progress` | Progress | Charts showing performance over time |

## Conventions

- Functional components with hooks only — no class components
- All server state goes through React Query (see `src/hooks/`)
- Tailwind utility classes for styling — no CSS modules
- TypeScript strict mode is enabled
