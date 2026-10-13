import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-6 h-6 border-2 border-neutral-300 border-t-[#003d7a] rounded-full animate-spin" />
    </div>
  )
}

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
