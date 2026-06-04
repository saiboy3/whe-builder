import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { requireAuth, cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const projects = await prisma.project.findMany({
      include: { pm: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return res.json(projects)
  }

  if (req.method === 'POST') {
    const { contractNumber, name, description, district, projectType, phase, pmId } = req.body
    const project = await prisma.project.create({
      data: { contractNumber, name, description: description ?? '', district, projectType, phase, pmId },
      include: { pm: { select: { id: true, name: true } } },
    })
    return res.status(201).json(project)
  }

  return res.status(405).end()
}
