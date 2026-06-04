import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { requireAuth, cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const templates = await prisma.wBSTemplate.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json(templates)
  }

  if (req.method === 'POST') {
    const { name, description } = req.body
    const template = await prisma.wBSTemplate.create({ data: { name, description: description ?? '' } })
    return res.status(201).json(template)
  }

  return res.status(405).end()
}
