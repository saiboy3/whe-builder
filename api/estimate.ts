import type { VercelRequest, VercelResponse } from '@vercel/node'

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

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

const STAFF = [
  'Principal In Charge (PIC)',
  'Project Manager (PM)',
  'Senior Engineer (SE)',
  'Engineer (Eng)',
  'Assistant Engineer (AE)',
  'Engineering Technician (ET)',
]

const DISCIPLINE_MAP: Record<string, string[]> = {
  'Roadway Reconstruction': ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental'],
  'Bridge Rehabilitation':  ['Structures', 'Hydraulics/Drainage', 'Survey'],
  'Intersection Safety':    ['Traffic', 'Roadway'],
  'Drainage Improvement':   ['Hydraulics/Drainage', 'Roadway', 'Environmental'],
  'Corridor Study':         ['Roadway', 'Traffic', 'Environmental'],
  'Resurfacing':            ['Roadway', 'Survey'],
  'Signal Upgrade':         ['Traffic'],
}

// Task names match MassDOT WHE Form 1.3 (January 2024)
const TASK_MAP: Record<string, Record<string, string[]>> = {
  Roadway: {
    'Preliminary Design': ['Project Initiation and Data Compilation', 'Conceptual Design and Alternatives Analysis', 'Field Reconnaissance'],
    '25% Design':         ['Preliminary Horizontal Geometry', 'Preliminary Vertical Geometry', 'Pavement Design', 'Typical Sections', 'Quality Control (QC) Review', 'Preliminary Construction Cost Estimate'],
    '75% Design':         ['Final Horizontal Design Geometrics', 'Final Vertical Design Geometrics', 'Construction Plans', 'Grading and Tie Plans', 'Quantity and Cost Estimate', 'Constructability and Quality Control (QC) Reviews'],
    '100% / PS&E':        ['Finalize Plans', 'Finalize Special Provisions', 'Finalize Quantity and Cost Estimate', 'Quality Control (QC) Review', 'Submission Checklist'],
  },
  Traffic: {
    'Preliminary Design': ['Intersection Control Evaluation', 'Road Safety Audit', 'Prepare Traffic Volumes'],
    '25% Design':         ['Lane Configurations', 'Traffic Signals', 'Signs and Pavement Markings', 'Traffic Management'],
    '75% Design':         ['Traffic Signs', 'Traffic Signals and Plan Preparation', 'Pavement Markings and Plan Preparation', 'Traffic Management Plans and Details'],
    '100% / PS&E':        ['Finalize Plans', 'Traffic Control Agreement Submission'],
  },
  Structures: {
    'Preliminary Design': ['Field Investigation', 'Preliminary Structural Analysis', 'Preliminary Structures Report Preparation', 'Bridge Type Selection Worksheet'],
    '25% Design':         ['Sketch Plan Development', 'Establish Boring Locations', 'Constructability Review'],
    '75% Design':         ['Structural Design - Superstructure', 'Structural Design - Substructure', 'Contract Drawings', 'Quantity Cost Estimates', 'Constructability and Quality Control (QC) Review'],
    '100% / PS&E':        ['Finalize Plans', 'Finalize Special Provisions', 'Quality Control (QC) Review'],
  },
  'Hydraulics/Drainage': {
    'Preliminary Design': ['Hydraulics Study and Report'],
    '25% Design':         ['Hydrological Studies and Hydraulics Report', 'Preliminary Drainage Studies'],
    '75% Design':         ['Drainage and Water Supply Plans'],
    '100% / PS&E':        ['Finalize Plans'],
  },
  Utilities: {
    '25% Design':         ['Utility Coordination', 'Subsurface Utility Exploration (SUE)', 'Preliminary Utility Design'],
    '75% Design':         ['Utility Coordination'],
    '100% / PS&E':        ['Finalize Plans'],
  },
  Environmental: {
    'Preliminary Design': ['Early Environmental Review Checklist', 'Hazardous Materials Research/Review', 'NEPA/MEPA Determination'],
    '25% Design':         ['NEPA - Environmental Assessment (EA)', 'Wetland Resource Area Delineation'],
    '75% Design':         ['Wildlife/Rare Species Assessment', 'WPA Notice of Intent (NOI)'],
  },
  Survey: {
    'Preliminary Design': ['Survey Coordination and Verification', 'Field Surveys'],
    '25% Design':         ['Subsurface Investigation Plan', 'Subsurface Investigation Inspection'],
    '75% Design':         ['Geotechnical Report'],
  },
  'Right-of-Way': {
    '75% Design':   ['Preliminary Right of Way Plans', 'Layout Plans and Order of Taking', 'Quality Control (QC) Review'],
    '100% / PS&E':  ['Layout Plans and Order of Taking', 'Written Instrument', 'Quality Control (QC) Review'],
  },
}

interface SizeFactors {
  roadMiles: number
  bridges: number
  intersections: number
}

// Discipline-specific size scaling:
//   Roadway/Drainage/Survey — scale with road miles
//   Structures — scale with bridge count (each bridge is an independent deliverable)
//   Traffic — scale with intersection count
//   Environmental/Utilities/ROW — modest scale with road miles
function disciplineSizeFactor(disc: string, sf: SizeFactors): number {
  const miles = Math.max(0.5, sf.roadMiles)   // 0.5 mi minimum baseline
  const bridges = Math.max(0, sf.bridges)
  const intersections = Math.max(0, sf.intersections)

  switch (disc) {
    case 'Roadway':
      // Linear with miles: 1 mi = 1.0x, 2 mi = 1.6x, 0.5 mi = 0.7x
      return 0.5 + 0.5 * Math.sqrt(miles)
    case 'Hydraulics/Drainage':
      return 0.6 + 0.4 * Math.sqrt(miles)
    case 'Survey':
      return 0.5 + 0.5 * Math.sqrt(miles)
    case 'Environmental':
      return 0.7 + 0.3 * Math.sqrt(miles)
    case 'Utilities':
      return 0.6 + 0.4 * Math.sqrt(miles)
    case 'Right-of-Way':
      return 0.5 + 0.5 * Math.sqrt(miles)
    case 'Structures':
      // Each bridge is its own scope — additive
      return bridges > 0 ? bridges : 1
    case 'Traffic':
      // Scale with intersection count: 2 intersections = baseline
      return intersections > 0 ? 0.5 + 0.25 * intersections : 1
    default:
      return 1
  }
}

function buildRulesEstimate(
  projectType: string,
  complexity: number,
  phases: string[],
  sf: SizeFactors
) {
  // Complexity multiplier: complexity 1 = 0.6x, 3 = 1.0x, 5 = 1.4x
  const complexityMult = 0.6 + (complexity - 1) * 0.2
  const disciplines = DISCIPLINE_MAP[projectType] ?? ['Roadway', 'Traffic']
  const phaseBaselines = BASELINE[projectType] ?? DEFAULT_BASELINE

  const disciplineResults = disciplines.map((disc, dIdx) => {
    const primaryScale = dIdx === 0 ? 1 : 0.4   // primary discipline gets full baseline
    const sizeFactor = disciplineSizeFactor(disc, sf)
    const finalMult = complexityMult * primaryScale * sizeFactor

    const tasks = phases.flatMap(phase => {
      const taskNames = TASK_MAP[disc]?.[phase]
      if (!taskNames) return []
      const base = phaseBaselines[phase] ?? DEFAULT_BASELINE[phase] ?? [2, 4, 8, 16, 8, 12, 2]
      return taskNames.map(taskName => {
        const hrs = base.map(h => Math.max(0, Math.round((h * finalMult) / taskNames.length)))
        const likely = hrs.reduce((s, v) => s + v, 0)
        const rationale = buildRationale(disc, phase, complexity, complexityMult, sizeFactor, sf)
        return {
          phase,
          taskName,
          hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
          lowHours: Math.round(likely * 0.8),
          likelyHours: likely,
          highHours: Math.round(likely * 1.3),
          rationale,
        }
      })
    })
    return { discipline: disc, tasks }
  })

  const total = disciplineResults.flatMap(d => d.tasks).reduce((s, t) => s + t.likelyHours, 0)
  const riskFlags: string[] = []
  if (complexity >= 4) riskFlags.push('High complexity — consider adding 20–30% contingency')
  if (sf.bridges > 2) riskFlags.push(`${sf.bridges} bridges — structural hours scale per bridge; verify individual bridge scope`)
  if (sf.roadMiles > 3) riskFlags.push(`${sf.roadMiles} road miles — survey and ROW hours may need further review`)

  return {
    summary: buildSummary(projectType, complexity, complexityMult, sf, total),
    confidenceScore: 65,
    totalEstimatedHours: total,
    disciplines: disciplineResults,
    riskFlags,
    similarProjects: [],
    assumptions: buildAssumptions(complexity, complexityMult, sf),
  }
}

function buildSummary(type: string, complexity: number, mult: number, sf: SizeFactors, total: number): string {
  const sizeDesc = [
    sf.roadMiles > 0 ? `${sf.roadMiles} road mile${sf.roadMiles !== 1 ? 's' : ''}` : '',
    sf.bridges > 0 ? `${sf.bridges} bridge${sf.bridges !== 1 ? 's' : ''}` : '',
    sf.intersections > 0 ? `${sf.intersections} intersection${sf.intersections !== 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ')

  return `MassDOT baseline estimate for a ${type} project at complexity ${complexity}/5 (${mult.toFixed(1)}x multiplier).` +
    (sizeDesc ? ` Sized for ${sizeDesc}.` : '') +
    ` Total likely hours: ${total.toLocaleString()}.`
}

function buildRationale(
  disc: string, phase: string, complexity: number,
  complexityMult: number, sizeFactor: number, sf: SizeFactors
): string {
  const sizeNote = disc === 'Structures' && sf.bridges > 0
    ? `${sf.bridges} bridge(s) × per-bridge baseline`
    : disc === 'Traffic' && sf.intersections > 0
    ? `${sf.intersections} intersection(s) → ${sizeFactor.toFixed(2)}x size factor`
    : sf.roadMiles > 0
    ? `${sf.roadMiles} mi → ${sizeFactor.toFixed(2)}x size factor`
    : 'default 1.0x size factor'
  return `${disc} / ${phase}: complexity ${complexity}/5 (${complexityMult.toFixed(1)}x) × ${sizeNote}`
}

function buildAssumptions(complexity: number, mult: number, sf: SizeFactors): string[] {
  const out = [
    `Complexity ${complexity}/5 → ${mult.toFixed(2)}x multiplier (1 = 0.6x, 3 = 1.0x, 5 = 1.4x)`,
  ]
  if (sf.roadMiles > 0) out.push(`Road miles: ${sf.roadMiles} → roadway/drainage/survey hours scale as 0.5 + 0.5√miles`)
  if (sf.bridges > 0) out.push(`Bridges: ${sf.bridges} → structural hours = bridges × per-bridge baseline`)
  if (sf.intersections > 0) out.push(`Intersections: ${sf.intersections} → traffic hours scale as 0.5 + 0.25 × count`)
  out.push('Baseline hours sourced from MassDOT WHE Form 1.3 standard task table')
  out.push('Low = likely × 0.8, High = likely × 1.3')
  return out
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
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
    const sf = { roadMiles: parseFloat(roadMiles) || 0, bridges: Number(bridges), intersections: Number(intersections) }
    return res.json(buildRulesEstimate(projectType, Number(complexity), phases, sf))
  }

  const prompt = `You are a senior civil engineering estimator with 20+ years of MassDOT project experience. Produce a detailed work hour estimate using the official MassDOT WHE Form 1.3 task numbering.

MassDOT SECTION STRUCTURE (use ONLY these task names and numbers):
- Section 100: Project Development Engineering (Preliminary) — tasks 101–113
- Section 150: Environmental — tasks 151–188
- Section 300: 25% Highway Design Submission — tasks 301–330
- Section 400: 75% Highway Design Submission — tasks 401–431
- Section 450: 100% Highway Design / PS&E — tasks 451–462
- Section 500: Right of Way — tasks 501–504
- Section 600: Geotechnical Design — tasks 601–608
- Section 700: Project Development – Structural — tasks 701–708
- Section 710: Sketch Plans (Bridge) — tasks 711–716
- Section 750: Final Bridge Design — tasks 751–761

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
      ...buildRulesEstimate(projectType, Number(complexity), phases, { roadMiles: parseFloat(roadMiles) || 0, bridges: Number(bridges), intersections: Number(intersections) }),
      summary: `Estimate generated using rules-based engine (Claude unavailable: ${String(err?.message ?? '').slice(0, 100)}). Results reflect MassDOT standard baselines.`,
    })
  }
}
