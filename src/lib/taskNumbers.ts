// MassDOT WHE standard task numbering
// Phase prefix: 1xx = Preliminary, 2xx = 25%, 3xx = 75%, 4xx = PS&E
// Discipline blocks: x0x = Roadway, x1x = Traffic, x2x = Structures,
//   x3x = Hydraulics, x4x = Utilities, x5x = Environmental, x6x = Survey,
//   x7x = Right-of-Way, x8x = Construction Support

const NUMBERS: Record<string, Record<string, Record<string, string>>> = {
  'Preliminary Design': {
    Roadway: {
      'Data Collection & Site Visit': '1.01',
      'Conceptual Layout':            '1.02',
      'Horizontal Alignment':         '1.03',
      'Vertical Profile':             '1.04',
    },
    Traffic: {
      'Existing Conditions Analysis': '1.10',
      'Safety Analysis':              '1.11',
    },
    Structures: {
      'Bridge Inspection Review':     '1.20',
      'Conceptual Repair Strategy':   '1.21',
    },
    'Hydraulics/Drainage': {
      'Drainage Inventory':           '1.30',
    },
    Utilities: {
      'Utility Identification':       '1.40',
    },
    Environmental: {
      'Environmental Screening':      '1.50',
      'Wetland Delineation':          '1.51',
    },
    Survey: {
      'Survey Coordination':          '1.60',
      'Control Survey':               '1.61',
    },
    'Right-of-Way': {
      'ROW Research':                 '1.70',
    },
    'Construction Support': {
      'Constructability Review':      '1.80',
    },
  },
  '25% Design': {
    Roadway: {
      'Horizontal Alignment':         '2.01',
      'Vertical Profile':             '2.02',
      'Superelevation':               '2.03',
      'Cross-Section Development':    '2.04',
      'Typical Sections':             '2.05',
    },
    Traffic: {
      'Traffic Analysis':             '2.10',
      'Signal Warrant Study':         '2.11',
      'Signing & Marking Prelim':     '2.12',
    },
    Structures: {
      'Structural Analysis':          '2.20',
      'Preliminary Drawings':         '2.21',
    },
    'Hydraulics/Drainage': {
      'Initial Drainage Design':      '2.30',
      'Culvert Analysis':             '2.31',
    },
    Utilities: {
      'Utility Coordination':         '2.40',
    },
    Environmental: {
      'Environmental Permitting':     '2.50',
    },
    Survey: {
      'Topographic Survey':           '2.60',
      'Subsurface Investigation':     '2.61',
    },
    'Right-of-Way': {
      'ROW Plan Preparation':         '2.70',
    },
    'Construction Support': {
      'Phasing Plan':                 '2.80',
    },
  },
  '75% Design': {
    Roadway: {
      'Final Roadway Design':         '3.01',
      'Cross-Section Development':    '3.02',
      'Earthwork Calculations':       '3.03',
      'Pavement Design':              '3.04',
      'Pavement Design Coordination': '3.05',
    },
    Traffic: {
      'Signal Design':                '3.10',
      'Signing & Marking':            '3.11',
      'Traffic Signal Design':        '3.12',
    },
    Structures: {
      'Final Structural Design':      '3.20',
      'Structural Detailing':         '3.21',
      'Load Rating':                  '3.22',
    },
    'Hydraulics/Drainage': {
      'Final Drainage Design':        '3.30',
      'Drainage Design':              '3.31',
      'Stormwater Management':        '3.32',
    },
    Utilities: {
      'Utility Coordination':         '3.40',
      'Utility Relocation Plans':     '3.41',
    },
    Environmental: {
      'Mitigation Planning':          '3.50',
    },
    Survey: {
      'Final Survey':                 '3.60',
    },
    'Right-of-Way': {
      'ROW Acquisition Support':      '3.70',
    },
    'Construction Support': {
      'Construction Staging':         '3.80',
    },
  },
  '100% / PS&E': {
    Roadway: {
      'Final Plans':                  '4.01',
      'Specifications':               '4.02',
      'Cost Estimates':               '4.03',
      'QA/QC':                        '4.04',
      'Submission Prep':              '4.05',
    },
    Traffic: {
      'Final Signal Plans':           '4.10',
      'Traffic Control Plans':        '4.11',
    },
    Structures: {
      'Final Structural Plans':       '4.20',
      'Bridge Specifications':        '4.21',
      'QA/QC':                        '4.22',
    },
    'Hydraulics/Drainage': {
      'Final Drainage Plans':         '4.30',
    },
    Utilities: {
      'Final Utility Plans':          '4.40',
    },
    Environmental: {
      'Final Environmental Docs':     '4.50',
    },
    Survey: {
      'As-Built Survey':              '4.60',
    },
    'Right-of-Way': {
      'Final ROW Plans':              '4.70',
    },
    'Construction Support': {
      'CA&I Support':                 '4.80',
    },
  },
}

export function getTaskNumber(phase: string, discipline: string, taskName: string): string {
  return NUMBERS[phase]?.[discipline]?.[taskName] ?? generateTaskNumber(phase, discipline, taskName)
}

// Generate a fallback number for AI-created tasks not in the table
const _counters: Record<string, number> = {}
function generateTaskNumber(phase: string, discipline: string, _taskName: string): string {
  const phasePrefix = phase === 'Preliminary Design' ? '1'
    : phase === '25% Design' ? '2'
    : phase === '75% Design' ? '3'
    : '4'
  const discCode = { Roadway: '0', Traffic: '1', Structures: '2', 'Hydraulics/Drainage': '3',
    Utilities: '4', Environmental: '5', Survey: '6', 'Right-of-Way': '7', 'Construction Support': '8' }[discipline] ?? '9'
  const key = `${phasePrefix}.${discCode}`
  _counters[key] = (_counters[key] ?? 0) + 1
  return `${phasePrefix}.${discCode}${String(_counters[key]).padStart(1, '0')}`
}
