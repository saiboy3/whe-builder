import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { prisma } from '../_lib/prisma'
import { cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { accessToken, idToken } = req.body
  if (!accessToken && !idToken) {
    return res.status(400).json({ error: 'accessToken or idToken required' })
  }

  try {
    // Use the access token to fetch the user profile from Microsoft Graph
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!graphRes.ok) {
      return res.status(401).json({ error: 'Invalid Microsoft token' })
    }

    const profile = await graphRes.json() as {
      id: string
      displayName: string
      mail: string | null
      userPrincipalName: string
      jobTitle?: string
    }

    const email = profile.mail ?? profile.userPrincipalName
    const name = profile.displayName

    // Map Azure job title / group to role — default to ENGINEER
    // Firms can customize this mapping based on their Azure AD groups
    const titleLower = (profile.jobTitle ?? '').toLowerCase()
    const role = titleLower.includes('principal') ? 'PRINCIPAL'
      : titleLower.includes('project manager') || titleLower.includes('pm') ? 'PM'
      : 'ENGINEER'

    // Upsert user in our DB
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        role: role as any,
        passwordHash: '', // SSO users have no password
      },
    })

    // Issue our own JWT so the rest of the app works identically
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    )

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err: any) {
    console.error('Microsoft auth error:', err)
    return res.status(500).json({ error: 'Authentication failed', detail: err.message })
  }
}
