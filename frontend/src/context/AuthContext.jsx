import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('pg_user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  const save = (token, u) => {
    localStorage.setItem('pg_token', token)
    localStorage.setItem('pg_user', JSON.stringify(u))
    setUser(u)
  }

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    save(data.token, data.user)
    return data.user
  }, [])

  const register = useCallback(async form => {
    const { data } = await api.post('/auth/register', form)
    save(data.token, data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('pg_token')
    localStorage.removeItem('pg_user')
    setUser(null)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('pg_token')) {
      api.get('/auth/me').then(({ data }) => {
        localStorage.setItem('pg_user', JSON.stringify(data.user))
        setUser(data.user)
      }).catch(() => {})
    }
    const onLogout = () => setUser(null)
    window.addEventListener('pg-logout', onLogout)
    return () => window.removeEventListener('pg-logout', onLogout)
  }, [])

  const value = useMemo(() => ({
    user, login, register, logout,
    isCustomer: user?.role === 'customer',
    isStaff: ['pharmacist', 'delivery', 'admin'].includes(user?.role),
  }), [user, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const homeFor = user => (!user ? '/login' : user.role === 'customer' ? '/orders' : '/staff')