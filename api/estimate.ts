import type { VercelRequest, VercelResponse } from '@vercel/node'

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// ─── MassDOT staff categories (Form 1.3 / Exhibit A) ───────────────────────
const STAFF = [
  'Principal In Charge (PIC)',
  'Project Manager (PM)',
  'Senior Engineer (SE)',
  'Engineer (Eng)',
  'Assistant Engineer (AE)',
  'Engineering Technician (ET)',
]

// ─── Real MassDOT roadway project types (scraped from projectinfo portal) ──
interface ProjectTypeConfig {
  disciplines: string[]      // Roadway is ALWAYS first — every project needs FDR/DJW/PM/checklists
  baseline: keyof typeof PHASE_BASELINE
  sizeMetric: 'roadMiles' | 'bridges' | 'intersections'
  intensityMult: number      // relative to standard 1-mile reconstruction
  roadwayDesignScale: number // 0.0–1.0: how much physical road design (vs just management tasks)
                             //   1.0 = full horizontal/vertical geometry, construction plans
                             //   0.4 = pavement/resurfacing level geometry
                             //   0.2 = coordination, FDR, DJW, checklists only (bridge, signal, etc.)
}

const PROJECT_TYPES: Record<string, ProjectTypeConfig> = {
  // roadwayDesignScale: 1.0 = full horizontal/vertical geometry + construction plans
  //                    0.5 = geometric work but lighter scope
  //                    0.2 = FDR / DJW / management / checklists only (no new road design)

  // ── Full Reconstruction ──────────────────────────────────────────────────
  'Hwy Reconstr - Restr and Rehab': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental', 'Utilities', 'Right-of-Way'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 1.0, roadwayDesignScale: 1.0,
  },
  'Hwy Reconstr - Major Widening': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental', 'Utilities', 'Right-of-Way'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 1.2, roadwayDesignScale: 1.0,
  },
  'Roadway Modernization': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental', 'Utilities'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 0.85, roadwayDesignScale: 0.9,
  },
  'Roadway Additional Capacity': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental', 'Right-of-Way'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 1.0, roadwayDesignScale: 1.0,
  },
  'Roadway Minor Widening': {
    disciplines: ['Roadway', 'Traffic', 'Survey'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 0.55, roadwayDesignScale: 0.7,
  },
  'New Road': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey', 'Environmental', 'Utilities', 'Right-of-Way'],
    baseline: 'reconstruction', sizeMetric: 'roadMiles', intensityMult: 1.4, roadwayDesignScale: 1.0,
  },
  'Roadway - Reconstr - Sidewalks and Curbing': {
    disciplines: ['Roadway', 'Traffic', 'Survey'],
    baseline: 'modernization', sizeMetric: 'roadMiles', intensityMult: 0.5, roadwayDesignScale: 0.6,
  },
  // ── Intersection ─────────────────────────────────────────────────────────
  'Intersection Reconstruction': {
    disciplines: ['Roadway', 'Traffic', 'Hydraulics/Drainage', 'Survey'],
    baseline: 'intersection', sizeMetric: 'intersections', intensityMult: 1.0, roadwayDesignScale: 0.7,
  },
  'Safety Improvements': {
    disciplines: ['Roadway', 'Traffic', 'Survey'],
    baseline: 'intersection', sizeMetric: 'intersections', intensityMult: 0.7, roadwayDesignScale: 0.4,
  },
  'Traffic Signal Upgrades': {
    disciplines: ['Roadway', 'Traffic'],
    baseline: 'signal', sizeMetric: 'intersections', intensityMult: 1.0, roadwayDesignScale: 0.25,
  },
  'Intelligent Transportation Sys': {
    disciplines: ['Roadway', 'Traffic'],
    baseline: 'signal', sizeMetric: 'intersections', intensityMult: 0.9, roadwayDesignScale: 0.25,
  },
  // ── Bridge ───────────────────────────────────────────────────────────────
  // Even pure bridge projects need Roadway tasks: FDR, DJW, Project Initiation, Checklists
  'Bridge Replacement': {
    disciplines: ['Roadway', 'Structures', 'Hydraulics/Drainage', 'Survey'],
    baseline: 'bridge', sizeMetric: 'bridges', intensityMult: 1.0, roadwayDesignScale: 0.2,
  },
  'Bridge Rehabilitation': {
    disciplines: ['Roadway', 'Structures', 'Hydraulics/Drainage', 'Survey'],
    baseline: 'bridge', sizeMetric: 'bridges', intensityMult: 0.75, roadwayDesignScale: 0.2,
  },
  'Bridge Deck Replacement': {
    disciplines: ['Roadway', 'Structures', 'Survey'],
    baseline: 'bridge', sizeMetric: 'bridges', intensityMult: 0.6, roadwayDesignScale: 0.15,
  },
  'New Bridge': {
    disciplines: ['Roadway', 'Structures', 'Hydraulics/Drainage', 'Survey', 'Environmental'],
    baseline: 'bridge', sizeMetric: 'bridges', intensityMult: 1.3, roadwayDesignScale: 0.3,
  },
  // ── Pavement ─────────────────────────────────────────────────────────────
  'Resurfacing': {
    disciplines: ['Roadway', 'Survey'],
    baseline: 'pavement', sizeMetric: 'roadMiles', intensityMult: 1.0, roadwayDesignScale: 0.4,
  },
  'Resurfacing Interstate': {
    disciplines: ['Roadway', 'Survey'],
    baseline: 'pavement', sizeMetric: 'roadMiles', intensityMult: 1.0, roadwayDesignScale: 0.4,
  },
  'Resurfacing DOT Owned Non-Interstate': {
    disciplines: ['Roadway', 'Survey'],
    baseline: 'pavement', sizeMetric: 'roadMiles', intensityMult: 0.9, roadwayDesignScale: 0.35,
  },
  'Pavement Rehabilitation': {
    disciplines: ['Roadway', 'Survey', 'Hydraulics/Drainage'],
    baseline: 'pavement', sizeMetric: 'roadMiles', intensityMult: 1.1, roadwayDesignScale: 0.5,
  },
  'Limited Access Pavement Preservation': {
    disciplines: ['Roadway'],
    baseline: 'pavement', sizeMetric: 'roadMiles', intensityMult: 0.6, roadwayDesignScale: 0.3,
  },
  // ── Drainage / Culvert ───────────────────────────────────────────────────
  'Drainage': {
    disciplines: ['Roadway', 'Hydraulics/Drainage', 'Environmental'],
    baseline: 'drainage', sizeMetric: 'roadMiles', intensityMult: 1.0, roadwayDesignScale: 0.35,
  },
  'Culvert Replacement': {
    disciplines: ['Roadway', 'Hydraulics/Drainage', 'Structures', 'Survey'],
    baseline: 'drainage', sizeMetric: 'roadMiles', intensityMult: 0.9, roadwayDesignScale: 0.3,
  },
  // ── Active Transportation ────────────────────────────────────────────────
  'Bike Facility Construction': {
    disciplines: ['Roadway', 'Traffic', 'Survey'],
    baseline: 'modernization', sizeMetric: 'roadMiles', intensityMult: 0.55, roadwayDesignScale: 0.6,
  },
  'Shared Use Path Construction': {
    disciplines: ['Roadway', 'Survey', 'Environmental'],
    baseline: 'modernization', sizeMetric: 'roadMiles', intensityMult: 0.6, roadwayDesignScale: 0.6,
  },
  'Sidewalk Construction': {
    disciplines: ['Roadway', 'Survey'],
    baseline: 'modernization', sizeMetric: 'roadMiles', intensityMult: 0.4, roadwayDesignScale: 0.5,
  },
  'Accessibility Improvements': {
    disciplines: ['Roadway', 'Traffic'],
    baseline: 'signal', sizeMetric: 'intersections', intensityMult: 0.5, roadwayDesignScale: 0.3,
  },
  // ── Other ────────────────────────────────────────────────────────────────
  'Targeted Modernization - Multiple Locations': {
    disciplines: ['Roadway', 'Traffic', 'Survey'],
    baseline: 'modernization', sizeMetric: 'roadMiles', intensityMult: 0.7, roadwayDesignScale: 0.5,
  },
}

// ─── Phase baselines per project type family [PIC, PM, SE, Eng, AE, ET] ───
const PHASE_BASELINE: Record<string, Record<string, number[]>> = {
  reconstruction: {
    'Preliminary Design': [4, 8, 20, 32, 8, 8],
    '25% Design':         [4, 12, 32, 64, 32, 48],
    '75% Design':         [6, 16, 48, 96, 56, 80],
    '100% Design':        [8, 16, 32, 48, 24, 48],
    'PS&E':               [4, 8, 12, 16, 8, 12],
  },
  bridge: {
    'Preliminary Design': [4, 8, 32, 48, 8, 0],
    '25% Design':         [4, 12, 48, 80, 24, 40],
    '75% Design':         [6, 16, 64, 120, 40, 64],
    '100% Design':        [8, 16, 40, 64, 24, 48],
    'PS&E':               [4, 8, 12, 16, 8, 12],
  },
  intersection: {
    'Preliminary Design': [2, 6, 16, 24, 4, 4],
    '25% Design':         [2, 8, 20, 40, 16, 24],
    '75% Design':         [4, 10, 28, 56, 24, 40],
    '100% Design':        [4, 10, 20, 32, 16, 32],
    'PS&E':               [2, 6, 8, 12, 4, 8],
  },
  signal: {
    'Preliminary Design': [1, 4, 10, 16, 4, 0],
    '25% Design':         [1, 4, 12, 24, 8, 8],
    '75% Design':         [2, 6, 16, 32, 12, 16],
    '100% Design':        [2, 6, 12, 20, 8, 16],
    'PS&E':               [1, 4, 6, 8, 4, 6],
  },
  pavement: {
    'Preliminary Design': [1, 4, 8, 16, 4, 0],
    '25% Design':         [1, 4, 12, 24, 8, 16],
    '75% Design':         [2, 6, 16, 32, 16, 32],
    '100% Design':        [2, 6, 12, 20, 8, 24],
    'PS&E':               [1, 4, 6, 8, 4, 8],
  },
  drainage: {
    'Preliminary Design': [2, 6, 16, 28, 4, 4],
    '25% Design':         [2, 8, 24, 48, 16, 24],
    '75% Design':         [4, 10, 32, 64, 24, 40],
    '100% Design':        [4, 8, 20, 32, 12, 24],
    'PS&E':               [2, 6, 8, 12, 4, 8],
  },
  modernization: {
    'Preliminary Design': [2, 6, 14, 22, 6, 6],
    '25% Design':         [2, 8, 20, 40, 18, 28],
    '75% Design':         [4, 10, 30, 60, 32, 50],
    '100% Design':        [4, 10, 20, 32, 16, 32],
    'PS&E':               [2, 6, 8, 12, 4, 8],
  },
}

const DEFAULT_BASELINE = PHASE_BASELINE.reconstruction

// ─── Task names per discipline (MassDOT WHE Form 1.3) ───────────────────────
// Roadway management tasks — always present on every project type (FDR, DJW, PM, checklists)
const ROADWAY_MGMT_TASKS: Record<string, string[]> = {
  'Preliminary Design': [
    'Project Initiation and Data Compilation',      // 101
    'Preliminary Project Scoping',                   // 102
    'Field Reconnaissance',                          // 106
    'Evaluate Existing Conditions / Context',        // 201 FDR
    'Conduct Safety Analysis',                       // 202 FDR
    'Preferred Alternative',                         // 208 FDR
    'Functional Design Report Preparation',          // 212 FDR
    'Design Justification Workbook',                // 221-223 DJW
  ],
  '25% Design': [
    'Meetings and Liaison',                               // 304
    'Quality Control (QC) Review',                        // 322 — includes addressing internal QC comments
    'Submission Checklists',                              // 325
    'Respond to 25% Comments and CRM',                   // 330 — MassDOT review response + CRM
  ],
  '75% Design': [
    'Meetings Liaison and Coordination',                  // 403
    'Constructability and Quality Control (QC) Reviews', // 425 — includes addressing internal QC comments
    'Submission Checklist',                               // 426
    'Respond to 75% Comments and CRM',                   // 431 — MassDOT review response + CRM
  ],
  '100% Design': [
    'Finalize Special Provisions',                        // 453
    'Quality Control (QC) Review',                        // 456 — includes addressing final QC comments
    'Submission Checklist',                               // 457
    'Respond to 100% Comments and CRM',                  // 462 — MassDOT review response + CRM
  ],
  // Section 800 — correct task names per WHE Form 1.3
  'PS&E': [
    'Finalize Plans, Specifications and Estimate',        // 802
    'Combine Highway and Bridge',                         // 803
    'Quality Control (QC) Review',                        // 804
    'Finalize Bottom Up Estimate and Estimate Reconciliation', // 805
    'Finalize Construction Contract Time Determination',  // 806
    'Finalize Incentives/Disincentives',                  // 807
  ],
}

// QC task names that should receive extra weight (review + addressing comments is more effort)
// These get a multiplier applied so their hours reflect the full QC cycle
const QC_TASK_WEIGHT: Record<string, number> = {
  'Quality Control (QC) Review':                        2.0,  // review + address internal comments
  'Constructability and Quality Control (QC) Reviews': 2.5,  // 75% is the heaviest QC effort
  'Respond to 25% Comments and CRM':                   1.8,  // MassDOT comments tend to be numerous at 25%
  'Respond to 75% Comments and CRM':                   2.2,  // largest comment volume
  'Respond to 100% Comments and CRM':                  1.5,  // usually fewer final comments
}

// QC tasks are weighted toward reviewers (PIC/SE) for the review, and
// Eng/AE for addressing comments — averaged into a single task allocation
const QC_STAFF_BIAS: Record<string, number[]> = {
  // [PIC, PM, SE, Eng, AE, ET] — deviation from base allocation
  'Quality Control (QC) Review':                       [1.8, 0.9, 1.5, 1.0, 0.7, 0.1],
  'Constructability and Quality Control (QC) Reviews': [1.8, 0.9, 1.5, 1.1, 0.6, 0.1],
  'Respond to 25% Comments and CRM':                   [0.8, 1.6, 1.2, 1.3, 1.0, 0.1],
  'Respond to 75% Comments and CRM':                   [0.8, 1.6, 1.2, 1.4, 0.9, 0.1],
  'Respond to 100% Comments and CRM':                  [0.8, 1.5, 1.2, 1.4, 1.0, 0.1],
}

// Roadway design tasks — physical road design, scaled by roadwayDesignScale
const ROADWAY_DESIGN_TASKS: Record<string, string[]> = {
  'Preliminary Design': [
    'Conceptual Design and Alternatives Analysis',   // 110
  ],
  '25% Design': [
    'Preliminary Horizontal Geometry',               // 305
    'Preliminary Vertical Geometry',                 // 306
    'Pavement Design',                               // 310
    'Typical Sections',                              // 311
    'Preliminary Construction Cost Estimate',        // 323
    '25% Contract Plans',                            // 324
  ],
  '75% Design': [
    'Final Horizontal Design Geometrics',            // 405
    'Final Vertical Design Geometrics',              // 406
    'Construction Plans',                            // 411
    'Grading and Tie Plans',                         // 412
    'Quantity and Cost Estimate',                    // 423
  ],
  '100% Design': [
    'Finalize Plans',                                // 452
    'Finalize Quantity and Cost Estimate',           // 455
  ],
  // Section 800 design tasks
  'PS&E': [
    'Finalize Plans, Specifications and Estimate',        // 802
    'Combine Highway and Bridge',                         // 803
    'Finalize Bottom Up Estimate and Estimate Reconciliation', // 805
  ],
}

const TASK_MAP: Record<string, Record<string, string[]>> = {
  Roadway: {
    'Preliminary Design': [...ROADWAY_MGMT_TASKS['Preliminary Design'], ...ROADWAY_DESIGN_TASKS['Preliminary Design']],
    '25% Design':         [...ROADWAY_MGMT_TASKS['25% Design'],         ...ROADWAY_DESIGN_TASKS['25% Design']],
    '75% Design':         [...ROADWAY_MGMT_TASKS['75% Design'],         ...ROADWAY_DESIGN_TASKS['75% Design']],
    '100% Design':        [...ROADWAY_MGMT_TASKS['100% Design'],        ...ROADWAY_DESIGN_TASKS['100% Design']],
    'PS&E':               [...(ROADWAY_MGMT_TASKS['PS&E'] ?? []),       ...(ROADWAY_DESIGN_TASKS['PS&E'] ?? [])],
  },
  Traffic: {
    'Preliminary Design': ['Intersection Control Evaluation', 'Road Safety Audit', 'Prepare Traffic Volumes'],
    '25% Design':         ['Lane Configurations', 'Traffic Signals', 'Signs and Pavement Markings'],
    '75% Design':         ['Traffic Signals and Plan Preparation', 'Pavement Markings and Plan Preparation', 'Traffic Management Plans and Details'],
    '100% Design':        ['Finalize Plans', 'Traffic Control Agreement Submission'],
    'PS&E':               ['Finalize Plans, Specifications and Estimate', 'Quality Control (QC) Review'],
  },
  Structures: {
    'Preliminary Design': ['Field Investigation', 'Preliminary Structural Analysis', 'Preliminary Structures Report Preparation'],
    '25% Design':         ['Sketch Plan Development', 'Establish Boring Locations'],
    '75% Design':         ['Structural Design - Superstructure', 'Structural Design - Substructure', 'Contract Drawings', 'Constructability and Quality Control (QC) Review'],
    '100% Design':        ['Finalize Plans', 'Finalize Special Provisions', 'Quality Control (QC) Review'],
    'PS&E':               ['Finalize Plans, Specifications and Estimate', 'Combine Highway and Bridge', 'Quality Control (QC) Review'],
  },
  'Hydraulics/Drainage': {
    'Preliminary Design': ['Hydraulics Study and Report'],
    '25% Design':         ['Hydrological Studies and Hydraulics Report', 'Preliminary Drainage Studies'],
    '75% Design':         ['Drainage and Water Supply Plans'],
    '100% Design':        ['Finalize Plans'],
    'PS&E':               ['Finalize Plans, Specifications and Estimate'],
  },
  Utilities: {
    '25% Design':         ['Utility Coordination', 'Subsurface Utility Exploration (SUE)', 'Preliminary Utility Design'],
    '75% Design':         ['Utility Coordination'],
    '100% Design':        ['Finalize Plans'],
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
    '100% Design':  ['Layout Plans and Order of Taking', 'Written Instrument', 'Quality Control (QC) Review'],
    'PS&E':         ['Finalize Plans, Specifications and Estimate'],
  },
}

// ─── Size scaling per discipline ─────────────────────────────────────────────
interface SizeFactors { roadMiles: number; bridges: number; intersections: number }

function disciplineSizeFactor(disc: string, sf: SizeFactors, primaryMetric: string): number {
  const miles  = Math.max(0.25, sf.roadMiles)
  const bridges = sf.bridges
  const ints   = sf.intersections

  // If user provided 0 for all metrics, fall back to 1.0 (no scaling)
  const hasSize = sf.roadMiles > 0 || sf.bridges > 0 || sf.intersections > 0

  if (!hasSize) return 1

  switch (disc) {
    case 'Roadway':
    case 'Survey':
      // 0.5 mi → 0.75x, 1 mi → 1.0x, 2 mi → 1.41x, 4 mi → 2.0x
      return Math.max(0.3, 0.5 + 0.5 * Math.sqrt(miles))

    case 'Hydraulics/Drainage':
      return Math.max(0.3, 0.55 + 0.45 * Math.sqrt(miles))

    case 'Environmental':
    case 'Right-of-Way':
      return Math.max(0.4, 0.6 + 0.4 * Math.sqrt(miles))

    case 'Utilities':
      return Math.max(0.4, 0.55 + 0.45 * Math.sqrt(miles))

    case 'Structures':
      // Each bridge is its own deliverable — hours scale linearly
      return bridges > 0 ? bridges : 1

    case 'Traffic':
      if (primaryMetric === 'intersections' && ints > 0) {
        // 1 intersection → 0.75x, 2 → 1.0x, 4 → 1.5x, 6 → 2.0x
        return Math.max(0.3, 0.5 + 0.25 * ints)
      }
      // Signal upgrades on a corridor scale with miles too
      return Math.max(0.3, 0.5 + 0.5 * Math.sqrt(miles))

    default:
      return 1
  }
}

// ─── Apply size scaling to any estimate result (post-processing) ─────────────
function applyScaling(
  disciplines: Array<{ discipline: string; tasks: any[] }>,
  sf: SizeFactors,
  primaryMetric: string
) {
  const scaled = disciplines.map(d => {
    const factor = disciplineSizeFactor(d.discipline, sf, primaryMetric)
    return {
      ...d,
      tasks: d.tasks.map((t: any) => {
        const scaledHours: Record<string, number> = {}
        for (const [cat, hrs] of Object.entries(t.hours as Record<string, number>)) {
          scaledHours[cat] = Math.max(0, Math.round(hrs * factor))
        }
        const likely = Object.values(scaledHours).reduce((s, v) => s + v, 0)
        return {
          ...t,
          hours: scaledHours,
          lowHours:    Math.round(likely * 0.8),
          likelyHours: likely,
          highHours:   Math.round(likely * 1.3),
          rationale: t.rationale +
            (factor !== 1 ? ` [×${factor.toFixed(2)} size factor]` : ''),
        }
      }),
    }
  })

  return scaled
}

// ─── Rules-based estimate ─────────────────────────────────────────────────────
function buildRolewayTasksForPhase(
  phase: string,
  roadwayDesignScale: number,
  baseMult: number,
  base: number[],
  complexity: number, complexityMult: number, intensityMult: number, sizeFactor: number,
  sf: SizeFactors, primaryMetric: string
) {
  const tasks: any[] = []

  // Management tasks (FDR, DJW, checklists, QC reviews, CRM) — not scaled by road miles
  // QC tasks get a weight multiplier: their hours cover review + addressing comments
  const mgmtNames = ROADWAY_MGMT_TASKS[phase] ?? []
  if (mgmtNames.length > 0) {
    const nonQcCount = mgmtNames.filter(n => !QC_TASK_WEIGHT[n]).length || 1
    mgmtNames.forEach(taskName => {
      const qcWeight = QC_TASK_WEIGHT[taskName] ?? 1.0
      const staffBias = QC_STAFF_BIAS[taskName]

      // Base per-task hours, then apply QC weight for review+comment effort
      const baseHrs = base.map(h => Math.max(0, Math.round((h * baseMult * qcWeight) / Math.max(1, nonQcCount + Object.keys(QC_TASK_WEIGHT).filter(k => mgmtNames.includes(k)).length * 1.5))))

      // Apply staff bias for QC tasks (reviewers vs comment-addressers)
      const hrs = staffBias
        ? baseHrs.map((h, i) => Math.max(0, Math.round(h * (staffBias[i] ?? 1))))
        : baseHrs

      const likely = hrs.reduce((s, v) => s + v, 0)
      const isQC = !!QC_TASK_WEIGHT[taskName]
      tasks.push({
        phase, taskName,
        hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
        lowHours:    Math.round(likely * (isQC ? 0.75 : 0.8)),
        likelyHours: likely,
        highHours:   Math.round(likely * (isQC ? 1.45 : 1.3)),  // QC has wider range (comment volume unpredictable)
        rationale: isQC
          ? `QC task / ${phase}: hours include review + addressing comments (×${qcWeight} weight)`
          : `Roadway management / ${phase}: FDR/DJW/PM/checklists`,
      })
    })
  }

  // Design tasks — scaled by roadwayDesignScale × sizeFactor
  if (roadwayDesignScale > 0) {
    const designNames = ROADWAY_DESIGN_TASKS[phase] ?? []
    if (designNames.length > 0) {
      const designMult = baseMult * roadwayDesignScale * sizeFactor
      designNames.forEach(taskName => {
        const hrs = base.map(h => Math.max(0, Math.round((h * designMult) / designNames.length)))
        const likely = hrs.reduce((s, v) => s + v, 0)
        tasks.push({
          phase, taskName,
          hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
          lowHours: Math.round(likely * 0.8), likelyHours: likely, highHours: Math.round(likely * 1.3),
          rationale: buildRationale('Roadway (design)', phase, complexity, complexityMult, intensityMult * roadwayDesignScale, sizeFactor, sf, primaryMetric),
        })
      })
    }
  }

  return tasks
}

function buildRulesEstimate(projectType: string, complexity: number, phases: string[], sf: SizeFactors) {
  const config = PROJECT_TYPES[projectType]
  const disciplines = config?.disciplines ?? ['Roadway', 'Traffic']
  const baselineKey = config?.baseline ?? 'reconstruction'
  const phaseBaselines = PHASE_BASELINE[baselineKey] ?? DEFAULT_BASELINE
  const intensityMult = config?.intensityMult ?? 1.0
  const roadwayDesignScale = config?.roadwayDesignScale ?? 1.0
  const primaryMetric = config?.sizeMetric ?? 'roadMiles'

  // Complexity: 1=0.6x, 2=0.8x, 3=1.0x, 4=1.2x, 5=1.4x
  const complexityMult = 0.6 + (complexity - 1) * 0.2

  const disciplineResults = disciplines.map((disc, dIdx) => {
    const primaryScale = dIdx === 0 ? 1 : 0.4
    const sizeFactor = disciplineSizeFactor(disc, sf, primaryMetric)
    const baseMult = complexityMult * primaryScale * intensityMult

    const tasks = phases.flatMap(phase => {
      const base = phaseBaselines[phase] ?? DEFAULT_BASELINE[phase] ?? [2, 4, 8, 16, 8, 12]

      // Roadway discipline uses split management + design tasks
      if (disc === 'Roadway') {
        return buildRolewayTasksForPhase(
          phase, roadwayDesignScale, baseMult, base,
          complexity, complexityMult, intensityMult, sizeFactor, sf, primaryMetric
        )
      }

      // All other disciplines use the standard task map
      const taskNames = TASK_MAP[disc]?.[phase]
      if (!taskNames) return []
      const finalMult = baseMult * sizeFactor
      return taskNames.map(taskName => {
        const hrs = base.map(h => Math.max(0, Math.round((h * finalMult) / taskNames.length)))
        const likely = hrs.reduce((s, v) => s + v, 0)
        return {
          phase, taskName,
          hours: Object.fromEntries(STAFF.map((cat, i) => [cat, hrs[i] ?? 0])),
          lowHours:    Math.round(likely * 0.8),
          likelyHours: likely,
          highHours:   Math.round(likely * 1.3),
          rationale: buildRationale(disc, phase, complexity, complexityMult, intensityMult, sizeFactor, sf, primaryMetric),
        }
      })
    })
    return { discipline: disc, tasks }
  })

  const total = disciplineResults.flatMap(d => d.tasks).reduce((s, t) => s + t.likelyHours, 0)

  return {
    summary: buildSummary(projectType, complexity, complexityMult, intensityMult, sf, total),
    confidenceScore: 65,
    totalEstimatedHours: total,
    disciplines: disciplineResults,
    riskFlags: buildRiskFlags(complexity, sf),
    similarProjects: [],
    assumptions: [
      ...buildAssumptions(projectType, complexity, complexityMult, intensityMult, sf, primaryMetric),
      'QC tasks (322/425/456) sized to cover both internal review and addressing comments',
      'CRM tasks (330/431/462) included every phase — hours reflect coordination + response effort',
    ],
  }
}

function buildRationale(
  disc: string, phase: string, complexity: number,
  complexityMult: number, intensityMult: number, sizeFactor: number,
  sf: SizeFactors, primaryMetric: string
): string {
  const sizeNote = disc === 'Structures'
    ? `${sf.bridges} bridge(s) × 1.0 per-bridge`
    : primaryMetric === 'intersections'
    ? `${sf.intersections} intersection(s) → ${sizeFactor.toFixed(2)}x`
    : `${sf.roadMiles}mi → ${sizeFactor.toFixed(2)}x`
  return `${disc} / ${phase}: complexity ${complexity}/5 (${complexityMult.toFixed(1)}x) × type factor ${intensityMult.toFixed(2)} × ${sizeNote}`
}

function buildSummary(type: string, complexity: number, cMult: number, iMult: number, sf: SizeFactors, total: number): string {
  const parts = [
    sf.roadMiles > 0 ? `${sf.roadMiles} mi` : '',
    sf.bridges > 0 ? `${sf.bridges} bridge${sf.bridges !== 1 ? 's' : ''}` : '',
    sf.intersections > 0 ? `${sf.intersections} intersection${sf.intersections !== 1 ? 's' : ''}` : '',
  ].filter(Boolean)
  return `${type} project at complexity ${complexity}/5 (${cMult.toFixed(1)}× complexity, ${iMult.toFixed(2)}× type factor).` +
    (parts.length ? ` Sized for ${parts.join(', ')}.` : '') +
    ` Total likely: ${total.toLocaleString()} hours.`
}

function buildRiskFlags(complexity: number, sf: SizeFactors): string[] {
  const flags: string[] = []
  if (complexity >= 4) flags.push('High complexity — consider 20–30% contingency')
  if (sf.bridges > 2) flags.push(`${sf.bridges} bridges — verify individual bridge scope and type selection`)
  if (sf.roadMiles > 3) flags.push(`${sf.roadMiles} road miles — survey, ROW, and environmental hours may need further review`)
  if (sf.intersections > 4) flags.push(`${sf.intersections} intersections — confirm signal design is scoped per intersection`)
  return flags
}

function buildAssumptions(type: string, complexity: number, cMult: number, iMult: number, sf: SizeFactors, primaryMetric: string): string[] {
  const out = [
    `Project type: ${type} (type intensity factor: ${iMult.toFixed(2)}x)`,
    `Complexity ${complexity}/5 → ${cMult.toFixed(2)}x multiplier (range: 0.60x–1.40x)`,
  ]
  if (sf.roadMiles > 0)    out.push(`Road miles: ${sf.roadMiles} → roadway/drainage/survey scale as 0.5 + 0.5√miles`)
  if (sf.bridges > 0)      out.push(`Bridges: ${sf.bridges} → structural hours = bridges × per-bridge baseline`)
  if (sf.intersections > 0) out.push(`Intersections: ${sf.intersections} → traffic scale as 0.5 + 0.25 × count`)
  out.push('Phase baselines from MassDOT WHE Form 1.3 standard task table')
  out.push('Range: Low = likely × 0.8, High = likely × 1.3')
  return out
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const {
    projectType  = 'Hwy Reconstr - Restr and Rehab',
    district     = 'Not specified',
    description  = '',
    complexity   = 3,
    roadMiles    = 0,
    bridges      = 0,
    intersections = 0,
    phases       = ['Preliminary Design', '25% Design', '75% Design', '100% Design', 'PS&E'],
  } = req.body ?? {}

  const sf: SizeFactors = {
    roadMiles:     parseFloat(roadMiles)    || 0,
    bridges:       parseInt(bridges)        || 0,
    intersections: parseInt(intersections)  || 0,
  }
  const config = PROJECT_TYPES[projectType]
  const primaryMetric = config?.sizeMetric ?? 'roadMiles'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.json(buildRulesEstimate(projectType, Number(complexity), phases, sf))
  }

  const prompt = `You are a senior MassDOT consultant estimator. Generate a work hour estimate using MassDOT WHE Form 1.3 task numbering.

PROJECT TYPE: ${projectType}
DISTRICT: ${district}
DESCRIPTION: ${description || 'Not provided'}
COMPLEXITY: ${complexity}/5
ROAD MILES: ${sf.roadMiles || 'not specified'}
BRIDGES: ${sf.bridges}
INTERSECTIONS: ${sf.intersections}
PHASES: ${phases.join(', ')}

CRITICAL — Roadway tasks are REQUIRED on ALL project types (including bridge, signal, drainage):
- Every project needs Section 100 tasks: Project Initiation, Scoping, Field Reconnaissance
- Every project needs Section 200 Functional Design Report (FDR): Existing Conditions, Safety Analysis, Preferred Alternative, Report Preparation
- Every project needs Section 220 Design Justification Workbook (DJW): Controlling Criteria, Incremental Evaluation, Certify Workbook
- Every project needs submission checklists, meetings/liaison, QC reviews
- Physical road design (horizontal/vertical geometry, construction plans) ONLY for roadway-heavy projects
  - For ${projectType}: roadway design scale = ${(config?.roadwayDesignScale ?? 1.0).toFixed(1)} (1.0=full design, 0.2=mgmt/FDR/DJW only)

Size scaling rules:
- Roadway DESIGN hours: baseline = 1 road mile → scale for ${sf.roadMiles} miles
- Structural hours: 1 bridge baseline → multiply by ${sf.bridges}
- Traffic/Signal hours: 2 intersections baseline → scale for ${sf.intersections}

Staff: Principal In Charge (PIC), Project Manager (PM), Senior Engineer (SE), Engineer (Eng), Assistant Engineer (AE), Engineering Technician (ET)
QC/CRM tasks to include per phase (these are Roadway management tasks, not a separate discipline):
- 25% Design: task 322 (QC Review, sized to include addressing comments), task 330 (Respond to 25% Comments and CRM)
- 75% Design: task 425 (Constructability and QC Reviews, sized for full comment cycle), task 431 (Respond to 75% Comments and CRM)
- 100% PS&E: task 456 (QC Review, sized for final comment cycle), task 462 (Respond to 100% Comments and CRM)
Weight QC review tasks 1.5–2.5× heavier than a standard task to account for review + addressing comments.
MassDOT sections: 100 (Prelim/PM), 150 (Environmental), 200 (FDR), 220 (DJW), 300 (25%), 400 (75%), 450 (PS&E), 500 (ROW), 600 (Geotech), 700/710/750 (Structural)

Return ONLY valid JSON — no markdown:
{
  "summary": "string",
  "confidenceScore": 80,
  "totalEstimatedHours": 0,
  "disciplines": [
    {
      "discipline": "string",
      "tasks": [
        {
          "phase": "string",
          "taskName": "string",
          "hours": {"Principal In Charge (PIC)":0,"Project Manager (PM)":0,"Senior Engineer (SE)":0,"Engineer (Eng)":0,"Assistant Engineer (AE)":0,"Engineering Technician (ET)":0},
          "lowHours": 0, "likelyHours": 0, "highHours": 0,
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
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-8', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!anthropicRes.ok) throw new Error(`Anthropic ${anthropicRes.status}: ${await anthropicRes.text().then(t => t.slice(0, 200))}`)

    const anthropicData = await anthropicRes.json() as { content: Array<{ type: string; text: string }> }
    const text = anthropicData.content[0]?.type === 'text' ? anthropicData.content[0].text : ''
    const clean = text.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/\s*```$/m, '').trim()
    const parsed = JSON.parse(clean)

    // Post-process: apply size scaling
    const cMult = 0.6 + (Number(complexity) - 1) * 0.2
    const allDisciplines = applyScaling(parsed.disciplines ?? [], sf, primaryMetric)
    const totalFinal = allDisciplines.flatMap((d: any) => d.tasks).reduce((s: number, t: any) => s + t.likelyHours, 0)

    return res.json({
      ...parsed,
      disciplines: allDisciplines,
      totalEstimatedHours: totalFinal,
      summary: buildSummary(projectType, Number(complexity), cMult, config?.intensityMult ?? 1, sf, totalFinal),
      riskFlags: [...(parsed.riskFlags ?? []), ...buildRiskFlags(Number(complexity), sf)].filter((v, i, a) => a.indexOf(v) === i),
      assumptions: [
        ...buildAssumptions(projectType, Number(complexity), cMult, config?.intensityMult ?? 1, sf, primaryMetric),
        'QC review tasks (322/425/456) sized to cover review + addressing comments',
        'CRM tasks (330/431/462) included each phase — hours reflect coordination and response effort',
      ],
    })
  } catch (err: any) {
    console.error('Claude error:', err?.message ?? err)
    return res.json({
      ...buildRulesEstimate(projectType, Number(complexity), phases, sf),
      summary: `Estimate via rules engine (Claude unavailable). Project: ${projectType}.`,
    })
  }
}
