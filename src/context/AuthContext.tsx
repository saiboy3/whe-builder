import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useMsal } from '@azure/msal-react'
import { LOGIN_SCOPES } from '../lib/msalConfig'

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
  loginWithMicrosoft: () => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function storeSession(token: string, user: AuthUser) {
  localStorage.setItem('whe_token', token)
  localStorage.setItem('whe_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('whe_token')
  localStorage.removeItem('whe_user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance: msalInstance } = useMsal()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore persisted session
    const stored = localStorage.getItem('whe_token')
    const storedUser = localStorage.getItem('whe_user')
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
    }

    // Handle MSAL redirect response (popup callback)
    msalInstance.handleRedirectPromise().catch(() => {}).finally(() => setIsLoading(false))
  }, [msalInstance])

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(err.error ?? 'Login failed')
    }
    const data = await res.json()
    setToken(data.token)
    setUser(data.user)
    storeSession(data.token, data.user)
  }

  async function loginWithMicrosoft() {
    // Use popup so the app doesn't need a dedicated redirect page
    const result = await msalInstance.loginPopup(LOGIN_SCOPES)

    // Exchange the Microsoft access token for our JWT
    const res = await fetch('/api/auth/microsoft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: result.accessToken,
        idToken: result.idToken,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Microsoft login failed' }))
      throw new Error(err.error ?? 'Microsoft login failed')
    }

    const data = await res.json()
    setToken(data.token)
    setUser(data.user)
    storeSession(data.token, data.user)
  }

  function logout() {
    setToken(null)
    setUser(null)
    clearSession()
    // Also sign out of Microsoft if they used SSO
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      msalInstance.logoutPopup({ account: accounts[0] }).catch(() => {})
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithMicrosoft, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
