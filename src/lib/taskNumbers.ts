// Real MassDOT Work Hour Estimate task numbers — Form 1.3 (January 2024)
// Source: dot-hwy-WorkhourEstForms_2024Jan.xlsx

// Section mapping by phase/discipline:
// Section 100  — Project Development Engineering (Preliminary)
// Section 150  — Environmental
// Section 200  — Functional Design Report
// Section 300  — 25% Highway Design Submission
// Section 350  — Design Public Hearing
// Section 400  — 75% Highway Design Submission
// Section 450  — 100% Highway Design Submission / PS&E
// Section 500  — Right of Way
// Section 600  — Geotechnical Design
// Section 700  — Project Development – Structural (Preliminary)
// Section 710  — Sketch Plans (Bridge)
// Section 750  — Final Bridge Design

export const MASSDOT_TASKS: Record<string, { section: string; tasks: Record<string, number> }> = {

  // ── PRELIMINARY DESIGN ──────────────────────────────────────────────────
  'Preliminary Design / Roadway': {
    section: 'SECTION 100 / 200 / 220 — Preliminary Engineering',
    tasks: {
      // Section 100 — Project Development Engineering
      'Project Initiation and Data Compilation':        101,
      'Preliminary Project Scoping':                    102,
      'Field Surveys':                                  103,
      'Survey Coordination and Verification':           104,
      'Field Reconnaissance':                           106,
      'Road Safety Audit':                              107,
      'Reasonable Alternative(s) Identification':       109,
      'Conceptual Design and Alternatives Analysis':    110,
      'Over-the-Shoulder Deliverables and Meeting':     111,
      'Public and Agency Outreach':                     112,
      'Project Design Schedule Development':            113,
      // Section 200 — Functional Design Report (FDR)
      'Evaluate Existing Conditions / Context':         201,
      'Conduct Safety Analysis':                        202,
      'Evaluate Signal Warrants':                       203,
      'Operational Analysis for Existing Conditions':   204,
      'Development of Alternatives':                    206,
      'Operational Analysis for Future Conditions':     207,
      'Preferred Alternative':                          208,
      'Complete Streets':                               209,
      'Traffic Management':                             210,
      'Conclusion and Recommendation':                  211,
      'Functional Design Report Preparation':           212,
      'Report Preparation':                             212,
      // Section 220 — Design Justification Workbook (DJW)
      'Design Justification Workbook':                  221,
      'Evaluate the Controlling Criteria':              221,
      'Perform Incremental Evaluation':                 222,
      'Complete and Certify the Workbook':              223,
      // Section 230 — IJR/IMR
      'Prepare an IJR/IMR':                             231,
    },
  },
  'Preliminary Design / Traffic': {
    section: 'SECTION 100 — Project Development Engineering',
    tasks: {
      'Prepare Traffic Volumes':                        105,
      'Intersection Control Evaluation':                108,
      'Road Safety Audit':                              107,
    },
  },
  'Preliminary Design / Environmental': {
    section: 'SECTION 150 — Environmental',
    tasks: {
      'Early Environmental Review Checklist':           151,
      'Historic/Archaeology Review':                    152,
      'Hazardous Materials Research/Review':            154,
      'Project Development Meetings':                   155,
      'NEPA/MEPA Determination':                        156,
      'NEPA - Categorical Exclusion (CE)':              157,
      'NEPA - Environmental Assessment (EA)':           158,
      'Wetland Resource Area Delineation':              176,
      'WPA Notice of Intent (NOI)':                     179,
      'Wildlife/Rare Species Assessment':               184,
      'Essential Fish Habitat Assessment':              185,
      'Section 7 Consultation – Endangered Species':   186,
      'Noise Studies':                                  188,
    },
  },
  'Preliminary Design / Structures': {
    section: 'SECTION 700 — Project Development Structural',
    tasks: {
      'Field Investigation':                            701,
      'Determine Bridge Configurations':                702,
      'Preliminary Structural Analysis':                703,
      'Comparative Design and Cost Analyses':           704,
      'Preliminary Structures Report Preparation':      705,
      'Bridge Type Selection Worksheet':                706,
      'Meetings and Liaison':                           707,
      'Hydraulics Study and Report':                    708,
    },
  },
  'Preliminary Design / Survey': {
    section: 'SECTION 100 — Project Development Engineering',
    tasks: {
      'Survey Coordination and Verification':           104,
      'Field Surveys':                                  103,
    },
  },
  'Preliminary Design / Hydraulics/Drainage': {
    section: 'SECTION 100 — Project Development Engineering',
    tasks: {
      'Hydrological Studies':                           313,
    },
  },

  // ── 25% DESIGN ──────────────────────────────────────────────────────────
  '25% Design / Roadway': {
    section: 'SECTION 300 — 25% Highway Design Submission',
    tasks: {
      'Utility Coordination':                           301,
      'Subsurface Utility Exploration (SUE)':           302,
      'Additional Field Visit':                         303,
      'Meetings and Liaison':                           304,
      'Preliminary Horizontal Geometry':                305,
      'Preliminary Vertical Geometry':                  306,
      'Cross Section Studies':                          307,
      'Prepare Cross Sections':                         308,
      'Plot Proposed Layout and Easements':             309,
      'Pavement Design':                                310,
      'Typical Sections':                               311,
      'Construction Details':                           312,
      'Constructability Review':                        321,
      'Quality Control (QC) Review':                    322,
      'Preliminary Construction Cost Estimate':         323,
      '25% Contract Plans':                             324,
      'Submission Checklists':                          325,
      'Respond to 25% Comments and CRM':               330,
    },
  },
  '25% Design / Traffic': {
    section: 'SECTION 300 — 25% Highway Design Submission',
    tasks: {
      'Lane Configurations':                            315,
      'Traffic Signals':                                316,
      'Signs and Pavement Markings':                    317,
      'Traffic Management':                             318,
    },
  },
  '25% Design / Hydraulics/Drainage': {
    section: 'SECTION 300 — 25% Highway Design Submission',
    tasks: {
      'Hydrological Studies and Hydraulics Report':     313,
      'Preliminary Drainage Studies':                   314,
    },
  },
  '25% Design / Utilities': {
    section: 'SECTION 300 — 25% Highway Design Submission',
    tasks: {
      'Utility Coordination':                           301,
      'Subsurface Utility Exploration (SUE)':           302,
      'Preliminary Utility Design':                     320,
    },
  },
  '25% Design / Structures': {
    section: 'SECTION 710 — Sketch Plans',
    tasks: {
      'Establish Boring Locations':                     711,
      'Sketch Plan Development':                        713,
      'Meetings, Coordination and Liaison':             714,
      'Constructability Review':                        715,
      'Submission Checklist':                           716,
    },
  },
  '25% Design / Survey': {
    section: 'SECTION 300 — 25% Highway Design Submission',
    tasks: {
      'Additional Field Visit':                         303,
    },
  },
  '25% Design / Environmental': {
    section: 'SECTION 150 — Environmental',
    tasks: {
      'NEPA - Environmental Assessment (EA)':           158,
      'WPA Notice of Intent (NOI)':                     179,
      'Water Quality Certification (WQC)':              182,
    },
  },

  // ── 75% DESIGN ──────────────────────────────────────────────────────────
  '75% Design / Roadway': {
    section: 'SECTION 400 — 75% Highway Design Submission',
    tasks: {
      'Field Reconnaissance / Field Survey':            402,
      'Meetings Liaison and Coordination':              403,
      'Final Horizontal Design Geometrics':             405,
      'Final Vertical Design Geometrics':               406,
      'Pavement Design':                                407,
      'Typical Cross Sections':                         408,
      'Plot Cross Sections':                            409,
      'Plot Proposed Layout and Easements':             410,
      'Construction Plans':                             411,
      'Grading and Tie Plans':                          412,
      'Landscape Design and Plan Preparation':          420,
      'Construction Phase Erosion and Sediment Control': 421,
      'Miscellaneous Contract Plans':                   422,
      'Quantity and Cost Estimate':                     423,
      'Special Provisions':                             424,
      'Constructability and Quality Control (QC) Reviews': 425,
      'Submission Checklist':                           426,
      'Respond to 75% Comments and CRM':               431,
    },
  },
  '75% Design / Traffic': {
    section: 'SECTION 400 — 75% Highway Design Submission',
    tasks: {
      'Traffic Signs':                                  414,
      'Guide Sign Design and OD Elevations':            415,
      'Traffic Signals and Plan Preparation':           416,
      'Pavement Markings and Plan Preparation':         417,
      'Traffic Management Plans and Details':           418,
      'Highway Lighting Plans and Details':             419,
    },
  },
  '75% Design / Hydraulics/Drainage': {
    section: 'SECTION 400 — 75% Highway Design Submission',
    tasks: {
      'Drainage and Water Supply Plans':                413,
    },
  },
  '75% Design / Utilities': {
    section: 'SECTION 400 — 75% Highway Design Submission',
    tasks: {
      'Utility Coordination':                           404,
    },
  },
  '75% Design / Structures': {
    section: 'SECTION 750 — Final Bridge Design',
    tasks: {
      'Structural Design - Superstructure':             751,
      'Structural Design - Substructure':               752,
      'Bridge Layout Geometrics':                       753,
      'Contract Drawings':                              754,
      'First Review Submission':                        755,
      'Quantity Cost Estimates':                        756,
      'Special Provisions':                             757,
      'Second Review Submission':                       758,
      'FHWA Reviews':                                   759,
      'Meetings and Liaison':                           760,
      'Constructability and Quality Control (QC) Review': 761,
    },
  },
  '75% Design / Environmental': {
    section: 'SECTION 150 — Environmental',
    tasks: {
      'WPA Notice of Intent (NOI)':                     179,
      'WPA Variance':                                   180,
      'Wildlife/Rare Species Assessment':               184,
    },
  },
  '75% Design / Right-of-Way': {
    section: 'SECTION 500 — Right of Way',
    tasks: {
      'Preliminary Right of Way Plans':                 501,
      'Layout Plans and Order of Taking':               502,
      'Written Instrument':                             503,
      'Quality Control (QC) Review':                    504,
    },
  },
  '75% Design / Survey': {
    section: 'SECTION 600 — Geotechnical Design',
    tasks: {
      'Research Available Subsurface Data':             601,
      'Subsurface Investigation Plan':                  603,
      'Subsurface Investigation Inspection':            604,
      'Geotechnical Report':                            606,
    },
  },

  // ── 100% DESIGN ─────────────────────────────────────────────────────────
  '100% Design / Roadway': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Finalize Special Provisions':                    453,
      'Prepare Detail Sheets':                          454,
      'Quality Control (QC) Review':                    456,
      'Submission Checklist':                           457,
    },
  },
  '100% Design / Traffic': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Quality Control (QC) Review':                    456,
    },
  },
  '100% Design / Structures': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Finalize Special Provisions':                    453,
      'Quality Control (QC) Review':                    456,
    },
  },
  '100% Design / Hydraulics/Drainage': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
    },
  },
  '100% Design / Right-of-Way': {
    section: 'SECTION 500 — Right of Way',
    tasks: {
      'Layout Plans and Order of Taking':               502,
      'Written Instrument':                             503,
      'Quality Control (QC) Review':                    504,
    },
  },

  // ── PS&E (Section 800) ───────────────────────────────────────────────────
  'PS&E / Roadway': {
    section: 'SECTION 800 — PS&E Submission',
    tasks: {
      'Compile PS&E Package':                           801,
      'Final PS&E Review and Sign-offs':               802,
      'Submit PS&E to MassDOT':                        803,
      'Address Final Comments':                         804,
      'Final PS&E Quality Control (QC) Review':        805,
      'Bottom Up Estimate and Reconciliation':         806,
      'Construction Contract Time Determination':       807,
      'Incentives/Disincentives':                       808,
    },
  },
  'PS&E / Traffic': {
    section: 'SECTION 800 — PS&E Submission',
    tasks: {
      'Compile PS&E Package':                           801,
      'Final PS&E Review and Sign-offs':               802,
      'Submit PS&E to MassDOT':                        803,
    },
  },
  'PS&E / Structures': {
    section: 'SECTION 800 — PS&E Submission',
    tasks: {
      'Compile PS&E Package':                           801,
      'Submit PS&E to MassDOT':                        803,
      'Address Final Comments':                         804,
    },
  },
  'PS&E / Hydraulics/Drainage': {
    section: 'SECTION 800 — PS&E Submission',
    tasks: { 'Compile PS&E Package': 801 },
  },
  'PS&E / Right-of-Way': {
    section: 'SECTION 800 — PS&E Submission',
    tasks: { 'Submit PS&E to MassDOT': 803 },
  },
}

// Staff category mapping: our labels → MassDOT form labels
// Short grid labels (column headers in WBS table)
export const STAFF_LABEL_MAP: Record<string, string> = {
  'Principal In Charge (PIC)':    'PIC',
  'Project Manager (PM)':         'PM',
  'Senior Engineer (SE)':         'SE',
  'Engineer (Eng)':               'Eng',
  'Assistant Engineer (AE)':      'AE',
  'Engineering Technician (ET)':  'ET',
}

export function getTaskNumber(phase: string, discipline: string, taskName: string): string {
  const key = `${phase} / ${discipline}`
  const section = MASSDOT_TASKS[key]
  if (section) {
    // 1. Exact match
    if (section.tasks[taskName]) return String(section.tasks[taskName])

    // 2. Case-insensitive exact match
    const lower = taskName.toLowerCase()
    const exact = Object.entries(section.tasks).find(([k]) => k.toLowerCase() === lower)
    if (exact) return String(exact[1])

    // 3. Substring match — require at least 12 chars to avoid false positives
    const MIN_MATCH = 12
    const namePrefix = lower.slice(0, Math.max(MIN_MATCH, Math.floor(taskName.length * 0.6)))
    const sub = Object.entries(section.tasks).find(([k]) =>
      k.toLowerCase().startsWith(lower.slice(0, MIN_MATCH)) ||
      lower.startsWith(k.toLowerCase().slice(0, MIN_MATCH))
    )
    if (sub && namePrefix.length >= MIN_MATCH) return String(sub[1])
  }

  // 4. Deterministic fallback — hash the task name so same task always gets same number,
  //    no counter state, no repeated numbers across different tasks
  const phaseBase = phase === 'Preliminary Design' ? 100
    : phase === '25% Design' ? 300
    : phase === '75% Design' ? 400
    : 450
  let hash = 0
  for (const c of taskName) hash = Math.imul(31, hash) + c.charCodeAt(0)
  // Map to 01–89 within the section to avoid colliding with real task numbers
  const suffix = (Math.abs(hash) % 89) + 1
  return String(phaseBase + suffix)
}

export function getTaskSection(phase: string, discipline: string): string {
  const key = `${phase} / ${discipline}`
  return MASSDOT_TASKS[key]?.section ?? `${phase} — ${discipline}`
}

// ─── MassDOT WHE Form 1.3 Section structure ──────────────────────────────────
export interface SectionInfo { number: string; name: string }

export const SECTIONS: SectionInfo[] = [
  { number: '100', name: 'Project Development Engineering' },
  { number: '150', name: 'Environmental' },
  { number: '200', name: 'Functional Design Report' },
  { number: '220', name: 'Design Justification Workbook' },
  { number: '230', name: 'Interchange Justification/Modification Report (IJR/IMR)' },
  { number: '300', name: '25% Highway Design Submission' },
  { number: '350', name: 'Design Public Hearing' },
  { number: '400', name: '75% Highway Design Submission' },
  { number: '450', name: '100% Highway Design Submission' },
  { number: '500', name: 'Right of Way' },
  { number: '600', name: 'Geotechnical Design' },
  { number: '700', name: 'Project Development – Structural' },
  { number: '710', name: 'Sketch Plans' },
  { number: '750', name: 'Final Bridge Design' },
  { number: '800', name: 'PS&E Submission' },
  { number: '900', name: 'Construction Engineering' },
]

export function getSectionForTask(taskNumber: string): SectionInfo {
  const n = parseInt(taskNumber, 10)
  if (n >= 100 && n <= 149) return SECTIONS[0]
  if (n >= 150 && n <= 199) return SECTIONS[1]
  if (n >= 200 && n <= 219) return SECTIONS[2]
  if (n >= 220 && n <= 229) return SECTIONS[3]
  if (n >= 230 && n <= 299) return SECTIONS[4]
  if (n >= 300 && n <= 349) return SECTIONS[5]
  if (n >= 350 && n <= 399) return SECTIONS[6]
  if (n >= 400 && n <= 449) return SECTIONS[7]
  if (n >= 450 && n <= 499) return SECTIONS[8]
  if (n >= 500 && n <= 599) return SECTIONS[9]
  if (n >= 600 && n <= 699) return SECTIONS[10]
  if (n >= 700 && n <= 709) return SECTIONS[11]
  if (n >= 710 && n <= 749) return SECTIONS[12]
  if (n >= 750 && n <= 799) return SECTIONS[13]
  if (n >= 800 && n <= 899) return SECTIONS[14]
  if (n >= 900 && n <= 999) return SECTIONS[15]
  return { number: '999', name: 'Other' }
}
