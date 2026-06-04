import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { requireAuth, cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const user = requireAuth(req, res)
  if (!user) return
  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pm: { select: { id: true, name: true } },
        wbsItems: { include: { hourEntries: true }, orderBy: { sortOrder: 'asc' } },
        approvalSteps: { include: { user: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
        exportLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
    if (!project) return res.status(404).json({ error: 'Not found' })
    return res.json(project)
  }

  if (req.method === 'PUT') {
    const project = await prisma.project.update({ where: { id }, data: req.body })
    return res.json(project)
  }

  if (req.method === 'DELETE') {
    await prisma.project.delete({ where: { id } })
    return res.status(204).end()
  }

  return res.status(405).end()
}
