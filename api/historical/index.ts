import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { requireAuth, cors } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { discipline, projectType, district, summary } = req.query

    if (summary === 'variance') {
      const metrics = await prisma.historicalProjectMetric.findMany()
      const map: Record<string, { estimated: number; actual: number; count: number }> = {}
      for (const m of metrics) {
        if (!map[m.discipline]) map[m.discipline] = { estimated: 0, actual: 0, count: 0 }
        map[m.discipline].estimated += m.estimatedHours
        map[m.discipline].actual += m.actualHours
        map[m.discipline].count += 1
      }
      return res.json(Object.entries(map).map(([discipline, d]) => ({
        discipline,
        estimatedHours: d.estimated,
        actualHours: d.actual,
        variance: d.actual - d.estimated,
        variancePct: d.estimated > 0 ? ((d.actual - d.estimated) / d.estimated) * 100 : 0,
        count: d.count,
      })))
    }

    const metrics = await prisma.historicalProjectMetric.findMany({
      where: {
        ...(discipline ? { discipline: String(discipline) } : {}),
        ...(projectType ? { projectType: String(projectType) } : {}),
        ...(district ? { district: String(district) } : {}),
      },
      orderBy: { completedAt: 'desc' },
    })
    return res.json(metrics)
  }

  return res.status(405).end()
}
