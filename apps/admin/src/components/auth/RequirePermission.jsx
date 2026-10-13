import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/context/PermissionContext'

export function RequirePermission({ permission, children }) {
  const { can } = usePermissions()

  if (!can(permission)) {
    return <Navigate to="/403" replace />
  }

  return children
}
