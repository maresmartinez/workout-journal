import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'

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
