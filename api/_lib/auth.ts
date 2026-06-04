import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  role: string
  name: string
}

export function getUser(req: VercelRequest): AuthUser | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AuthUser
  } catch {
    return null
  }
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
