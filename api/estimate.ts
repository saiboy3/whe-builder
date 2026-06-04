import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAuth, cors } from './_lib/auth'

// Rules-based baseline hours: [Principal, PM, Sr.Eng, Eng, Designer, CADD, Clerical]
const BASELINE: Record<string, Record<string, number[]>> = {
  'Roadway Reconstruction': {
    'Preliminary Design': [4, 8, 20, 32, 8, 8, 4],
    '25% Design':         [4, 12, 32, 64, 32, 48, 4],
    '75% Design':         [6, 16, 48, 96, 56, 80, 6],
    '100% / PS&E':        [8, 16, 32, 48, 24, 48, 12],
  },
  'Bridge Rehabilitation': {
    'Preliminary Design': [4, 8, 32, 48, 8, 0, 4],
    '25% Design':         [4, 12, 48, 80, 24, 40, 4],
    '75% Design':         [6, 16, 64, 120, 40, 64, 6],
    '100% / PS&E':        [8, 16, 40, 64, 24, 48, 12],
  },
  'Intersection Safety': {
    'Preliminary Design': [2, 6, 16, 24, 4, 4, 2],
    '25% Design':         [2, 8, 20, 40, 16, 24, 2],
    '75% Design':         [4, 10, 28, 56, 24, 40, 4],
    '100% / PS&E':        [4, 10, 20, 32, 16, 32, 8],
  },
  'Drainage Improvement': {
    'Preliminary Design': [2, 6, 16, 28, 4, 4, 2],
    '25% Design':         [2, 8, 24, 48, 16, 24, 2],
    '75% Design':         [4, 10, 32, 64, 24, 40, 4],
    '100% / PS&E':        [4, 8, 20, 32, 12, 24, 6],
  },
}

const DEFAULT_BASELINE = {
  'Preliminary Design': [3, 8, 20, 32, 8, 8, 4],
  '25% Design':         [4, 10, 28, 56, 24, 40, 4],
  '75% Design':         [5, 14, 40, 80, 40, 64, 6],
  '100% / PS&E':        [6, 12, 28, 40, 20, 40, 10],
}

const STAFF = ['Principal', 'Project Manager', 'Senior Engineer', 'Engineer', 'Designer', 'CADD', 'Clerical']

const DISCIPLINE_MAP: Record<string, string[]> = {
  'Roadway Reconstruction': ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Utilities', 'Environmental', 'Survey'],
  'Bridge Rehabilitation':  ['Structures', 'Hydraulics/Drainage', 'Survey'],
  'Intersection Safety':    ['Traffic', 'Roadway', 'Utilities'],
  'Drainage Improvement':   ['Hydraulics/Drainage', 'Roadway', 'Environmental'],
  'Corridor Study':         ['Roadway', 'Traffic', 'Environmental'],
  'Resurfacing':            ['Roadway', 'Survey'],
  'Signal Upgrade':         ['Traffic', 'Utilities'],
}

const TASK_MAP: Record<string, Record<string, string[]>> = {
  Roadway: {
    'Preliminary Design': ['Data Collection & Site Visit', 'Conceptual Layout'],
    '25% Design':         ['Horizontal Alignment', 'Vertical Profile', 'Superelevation'],
    '75% Design':         ['Final Roadway Design', 'Cross-Section Development', 'Earthwork Calculations', 'Pavement Design'],
    '100% / PS&E':        ['Final Plans', 'Specifications', 'Cost Estimates', 'QA/QC'],
  },
  Traffic: {
    'Preliminary Design': ['Existing Conditions Analysis'],
    '25% Design':         ['Traffic Analysis', 'Signal Warrant Study'],
    '75% Design':         ['Signal Design', 'Signing & Marking'],
    '100% / PS&E':        ['Final Signal Plans', 'Traffic Control Plans'],
  },
  Structures: {
    'Preliminary Design': ['Bridge Inspection Review', 'Conceptual Repair Strategy'],
    '25% Design':         ['Structural Analysis', 'Preliminary Drawings'],
    '75% Design':         ['Final Structural Design', 'Load Rating'],
    '100% / PS&E':        ['Final Structural Plans', 'Bridge Specifications', 'QA/QC'],
  },
  'Hydraulics/Drainage': {
    'Preliminary Design': ['Drainage Inventory'],
    '25% Design':         ['Initial Drainage Design', 'Culvert Analysis'],
    '75% Design':         ['Final Drainage Design', 'Stormwater Management'],
    '100% / PS&E':        ['Final Drainage Plans'],
  },
  Utilities: {
    '25% Design':  ['Utility Identification'],
    '75% Design':  ['Utility Coordination', 'Utility Relocation Plans'],
    '100% / PS&E': ['Final Utility Plans'],
  },
  Environmental: {
    'Preliminary Design': ['Environmental Screening', 'Wetland Delineation'],
    '25% Design':         ['Environmental Permitting'],
    '100% / PS&E':        ['Mitigation Planning'],
  },
  Survey: {
    'Preliminary Design': ['Survey Coordination', 'Control Survey'],
    '25% Design':         ['Topographic Survey'],
  },
}

function buildRulesEstimate(
  projectType: string,
  complexity: number,
  phases: string[]
) {
  const multiplier = 0.6 + (complexity - 1) * 0.2 // 0.6x to 1.4x
  const disciplines = DISCIPLINE_MAP[projectType] ?? ['Roadway', 'Traffic']
  const phaseBaselines = BASELINE[projectType] ?? DEFAULT_BASELINE

  const disciplineResults = disciplines.map(disc => {
    const tasks = phases.flatMap(phase => {
      const taskNames = TASK_MAP[disc]?.[phase]
      if (!taskNames) return []
      const base = phaseBaselines[phase] ?? DEFAULT_BASELINE[phase as keyof typeof DEFAULT_BASELINE] ?? [2, 4, 8, 16, 8, 12, 2]
      // Spread phase hours across tasks for this discipline
      const taskCount = taskNames.length
      const scale = disciplines.indexOf(disc) === 0 ? 1 : 0.4 // primary discipline gets full hours
      return taskNames.map((taskName, ti) => {
        const hrs = base.map(h => Math.round((h * multiplier * scale) / taskCount * (ti === 0 ? 1.3 : 0.85)))
        const likely = hrs.reduce((s, v) => s + v, 0)
        return {
          phase,
          taskName,
          hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
          lowHours: Math.round(likely * 0.8),
          likelyHours: likely,
          highHours: Math.round(likely * 1.3),
          rationale: `Standard MassDOT baseline for ${disc} — ${phase}`,
        }
      })
    })
    return { discipline: disc, tasks }
  })

  const total = disciplineResults.flatMap(d => d.tasks).reduce((s, t) => s + t.likelyHours, 0)

  return {
    summary: `Rules-based estimate for a ${projectType} project in ${projectType} at complexity ${complexity}/5. Hours scaled from MassDOT standard baselines. Connect an ANTHROPIC_API_KEY for AI-powered estimates with full rationale.`,
    confidenceScore: 65,
    totalEstimatedHours: total,
    disciplines: disciplineResults,
    riskFlags: complexity >= 4 ? ['High complexity — consider adding 20–30% contingency'] : [],
    similarProjects: [],
    assumptions: [
      'Based on MassDOT standard WBS baselines',
      'Complexity multiplier applied uniformly across all disciplines',
      'Add ANTHROPIC_API_KEY to Vercel environment for AI-powered estimates',
    ],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  const user = requireAuth(req, res)
  if (!user) return

  const { projectType, district, description, complexity = 3, roadMiles, bridges, intersections, phases } = req.body
  const selectedPhases: string[] = phases ?? ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E']

  // If no API key configured, return rules-based estimate immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json(buildRulesEstimate(projectType ?? 'Roadway Reconstruction', Number(complexity), selectedPhases))
  }

  // Pull similar historical projects for Claude context
  let historicalContext = ''
  try {
    const { prisma } = await import('./_lib/prisma')
    const similar = await prisma.historicalProjectMetric.findMany({
      where: { projectType: { contains: (projectType ?? '').split(' ')[0], mode: 'insensitive' } },
      orderBy: { completedAt: 'desc' },
      take: 8,
    })
    if (similar.length > 0) {
      historicalContext = '\n\nHISTORICAL PROJECT DATA (actual hours from completed similar projects):\n' +
        similar.map(m =>
          `- ${m.projectName} (${m.district}): ${m.discipline} / ${m.taskName} / ${m.staffCategory}: ` +
          `estimated ${m.estimatedHours}h, actual ${m.actualHours}h (${m.variance >= 0 ? '+' : ''}${m.variance}h variance)`
        ).join('\n')
    }
  } catch { /* DB not available */ }

  const prompt = `You are a senior civil engineering estimator with 20+ years of MassDOT project experience in Massachusetts. Produce a detailed work hour estimate.

PROJECT DETAILS:
- Type: ${projectType ?? 'Not specified'}
- District: ${district ?? 'Not specified'}
- Description: ${description ?? 'Not specified'}
- Complexity: ${complexity}/5
- Road miles: ${roadMiles ?? 'N/A'}, Bridges: ${bridges ?? 0}, Intersections: ${intersections ?? 0}
- Phases: ${selectedPhases.join(', ')}
${historicalContext}

Staff categories (use exact names): Principal, Project Manager, Senior Engineer, Engineer, Designer, CADD, Clerical
Disciplines (use exact names): Roadway, Traffic, Structures, Hydraulics/Drainage, Utilities, Environmental, Survey, Right-of-Way, Construction Support

Return ONLY valid JSON — no markdown, no explanation outside JSON:
{
  "summary": "2-3 sentence rationale",
  "confidenceScore": 0-100,
  "totalEstimatedHours": number,
  "disciplines": [
    {
      "discipline": string,
      "tasks": [
        {
          "phase": string,
          "taskName": string,
          "hours": { "Principal": n, "Project Manager": n, "Senior Engineer": n, "Engineer": n, "Designer": n, "CADD": n, "Clerical": n },
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
}`

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim()
    return res.json(JSON.parse(clean))
  } catch (err: any) {
    console.error('Claude estimation error:', err)
    // Fall back to rules-based rather than showing an error
    return res.json({
      ...buildRulesEstimate(projectType ?? 'Roadway Reconstruction', Number(complexity), selectedPhases),
      summary: `Rules-based fallback estimate (Claude API error: ${err.message?.slice(0, 80)}). Add a valid ANTHROPIC_API_KEY in Vercel environment variables for AI estimates.`,
    })
  }
}
