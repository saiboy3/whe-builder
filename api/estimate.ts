import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth, cors } from './_lib/auth'
import { prisma } from './_lib/prisma'

const client = new Anthropic()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  const user = requireAuth(req, res)
  if (!user) return

  const { projectType, district, description, complexity, roadMiles, bridges, intersections, phases } = req.body

  // Pull similar historical projects for context
  let historicalContext = ''
  try {
    const similar = await prisma.historicalProjectMetric.findMany({
      where: { projectType: { contains: projectType?.split(' ')[0] ?? '', mode: 'insensitive' } },
      orderBy: { completedAt: 'desc' },
      take: 8,
    })
    if (similar.length > 0) {
      historicalContext = `\n\nHISTORICAL PROJECT DATA (actual hours from completed similar projects):\n` +
        similar.map(m => `- ${m.projectName} (${m.district}): ${m.discipline} / ${m.taskName} / ${m.staffCategory}: estimated ${m.estimatedHours}h, actual ${m.actualHours}h (${m.variance >= 0 ? '+' : ''}${m.variance}h variance)`).join('\n')
    }
  } catch {
    // DB not available — proceed without historical context
  }

  const prompt = `You are a senior civil engineering estimator with 20+ years of experience on MassDOT projects in Massachusetts. Your job is to produce a detailed work hour estimate for a new project.

PROJECT DETAILS:
- Type: ${projectType ?? 'Not specified'}
- District: ${district ?? 'Not specified'}
- Description: ${description ?? 'Not specified'}
- Complexity: ${complexity ?? 3}/5
- Road miles: ${roadMiles ?? 'N/A'}
- Bridges: ${bridges ?? 0}
- Intersections: ${intersections ?? 0}
- Phases to estimate: ${(phases ?? ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E']).join(', ')}
${historicalContext}

MassDOT STAFF CATEGORIES AND TYPICAL RATES:
- Principal ($225/hr)
- Project Manager ($185/hr)
- Senior Engineer ($160/hr)
- Engineer ($130/hr)
- Designer ($110/hr)
- CADD ($95/hr)
- Clerical ($75/hr)

MassDOT STANDARD DISCIPLINES: Roadway, Traffic, Structures, Hydraulics/Drainage, Utilities, Environmental, Survey, Right-of-Way, Construction Support

Your response MUST be valid JSON matching this exact schema:
{
  "summary": "2-3 sentence summary of the estimate rationale",
  "confidenceScore": 0-100,
  "totalEstimatedHours": number,
  "disciplines": [
    {
      "discipline": string,
      "tasks": [
        {
          "phase": "Preliminary Design" | "25% Design" | "75% Design" | "100% / PS&E",
          "taskName": string,
          "hours": {
            "Principal": number,
            "Project Manager": number,
            "Senior Engineer": number,
            "Engineer": number,
            "Designer": number,
            "CADD": number,
            "Clerical": number
          },
          "lowHours": number,
          "likelyHours": number,
          "highHours": number,
          "rationale": string
        }
      ]
    }
  ],
  "riskFlags": ["string"],
  "similarProjects": ["string"],
  "assumptions": ["string"]
}

Be specific, realistic, and base your estimates on MassDOT norms. If complexity is high, increase hours proportionally. Include only the disciplines relevant to this project type. Return ONLY the JSON object, no markdown.`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim()
    const estimate = JSON.parse(clean)
    return res.json(estimate)
  } catch (err: any) {
    console.error('Estimation error:', err)
    return res.status(500).json({ error: 'Estimation failed', detail: err.message })
  }
}
