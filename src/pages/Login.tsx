import { useState } from 'react'
import { HardHat, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DEMO_USERS = [
  { label: 'Principal', email: 'principal@firma.com' },
  { label: 'PM — Sarah Chen', email: 'sarah@firma.com' },
  { label: 'PM — Mike Torres', email: 'mike@firma.com' },
  { label: 'Engineer', email: 'lisa@firma.com' },
]

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500 rounded-xl">
              <HardHat size={28} className="text-slate-900" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white">WHE Builder</div>
              <div className="text-sm text-slate-400">MassDOT Work Hour Estimation Platform</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@firma.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <LogIn size={17} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo users */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Demo accounts (password: password)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => setEmail(u.email)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                    email === u.email
                      ? 'border-amber-400 bg-amber-50 text-amber-700 font-semibold'
                      : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Phase 1 + 2 + 3 · MassDOT WHE Platform
        </p>
      </div>
    </div>
  )
}
