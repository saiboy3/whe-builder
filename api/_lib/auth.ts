import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  role: string
  name: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'whe-builder-dev-secret'

export function getUser(req: VercelRequest): AuthUser | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7)

  // Try real JWT first
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {}

  // Fall back to demo base64 token (client-side fallback when API unavailable)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
    if (decoded?.id && decoded?.email && decoded?.role) return decoded as AuthUser
  } catch {}

  return null
}

export function requireAuth(req: VercelRequest, res: VercelResponse): AuthUser | null {
  const user = getUser(req)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return user
}

export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}
