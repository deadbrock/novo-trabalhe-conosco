import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '@/services/authService'
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
} from '@/utils/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(getStoredToken())
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!token && !getStoredRefreshToken()) {
      setUser(null)
      return null
    }
    const { user: fetchedUser } = await authService.getMe()
    setUser(fetchedUser)
    return fetchedUser
  }, [token])

  useEffect(() => {
    async function bootstrap() {
      if (!token && !getStoredRefreshToken()) {
        setLoading(false)
        return
      }
      try {
        await refreshUser()
      } catch {
        clearStoredTokens()
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials)
    setStoredTokens({ token: result.token, refreshToken: result.refreshToken })
    setToken(result.token)
    setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken()
    try {
      if (refreshToken || token) {
        await authService.logout(refreshToken)
      }
    } catch {
      /* encerra sessão local mesmo se API falhar */
    } finally {
      clearStoredTokens()
      setToken(null)
      setUser(null)
    }
  }, [token])

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return user.permissions?.includes(permission) || false
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refreshUser,
      hasPermission,
      setSessionExpired: () => {
        clearStoredTokens()
        setToken(null)
        setUser(null)
      },
    }),
    [user, token, loading, login, logout, refreshUser, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
