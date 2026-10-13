import { createContext, useCallback, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'

const PermissionContext = createContext(null)

export function PermissionProvider({ children }) {
  const { user, hasPermission } = useAuth()

  const can = useCallback(
    (permission) => hasPermission(permission),
    [hasPermission],
  )

  const canAny = useCallback(
    (permissions) => permissions.some((p) => hasPermission(p)),
    [hasPermission],
  )

  const canAll = useCallback(
    (permissions) => permissions.every((p) => hasPermission(p)),
    [hasPermission],
  )

  const value = useMemo(
    () => ({
      user,
      role: user?.role,
      permissions: user?.permissions || [],
      can,
      canAny,
      canAll,
    }),
    [user, can, canAny, canAll],
  )

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) throw new Error('usePermissions deve ser usado dentro de PermissionProvider')
  return context
}

export function usePermission(permission) {
  const { can } = usePermissions()
  return can(permission)
}
