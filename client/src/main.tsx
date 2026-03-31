import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/exercises', element: <ExerciseLibrary /> },
      { path: '/exercises/:id', element: <ExerciseDetail /> },
      { path: '/templates', element: <Templates /> },
      { path: '/templates/:id', element: <TemplateDetail /> },
      { path: '/workout/draft', element: <ActiveWorkout /> },
      { path: '/history', element: <History /> },
      { path: '/history/:id', element: <SessionDetail /> },
      { path: '/progress', element: <Progress /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
