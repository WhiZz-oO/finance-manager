import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(username, password)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">💰</div>
          <h1 className="login-title">Finance Manager</h1>
          <p className="login-subtitle">Personal Banking Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                id="login-username"
                type="text"
                className="form-input"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: 36 }}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 40 }}
                required
              />
              <button
                type="button"
                id="btn-toggle-password"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--expense-dim)', border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem',
              color: 'var(--expense-light)', marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Default: admin / finance2026 — change in Settings after login
        </p>
      </div>
    </div>
  )
}
