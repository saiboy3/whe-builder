import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { requireAuth, cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const user = requireAuth(req, res)
  if (!user) return
  const { projectId } = req.query as { projectId: string }

  if (req.method === 'GET') {
    const steps = await prisma.approvalStep.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return res.json(steps)
  }

  // POST: action = submit | approve | reject
  if (req.method === 'POST') {
    const { action, comments } = req.body
    let newStatus: string

    if (action === 'submit') newStatus = 'SUBMITTED'
    else if (action === 'approve') newStatus = user.role === 'PM' ? 'PM_APPROVED' : 'PRINCIPAL_APPROVED'
    else if (action === 'reject') newStatus = 'REJECTED'
    else return res.status(400).json({ error: 'Invalid action' })

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { approvalStatus: newStatus as any },
    })
    await prisma.approvalStep.create({
      data: { projectId, userId: user.id, stage: user.role, status: newStatus as any, comments: comments ?? '' },
    })
    return res.json(project)
  }

  return res.status(405).end()
}
