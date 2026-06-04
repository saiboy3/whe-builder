import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { cors } from '../_lib/auth'

// Demo users — always available, no DB required
const DEMO_USERS: Record<string, { id: string; name: string; email: string; role: string; password: string }> = {
  'principal@firma.com':  { id: 'demo-1', name: 'James Whitfield', email: 'principal@firma.com',  role: 'PRINCIPAL', password: 'password' },
  'sarah@firma.com':      { id: 'demo-2', name: 'Sarah Chen',      email: 'sarah@firma.com',      role: 'PM',        password: 'password' },
  'mike@firma.com':       { id: 'demo-3', name: 'Mike Torres',     email: 'mike@firma.com',       role: 'PM',        password: 'password' },
  'lisa@firma.com':       { id: 'demo-4', name: 'Lisa Park',       email: 'lisa@firma.com',       role: 'ENGINEER',  password: 'password' },
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'whe-builder-dev-secret'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // 1. Check demo users first (always works, no DB needed)
  const demo = DEMO_USERS[email.toLowerCase().trim()]
  if (demo && password === demo.password) {
    const token = jwt.sign(
      { id: demo.id, email: demo.email, role: demo.role, name: demo.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
    return res.json({ token, user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role } })
  }

  // 2. Try DB if configured
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('../_lib/prisma')
      const bcrypt = await import('bcryptjs')
      const user = await prisma.user.findUnique({ where: { email } })
      if (user && await bcrypt.compare(password, user.passwordHash)) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          JWT_SECRET,
          { expiresIn: '8h' }
        )
        return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
      }
    } catch {
      // DB unavailable — fall through to 401
    }
  }

  return res.status(401).json({ error: 'Invalid email or password' })
}
