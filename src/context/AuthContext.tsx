import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Client-side fallback — works in dev and when DB isn't connected
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string }> = {
  'principal@firma.com': { id: 'demo-1', name: 'James Whitfield', email: 'principal@firma.com', role: 'PRINCIPAL' },
  'sarah@firma.com':     { id: 'demo-2', name: 'Sarah Chen',      email: 'sarah@firma.com',     role: 'PM' },
  'mike@firma.com':      { id: 'demo-3', name: 'Mike Torres',     email: 'mike@firma.com',      role: 'PM' },
  'lisa@firma.com':      { id: 'demo-4', name: 'Lisa Park',       email: 'lisa@firma.com',      role: 'ENGINEER' },
}

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('whe_token')
    const storedUser = localStorage.getItem('whe_user')
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const key = email.toLowerCase().trim()

    // Try the API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('whe_token', data.token)
        localStorage.setItem('whe_user', JSON.stringify(data.user))
        return
      }
      // API returned an error (e.g. wrong password from DB)
      const err = await res.json().catch(() => ({ error: 'Invalid email or password' }))
      // If the API is up but creds are wrong, don't fall through to demo check
      if (res.status === 401 && !DEMO_USERS[key]) {
        throw new Error(err.error ?? 'Invalid email or password')
      }
    } catch (fetchErr: any) {
      // Only swallow network errors (API not running locally) — rethrow auth errors
      if (fetchErr.message && !fetchErr.message.includes('fetch')) throw fetchErr
    }

    // Client-side fallback for demo accounts
    const demo = DEMO_USERS[key]
    if (demo && password === 'password') {
      const fakeToken = btoa(JSON.stringify(demo))
      setToken(fakeToken)
      setUser(demo)
      localStorage.setItem('whe_token', fakeToken)
      localStorage.setItem('whe_user', JSON.stringify(demo))
      return
    }

    throw new Error('Invalid email or password')
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('whe_token')
    localStorage.removeItem('whe_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
