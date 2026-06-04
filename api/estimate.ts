import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from './_lib/auth'

// Rules-based baseline hours per phase: [Principal, PM, Sr.Eng, Eng, Designer, CADD, Clerical]
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

const DEFAULT_BASELINE: Record<string, number[]> = {
  'Preliminary Design': [3, 8, 20, 32, 8, 8, 4],
  '25% Design':         [4, 10, 28, 56, 24, 40, 4],
  '75% Design':         [5, 14, 40, 80, 40, 64, 6],
  '100% / PS&E':        [6, 12, 28, 40, 20, 40, 10],
}

const STAFF = ['Principal', 'Project Manager', 'Senior Engineer', 'Engineer', 'Designer', 'CADD', 'Clerical']

const DISCIPLINE_MAP: Record<string, string[]> = {
  'Roadway Reconstruction': ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental'],
  'Bridge Rehabilitation':  ['Structures', 'Hydraulics/Drainage', 'Survey'],
  'Intersection Safety':    ['Traffic', 'Roadway'],
  'Drainage Improvement':   ['Hydraulics/Drainage', 'Roadway', 'Environmental'],
  'Corridor Study':         ['Roadway', 'Traffic', 'Environmental'],
  'Resurfacing':            ['Roadway', 'Survey'],
  'Signal Upgrade':         ['Traffic'],
}

const TASK_MAP: Record<string, Record<string, string[]>> = {
  Roadway: {
    'Preliminary Design': ['Data Collection & Site Visit', 'Conceptual Layout'],
    '25% Design':         ['Horizontal Alignment', 'Vertical Profile'],
    '75% Design':         ['Final Roadway Design', 'Cross-Section Development', 'Earthwork Calculations'],
    '100% / PS&E':        ['Final Plans', 'Specifications', 'Cost Estimates', 'QA/QC'],
  },
  Traffic: {
    'Preliminary Design': ['Existing Conditions Analysis'],
    '25% Design':         ['Traffic Analysis', 'Signal Warrant Study'],
    '75% Design':         ['Signal Design', 'Signing & Marking'],
    '100% / PS&E':        ['Final Signal Plans'],
  },
  Structures: {
    'Preliminary Design': ['Bridge Inspection Review', 'Conceptual Repair Strategy'],
    '25% Design':         ['Structural Analysis', 'Preliminary Drawings'],
    '75% Design':         ['Final Structural Design', 'Load Rating'],
    '100% / PS&E':        ['Final Structural Plans', 'QA/QC'],
  },
  'Hydraulics/Drainage': {
    'Preliminary Design': ['Drainage Inventory'],
    '25% Design':         ['Initial Drainage Design'],
    '75% Design':         ['Final Drainage Design', 'Stormwater Management'],
    '100% / PS&E':        ['Final Drainage Plans'],
  },
  Environmental: {
    'Preliminary Design': ['Environmental Screening'],
    '25% Design':         ['Environmental Permitting'],
  },
  Survey: {
    'Preliminary Design': ['Survey Coordination', 'Control Survey'],
    '25% Design':         ['Topographic Survey'],
  },
}

function buildRulesEstimate(projectType: string, complexity: number, phases: string[]) {
  const multiplier = 0.6 + (complexity - 1) * 0.2
  const disciplines = DISCIPLINE_MAP[projectType] ?? ['Roadway', 'Traffic']
  const phaseBaselines = BASELINE[projectType] ?? DEFAULT_BASELINE

  const disciplineResults = disciplines.map((disc, dIdx) => {
    const scale = dIdx === 0 ? 1 : 0.4
    const tasks = phases.flatMap(phase => {
      const taskNames = TASK_MAP[disc]?.[phase]
      if (!taskNames) return []
      const base = phaseBaselines[phase] ?? DEFAULT_BASELINE[phase] ?? [2, 4, 8, 16, 8, 12, 2]
      return taskNames.map(taskName => {
        const hrs = base.map(h => Math.max(0, Math.round((h * multiplier * scale) / taskNames.length)))
        const likely = hrs.reduce((s, v) => s + v, 0)
        return {
          phase,
          taskName,
          hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
          lowHours: Math.round(likely * 0.8),
          likelyHours: likely,
          highHours: Math.round(likely * 1.3),
          rationale: `MassDOT baseline for ${disc} — ${phase} at complexity ${complexity}/5`,
        }
      })
    })
    return { discipline: disc, tasks }
  })

  const total = disciplineResults.flatMap(d => d.tasks).reduce((s, t) => s + t.likelyHours, 0)

  return {
    summary: `Rules-based estimate for a ${projectType} project at complexity ${complexity}/5 using MassDOT standard baselines. Add ANTHROPIC_API_KEY to Vercel for AI-powered estimates with detailed rationale.`,
    confidenceScore: 65,
    totalEstimatedHours: total,
    disciplines: disciplineResults,
    riskFlags: complexity >= 4 ? ['High complexity — consider adding 20–30% contingency'] : [],
    similarProjects: [],
    assumptions: [
      'Based on MassDOT standard WBS baselines',
      `Complexity multiplier: ${multiplier.toFixed(1)}x`,
      'Add ANTHROPIC_API_KEY in Vercel env vars for AI-powered estimates',
    ],
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const {
    projectType = 'Roadway Reconstruction',
    district = 'Not specified',
    description = '',
    complexity = 3,
    roadMiles = 'N/A',
    bridges = 0,
    intersections = 0,
    phases = ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E'],
  } = req.body ?? {}

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.json(buildRulesEstimate(projectType, Number(complexity), phases))
  }

  const prompt = `You are a senior civil engineering estimator with 20+ years of MassDOT project experience. Produce a detailed work hour estimate.

PROJECT:
- Type: ${projectType}
- District: ${district}
- Description: ${description || 'Not provided'}
- Complexity: ${complexity}/5
- Road miles: ${roadMiles}, Bridges: ${bridges}, Intersections: ${intersections}
- Phases: ${phases.join(', ')}

Staff (use exact names): Principal, Project Manager, Senior Engineer, Engineer, Designer, CADD, Clerical
Disciplines (use exact names): Roadway, Traffic, Structures, Hydraulics/Drainage, Utilities, Environmental, Survey, Right-of-Way, Construction Support

Return ONLY valid JSON, no markdown fences:
{
  "summary": "2-3 sentence rationale",
  "confidenceScore": 75,
  "totalEstimatedHours": 0,
  "disciplines": [
    {
      "discipline": "string",
      "tasks": [
        {
          "phase": "string",
          "taskName": "string",
          "hours": { "Principal": 0, "Project Manager": 0, "Senior Engineer": 0, "Engineer": 0, "Designer": 0, "CADD": 0, "Clerical": 0 },
          "lowHours": 0,
          "likelyHours": 0,
          "highHours": 0,
          "rationale": "string"
        }
      ]
    }
  ],
  "riskFlags": [],
  "similarProjects": [],
  "assumptions": []
}`

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic API ${anthropicRes.status}: ${errText.slice(0, 200)}`)
    }

    const anthropicData = await anthropicRes.json() as { content: Array<{ type: string; text: string }> }
    const text = anthropicData.content[0]?.type === 'text' ? anthropicData.content[0].text : ''
    const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim()
    const parsed = JSON.parse(clean)
    return res.json(parsed)
  } catch (err: any) {
    console.error('Claude error:', err?.message ?? err)
    // Fall back to rules rather than showing an error
    return res.json({
      ...buildRulesEstimate(projectType, Number(complexity), phases),
      summary: `Estimate generated using rules-based engine (Claude unavailable: ${String(err?.message ?? '').slice(0, 100)}). Results reflect MassDOT standard baselines.`,
    })
  }
}
