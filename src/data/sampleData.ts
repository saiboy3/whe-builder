import type { Project, WBSTask } from '../types'
import { getTaskNumber } from '../lib/taskNumbers'

const makeHours = (vals: number[]) => ({
  'Principal In Charge (PIC)': vals[0] ?? 0,
  'Project Manager (PM)': vals[1] ?? 0,
  'Senior Engineer (SE)': vals[2] ?? 0,
  'Engineer (Eng)': vals[3] ?? 0,
  'Assistant Engineer (AE)': vals[4] ?? 0,
  'Engineering Technician (ET)': vals[5] ?? 0,
})

const task = (
  id: string,
  phase: WBSTask['phase'],
  discipline: WBSTask['discipline'],
  taskName: string,
  hrs: number[],
  factor = 1.0,
  notes = ''
): WBSTask => ({
  id,
  taskNumber: getTaskNumber(phase, discipline, taskName),
  phase,
  discipline,
  taskName,
  hours: makeHours(hrs),
  adjustedHours: makeHours(hrs.map(h => Math.round(h * factor))),
  factor,
  notes,
})

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'p1',
    contractNumber: '107624',
    name: 'Route 9 Corridor Improvement',
    description: 'Full reconstruction of Rt. 9 from Framingham to Natick including drainage, signals, and ADA upgrades.',
    district: 'District 3',
    pm: 'Sarah Chen',
    status: 'Active',
    risk: 'yellow',
    approvalStatus: 'Submitted',
    estimationComplete: 72,
    createdAt: '2026-01-15',
    updatedAt: '2026-05-28',
    tasks: [
      // Section 100 — Preliminary
      task('t1', 'Preliminary Design', 'Roadway', 'Project Initiation and Data Compilation', [4, 8, 16, 24, 0, 0, 4]),
      task('t2', 'Preliminary Design', 'Roadway', 'Conceptual Design and Alternatives Analysis', [2, 6, 24, 40, 16, 24, 2]),
      task('t3', 'Preliminary Design', 'Survey',  'Survey Coordination and Verification', [1, 4, 8, 16, 0, 0, 2]),
      task('t4', 'Preliminary Design', 'Environmental', 'Early Environmental Review Checklist', [1, 4, 12, 20, 0, 0, 2]),
      // Section 300 — 25%
      task('t5', '25% Design', 'Roadway', 'Preliminary Horizontal Geometry', [2, 4, 16, 32, 24, 40, 2]),
      task('t6', '25% Design', 'Roadway', 'Preliminary Vertical Geometry', [1, 4, 12, 24, 16, 32, 2]),
      task('t7', '25% Design', 'Traffic', 'Lane Configurations', [1, 4, 16, 32, 8, 8, 2]),
      task('t8', '25% Design', 'Traffic', 'Traffic Signals', [1, 2, 8, 16, 8, 8, 2]),
      task('t9', '25% Design', 'Hydraulics/Drainage', 'Preliminary Drainage Studies', [1, 4, 16, 28, 8, 16, 2], 1.1, 'Complex culvert crossing at mile 2.3'),
      // Section 400 — 75%
      task('t10', '75% Design', 'Roadway', 'Construction Plans', [4, 12, 32, 64, 48, 80, 4]),
      task('t11', '75% Design', 'Utilities', 'Utility Coordination', [1, 8, 16, 24, 0, 0, 4]),
      task('t12', '75% Design', 'Traffic', 'Traffic Signals and Plan Preparation', [2, 6, 20, 32, 16, 24, 2]),
      task('t13', '75% Design', 'Hydraulics/Drainage', 'Drainage and Water Supply Plans', [1, 4, 16, 24, 8, 16, 2]),
      // Section 450 — PS&E
      task('t14', '100% / PS&E', 'Roadway', 'Finalize Plans', [4, 8, 24, 40, 32, 64, 8]),
      task('t15', '100% / PS&E', 'Roadway', 'Finalize Special Provisions', [2, 4, 16, 24, 0, 0, 8]),
      task('t16', '100% / PS&E', 'Roadway', 'Finalize Quantity and Cost Estimate', [2, 4, 16, 20, 0, 0, 4]),
      task('t17', '100% / PS&E', 'Roadway', 'Quality Control (QC) Review', [8, 12, 24, 16, 0, 0, 4]),
    ],
  },
  {
    id: 'p2',
    contractNumber: '108891',
    name: 'I-93 Interchange 7 Bridge Rehabilitation',
    description: 'Superstructure replacement and substructure repairs at Interchange 7 northbound off-ramp structure.',
    district: 'District 6',
    pm: 'Mike Torres',
    status: 'Active',
    risk: 'red',
    approvalStatus: 'Draft',
    estimationComplete: 41,
    createdAt: '2026-03-02',
    updatedAt: '2026-05-30',
    tasks: [
      // Section 700 — Preliminary Structural
      task('t18', 'Preliminary Design', 'Structures', 'Field Investigation', [4, 8, 24, 32, 0, 0, 4]),
      task('t19', 'Preliminary Design', 'Structures', 'Preliminary Structural Analysis', [4, 8, 32, 48, 8, 0, 4]),
      task('t20', 'Preliminary Design', 'Structures', 'Preliminary Structures Report Preparation', [2, 4, 16, 24, 0, 0, 4]),
      // Section 710 — Sketch Plans
      task('t21', '25% Design', 'Structures', 'Sketch Plan Development', [2, 6, 32, 64, 16, 24, 2], 1.2, 'Seismic evaluation required'),
      task('t22', '25% Design', 'Structures', 'Establish Boring Locations', [1, 2, 8, 16, 0, 0, 2]),
      // Section 750 — Final Bridge Design
      task('t23', '75% Design', 'Structures', 'Structural Design - Superstructure', [6, 12, 48, 96, 32, 48, 4]),
      task('t24', '75% Design', 'Structures', 'Structural Design - Substructure', [4, 8, 32, 64, 24, 40, 4]),
      task('t25', '75% Design', 'Structures', 'Contract Drawings', [2, 4, 16, 32, 24, 48, 4]),
    ],
  },
  {
    id: 'p3',
    contractNumber: '106543',
    name: 'Vine Street Intersection Safety Study',
    description: 'Signal timing, geometry, and pedestrian safety improvements at 4 intersections.',
    district: 'District 4',
    pm: 'Lisa Park',
    status: 'Awaiting Approval',
    risk: 'green',
    approvalStatus: 'PM Approved',
    estimationComplete: 100,
    createdAt: '2025-11-10',
    updatedAt: '2026-04-12',
    tasks: [
      // Section 100 — Preliminary
      task('t26', 'Preliminary Design', 'Traffic', 'Intersection Control Evaluation', [2, 4, 16, 24, 0, 0, 2]),
      task('t27', 'Preliminary Design', 'Traffic', 'Road Safety Audit', [1, 4, 16, 24, 0, 0, 2]),
      // Section 300 — 25%
      task('t28', '25% Design', 'Traffic', 'Traffic Signals', [1, 4, 16, 32, 8, 16, 2]),
      task('t29', '25% Design', 'Traffic', 'Lane Configurations', [1, 4, 16, 24, 12, 24, 2]),
      task('t30', '25% Design', 'Roadway', 'Pavement Design', [1, 4, 12, 20, 8, 16, 2]),
      // Section 450 — PS&E
      task('t31', '100% / PS&E', 'Traffic', 'Traffic Control Agreement Submission', [2, 4, 16, 24, 16, 32, 4]),
      task('t32', '100% / PS&E', 'Roadway', 'Finalize Plans', [2, 4, 12, 20, 8, 16, 8]),
      task('t33', '100% / PS&E', 'Roadway', 'Quality Control (QC) Review', [6, 8, 16, 8, 0, 0, 2]),
    ],
  },
]
