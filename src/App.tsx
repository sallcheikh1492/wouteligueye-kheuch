import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import JobDetails from '@/pages/JobDetails'
import Applications from '@/pages/Applications'
import Profile from '@/pages/Profile'
import CVManager from '@/pages/CVManager'
import AISettings from '@/pages/AISettings'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/cv-manager" element={<CVManager />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-settings" element={<AISettings />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
