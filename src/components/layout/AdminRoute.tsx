import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useIsAdmin } from '@/hooks/useAdmin'

// Nested inside ProtectedRoute (so a session already exists) — this only
// adds the admin_users check. Redirects quietly to the dashboard rather than
// showing a 403 page, since a non-admin reaching this route is almost always
// someone guessing a URL, not an error to explain.
export function AdminRoute() {
  const { data: isAdmin, isLoading } = useIsAdmin()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
