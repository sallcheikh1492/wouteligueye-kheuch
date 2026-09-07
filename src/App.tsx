import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/ProtectedRoute'
import { AdminRoute } from '@/components/layout/AdminRoute'
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
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Demo from '@/pages/Demo'
import AdminUsers from '@/pages/AdminUsers'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Reachable only via the recovery link Supabase emails; not gated behind PublicOnlyRoute
          because clicking it already creates a temporary session. */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public, no auth state check either way — a demo of the product
          should work identically for a logged-out visitor and a curious
          existing user. */}
      <Route path="/demo" element={<Demo />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/cv-manager" element={<CVManager />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/ai-settings" element={<AISettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
