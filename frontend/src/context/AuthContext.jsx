import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fm_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      localStorage.setItem('fm_token', res.data.access_token)
      localStorage.setItem('fm_user', JSON.stringify({ username: res.data.username }))
      setUser({ username: res.data.username })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('fm_token')
    localStorage.removeItem('fm_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
