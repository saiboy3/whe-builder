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
    section: 'SECTION 100 — Project Development Engineering',
    tasks: {
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
    },
  },
  'Preliminary Design / Traffic': {
    section: 'SECTION 100 — Project Development Engineering',
    tasks: {
      'Prepare Traffic Volumes':                        105,
      'Intersection Control Evaluation':                108,
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

  // ── 100% / PS&E ─────────────────────────────────────────────────────────
  '100% / PS&E / Roadway': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Finalize Special Provisions':                    453,
      'Prepare Detail Sheets':                          454,
      'Finalize Quantity and Cost Estimate':            455,
      'Quality Control (QC) Review':                    456,
      'Submission Checklist':                           457,
      'Construction Contract Time Determination':       459,
      'Respond to 100% Comments and CRM':              462,
    },
  },
  '100% / PS&E / Traffic': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Traffic Control Agreement Submission':           461,
    },
  },
  '100% / PS&E / Structures': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
      'Finalize Special Provisions':                    453,
      'Finalize Quantity and Cost Estimate':            455,
      'Quality Control (QC) Review':                    456,
    },
  },
  '100% / PS&E / Hydraulics/Drainage': {
    section: 'SECTION 450 — 100% Highway Design Submission',
    tasks: {
      'Finalize Plans':                                 452,
    },
  },
  '100% / PS&E / Right-of-Way': {
    section: 'SECTION 500 — Right of Way',
    tasks: {
      'Layout Plans and Order of Taking':               502,
      'Written Instrument':                             503,
      'Quality Control (QC) Review':                    504,
    },
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
    // Exact match
    if (section.tasks[taskName]) return String(section.tasks[taskName])
    // Partial match (AI-generated task names won't match exactly)
    const partial = Object.entries(section.tasks).find(([k]) =>
      k.toLowerCase().includes(taskName.toLowerCase().slice(0, 8)) ||
      taskName.toLowerCase().includes(k.toLowerCase().slice(0, 8))
    )
    if (partial) return String(partial[1])
  }
  // Fallback: generate from section number + hash
  const phaseNum = phase === 'Preliminary Design' ? 1
    : phase === '25% Design' ? 3
    : phase === '75% Design' ? 4
    : 4
  const discOffset = { Roadway: 0, Traffic: 15, Structures: 50, 'Hydraulics/Drainage': 13,
    Utilities: 1, Environmental: 50, Survey: 3, 'Right-of-Way': 0, 'Construction Support': 30 }[discipline] ?? 99
  return String(phaseNum * 100 + discOffset + 1)
}

export function getTaskSection(phase: string, discipline: string): string {
  const key = `${phase} / ${discipline}`
  return MASSDOT_TASKS[key]?.section ?? `${phase} — ${discipline}`
}
