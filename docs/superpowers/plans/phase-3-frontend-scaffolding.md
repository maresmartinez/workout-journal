# Phase 3: React Frontend Scaffolding, Shared Components, API Client, Types

**Goal:** Initialize React TypeScript SPA with Vite, set up routing, Tailwind CSS, API client, TypeScript types, and shared UI components.

**Verification:** `cd client && npm run build && npm run lint` passes.

---

## Task 1: Initialize React App with Vite

**Files:**
- Create: `client/` (entire React app skeleton)

- [ ] **Step 1: Scaffold React TypeScript app with Vite**

```bash
npm create vite@latest client -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
cd client && npm install react-router-dom axios @tanstack/react-query recharts
```

- [ ] **Step 3: Install dev dependencies**

```bash
cd client && npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/react-router-dom eslint prettier
```

- [ ] **Step 4: Configure Tailwind CSS**

Replace `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

Replace `client/src/index.css`:

```css
@import 'tailwindcss';
```

- [ ] **Step 5: Configure Vitest**

Add to `client/vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

Create `client/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Verify build works**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 7: Commit**

```bash
git add client/ && git commit -m "chore: initialize React TypeScript app with Vite, Tailwind, Vitest"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `client/src/types/index.ts`

- [ ] **Step 1: Create type definitions**

Create `client/src/types/index.ts`:

```typescript
export interface ExerciseMetric {
  id: number
  name: string
  metric_type: 'integer' | 'decimal' | 'text'
  unit: string | null
  required: boolean
}

export interface Exercise {
  id: number
  name: string
  description: string | null
  exercise_type: 'built_in' | 'custom'
  exercise_metrics: ExerciseMetric[]
  created_at: string
  updated_at: string
}

export interface WorkoutTemplateExercise {
  id: number
  exercise_id: number
  position: number
  notes: string | null
  exercise?: Exercise
}

export interface WorkoutTemplate {
  id: number
  name: string
  description: string | null
  workout_template_exercises: WorkoutTemplateExercise[]
  created_at: string
  updated_at: string
}

export interface SessionExerciseLog {
  id: number
  session_exercise_id: number
  values: Record<string, string | number | null>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SessionExercise {
  id: number
  workout_session_id: number
  exercise_id: number
  position: number
  notes: string | null
  exercise?: Exercise
  session_exercise_logs: SessionExerciseLog[]
}

export interface WorkoutSession {
  id: number
  name: string | null
  started_at: string
  ended_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned'
  session_exercises?: SessionExercise[]
  created_at: string
  updated_at: string
}

export interface ProgressDataPoint {
  date: string
  values: Record<string, string | number | null>
  session_id: number
}

export interface ExerciseProgress {
  exercise_id: number
  exercise_name: string
  data_points: ProgressDataPoint[]
}

export interface SessionSummary {
  total_sessions: number
  completed_sessions: number
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/types/ && git commit -m "feat: add TypeScript type definitions for all API resources"
```

---

## Task 3: API Client

**Files:**
- Create: `client/src/api/client.ts`
- Create: `client/src/api/exercises.ts`
- Create: `client/src/api/templates.ts`
- Create: `client/src/api/sessions.ts`
- Create: `client/src/api/progress.ts`
- Create: `client/src/api/types.ts`

- [ ] **Step 1: Create Axios base client**

Create `client/src/api/client.ts`:

```typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
```

- [ ] **Step 2: Create API response helper types**

Create `client/src/api/types.ts`:

```typescript
import type { Exercise, WorkoutTemplate, WorkoutSession, ExerciseProgress, SessionSummary } from '../types'

export interface JsonApiData<T> {
  id: string
  type: string
  attributes: T
}

export interface JsonApiResponse<T> {
  data: JsonApiData<T> | JsonApiData<T>[]
  included?: JsonApiData<unknown>[]
}

export interface ExercisesResponse {
  data: JsonApiData<Exercise>[]
  included?: JsonApiData<unknown>[]
}

export interface ExerciseResponse {
  data: JsonApiData<Exercise>
  included?: JsonApiData<unknown>[]
}

export interface TemplatesResponse {
  data: JsonApiData<WorkoutTemplate>[]
  included?: JsonApiData<unknown>[]
}

export interface TemplateResponse {
  data: JsonApiData<WorkoutTemplate>
  included?: JsonApiData<unknown>[]
}

export interface SessionsResponse {
  data: JsonApiData<WorkoutSession>[]
  included?: JsonApiData<unknown>[]
}

export interface SessionResponse {
  data: JsonApiData<WorkoutSession>
  included?: JsonApiData<unknown>[]
}
```

- [ ] **Step 3: Create exercises API**

Create `client/src/api/exercises.ts`:

```typescript
import apiClient from './client'
import type { Exercise } from '../types'
import type { ExercisesResponse, ExerciseResponse } from './types'

function extractExercise(data: ExerciseResponse): Exercise {
  const attrs = data.data.attributes
  const metrics = (data.included || [])
    .filter((inc) => inc.type === 'exercise_metric')
    .map((inc) => inc.attributes as Exercise['exercise_metrics'][0])

  return { ...attrs, id: Number(data.data.id), exercise_metrics: metrics }
}

export async function getExercises(): Promise<Exercise[]> {
  const res = await apiClient.get<ExercisesResponse>('/exercises')
  return res.data.data.map((item) => {
    const attrs = item.attributes
    const metrics = (res.data.included || [])
      .filter((inc) => String(inc.id) !== String(item.id) && inc.type === 'exercise_metric')
      .map((inc) => inc.attributes as Exercise['exercise_metrics'][0])
    return { ...attrs, id: Number(item.id), exercise_metrics: metrics }
  })
}

export async function getExercise(id: number): Promise<Exercise> {
  const res = await apiClient.get<ExerciseResponse>(`/exercises/${id}`)
  return extractExercise(res.data)
}

export async function createExercise(data: {
  name: string
  description?: string
  exercise_metrics_attributes: Array<{
    name: string
    metric_type: string
    unit?: string
    required?: boolean
  }>
}): Promise<Exercise> {
  const res = await apiClient.post<ExerciseResponse>('/exercises', { exercise: data })
  return extractExercise(res.data)
}

export async function updateExercise(id: number, data: Partial<{ name: string; description: string }>): Promise<Exercise> {
  const res = await apiClient.put<ExerciseResponse>(`/exercises/${id}`, { exercise: data })
  return extractExercise(res.data)
}

export async function deleteExercise(id: number): Promise<void> {
  await apiClient.delete(`/exercises/${id}`)
}
```

- [ ] **Step 4: Create templates API**

Create `client/src/api/templates.ts`:

```typescript
import apiClient from './client'
import type { WorkoutTemplate } from '../types'
import type { TemplatesResponse, TemplateResponse } from './types'

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const res = await apiClient.get<TemplatesResponse>('/workout_templates')
  return res.data.data.map((item) => ({
    ...item.attributes,
    id: Number(item.id),
    workout_template_exercises: [],
  }))
}

export async function getTemplate(id: number): Promise<WorkoutTemplate> {
  const res = await apiClient.get<TemplateResponse>(`/workout_templates/${id}`)
  const attrs = res.data.data.attributes
  const templateExercises = (res.data.included || [])
    .filter((inc) => inc.type === 'workout_template_exercise')
    .map((inc) => ({
      ...inc.attributes,
      id: Number(inc.id),
    })) as WorkoutTemplate['workout_template_exercises']

  return { ...attrs, id: Number(res.data.data.id), workout_template_exercises: templateExercises }
}

export async function createTemplate(data: {
  name: string
  description?: string
  workout_template_exercises_attributes: Array<{
    exercise_id: number
    position: number
    notes?: string
  }>
}): Promise<WorkoutTemplate> {
  const res = await apiClient.post<TemplateResponse>('/workout_templates', { workout_template: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id), workout_template_exercises: [] }
}

export async function updateTemplate(id: number, data: Partial<{ name: string; description: string; workout_template_exercises_attributes: unknown[] }>): Promise<WorkoutTemplate> {
  const res = await apiClient.put<TemplateResponse>(`/workout_templates/${id}`, { workout_template: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id), workout_template_exercises: [] }
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiClient.delete(`/workout_templates/${id}`)
}
```

- [ ] **Step 5: Create sessions API**

Create `client/src/api/sessions.ts`:

```typescript
import apiClient from './client'
import type { WorkoutSession, SessionExercise, SessionExerciseLog } from '../types'
import type { SessionsResponse, SessionResponse } from './types'

export async function getSessions(): Promise<WorkoutSession[]> {
  const res = await apiClient.get<SessionsResponse>('/workout_sessions')
  return res.data.data.map((item) => ({
    ...item.attributes,
    id: Number(item.id),
  }))
}

export async function getSession(id: number): Promise<WorkoutSession> {
  const res = await apiClient.get<SessionResponse>(`/workout_sessions/${id}`)
  const attrs = res.data.data.attributes
  return { ...attrs, id: Number(res.data.data.id), session_exercises: [] }
}

export async function createSession(data: { name?: string; started_at: string }): Promise<WorkoutSession> {
  const res = await apiClient.post<SessionResponse>('/workout_sessions', { workout_session: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateSession(id: number, data: Partial<{ name: string; status: string; ended_at: string }>): Promise<WorkoutSession> {
  const res = await apiClient.patch<SessionResponse>(`/workout_sessions/${id}`, { workout_session: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function deleteSession(id: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${id}`)
}

export async function getSummary(): Promise<{ total_sessions: number; completed_sessions: number }> {
  const res = await apiClient.get('/workout_sessions/summary')
  return res.data
}

export async function addSessionExercise(sessionId: number, data: { exercise_id: number; position: number; notes?: string }): Promise<SessionExercise> {
  const res = await apiClient.post(`/workout_sessions/${sessionId}/session_exercises`, { session_exercise: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateSessionExercise(sessionId: number, seId: number, data: Partial<{ position: number; notes: string }>): Promise<SessionExercise> {
  const res = await apiClient.put(`/workout_sessions/${sessionId}/session_exercises/${seId}`, { session_exercise: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function removeSessionExercise(sessionId: number, seId: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${sessionId}/session_exercises/${seId}`)
}

export async function createLog(sessionId: number, seId: number, data: { values: Record<string, unknown>; notes?: string }): Promise<SessionExerciseLog> {
  const res = await apiClient.post(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs`, { session_exercise_log: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function updateLog(sessionId: number, seId: number, logId: number, data: { values?: Record<string, unknown>; notes?: string }): Promise<SessionExerciseLog> {
  const res = await apiClient.put(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs/${logId}`, { session_exercise_log: data })
  return { ...res.data.data.attributes, id: Number(res.data.data.id) }
}

export async function deleteLog(sessionId: number, seId: number, logId: number): Promise<void> {
  await apiClient.delete(`/workout_sessions/${sessionId}/session_exercises/${seId}/logs/${logId}`)
}
```

- [ ] **Step 6: Create progress API**

Create `client/src/api/progress.ts`:

```typescript
import apiClient from './client'
import type { ExerciseProgress } from '../types'

export async function getExerciseProgress(exerciseId: number): Promise<ExerciseProgress> {
  const res = await apiClient.get(`/progress/exercises/${exerciseId}`)
  return res.data
}
```

- [ ] **Step 7: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 8: Commit**

```bash
git add client/src/api/ client/src/types/ && git commit -m "feat: add TypeScript types and API client for all endpoints"
```

---

## Task 4: React Router Setup and Shared Components

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/main.tsx`
- Create: `client/src/components/Navbar.tsx`
- Create: `client/src/components/PageHeader.tsx`
- Create: `client/src/components/LoadingSpinner.tsx`
- Create: `client/src/components/ErrorMessage.tsx`
- Create: `client/src/hooks/useExercises.ts`
- Create: `client/src/hooks/useTemplates.ts`
- Create: `client/src/hooks/useSessions.ts`

- [ ] **Step 1: Set up React Router and QueryClient**

Replace `client/src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

- [ ] **Step 2: Set up App with routes**

Replace `client/src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

function Dashboard() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function Exercises() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Exercises</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function ExerciseDetail() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Exercise Detail</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function Templates() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Templates</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function TemplateDetail() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Template Detail</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function ActiveWorkout() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Active Workout</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function History() {
  return <div className="p-6"><h1 className="text-2xl font-bold">History</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function SessionDetail() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Session Detail</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}
function Progress() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Progress</h1><p className="mt-2 text-gray-600">Coming soon</p></div>
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exercises" element={<Exercises />} />
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

- [ ] **Step 3: Create Navbar component**

Create `client/src/components/Navbar.tsx`:

```tsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/templates', label: 'Templates' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
]

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-gray-50 px-4 py-3 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between md:justify-start md:gap-8">
          <NavLink to="/" className="text-lg font-bold text-gray-900">
            Workout Journal
          </NavLink>
          <div className="flex gap-4 md:gap-6 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'font-medium text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create shared UI components**

Create `client/src/components/PageHeader.tsx`:

```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

Create `client/src/components/LoadingSpinner.tsx`:

```tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
    </div>
  )
}
```

Create `client/src/components/ErrorMessage.tsx`:

```tsx
interface ErrorMessageProps {
  message: string
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mx-6 my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  )
}
```

- [ ] **Step 5: Create React Query hooks**

Create `client/src/hooks/useExercises.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExercises, getExercise, createExercise, updateExercise, deleteExercise } from '../api/exercises'
import type { Exercise } from '../types'

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: getExercises,
  })
}

export function useExercise(id: number) {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: () => getExercise(id),
    enabled: !!id,
  })
}

export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Exercise> }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}
```

Create `client/src/hooks/useTemplates.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } from '../api/templates'
import type { WorkoutTemplate } from '../types'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => getTemplate(id),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkoutTemplate> }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
```

Create `client/src/hooks/useSessions.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSessions, getSession, createSession, updateSession, deleteSession, getSummary,
  addSessionExercise, updateSessionExercise, removeSessionExercise,
  createLog, updateLog, deleteLog,
} from '../api/sessions'
import type { WorkoutSession } from '../types'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  })
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => getSession(id),
    enabled: !!id,
  })
}

export function useSessionSummary() {
  return useQuery({
    queryKey: ['sessions', 'summary'],
    queryFn: getSummary,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkoutSession> }) => updateSession(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.id] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useAddSessionExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: { exercise_id: number; position: number; notes?: string } }) => addSessionExercise(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useRemoveSessionExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId }: { sessionId: number; seId: number }) => removeSessionExercise(sessionId, seId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useCreateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, data }: { sessionId: number; seId: number; data: { values: Record<string, unknown>; notes?: string } }) => createLog(sessionId, seId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useUpdateLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, logId, data }: { sessionId: number; seId: number; logId: number; data: { values?: Record<string, unknown>; notes?: string } }) => updateLog(sessionId, seId, logId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}

export function useDeleteLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, seId, logId }: { sessionId: number; seId: number; logId: number }) => deleteLog(sessionId, seId, logId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] })
    },
  })
}
```

- [ ] **Step 6: Verify build**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 7: Commit**

```bash
git add client/src/ && git commit -m "feat: add routing, Navbar, shared components, and React Query hooks"
```

---

## Task 5: Verify Full Frontend Scaffolding

- [ ] **Step 1: Build succeeds**

```bash
cd client && npm run build
```

Expected: builds successfully

- [ ] **Step 2: Dev server starts**

```bash
cd client && timeout 5 npm run dev || true
```

Expected: Vite dev server starts without errors
