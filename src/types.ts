export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Awaiting Approval'
export type RiskLevel = 'green' | 'yellow' | 'red'
export type UserRole = 'Engineer' | 'PM' | 'Principal'
export type ApprovalStatus = 'Draft' | 'Submitted' | 'PM Approved' | 'Principal Approved' | 'Rejected'

export type Phase =
  | 'Preliminary Design'
  | '25% Design'
  | '75% Design'
  | '100% / PS&E'

export type Discipline =
  | 'Roadway'
  | 'Traffic'
  | 'Structures'
  | 'Hydraulics/Drainage'
  | 'Utilities'
  | 'Environmental'
  | 'Survey'
  | 'Right-of-Way'
  | 'Construction Support'

export type StaffCategory =
  | 'Principal In Charge (PIC)'
  | 'Project Manager (PM)'
  | 'Senior Engineer (SE)'
  | 'Engineer (Eng)'
  | 'Assistant Engineer (AE)'
  | 'Engineering Technician (ET)'

export interface HourEntry {
  [key: string]: number // staffCategory -> hours
}

export interface WBSTask {
  id: string
  taskNumber: string
  phase: Phase
  discipline: Discipline
  taskName: string
  hours: HourEntry
  adjustedHours: HourEntry
  factor: number
  notes: string
}

export interface Project {
  id: string
  contractNumber: string
  name: string
  description: string
  district: string
  pm: string
  status: ProjectStatus
  risk: RiskLevel
  approvalStatus: ApprovalStatus
  estimationComplete: number // 0-100
  tasks: WBSTask[]
  createdAt: string
  updatedAt: string
}

export interface RateTable {
  [key: string]: number // staffCategory -> $/hr
}

export const STAFF_CATEGORIES: StaffCategory[] = [
  'Principal In Charge (PIC)',
  'Project Manager (PM)',
  'Senior Engineer (SE)',
  'Engineer (Eng)',
  'Assistant Engineer (AE)',
  'Engineering Technician (ET)',
]

export const PHASES: Phase[] = [
  'Preliminary Design',
  '25% Design',
  '75% Design',
  '100% / PS&E',
]

export const DISCIPLINES: Discipline[] = [
  'Roadway',
  'Traffic',
  'Structures',
  'Hydraulics/Drainage',
  'Utilities',
  'Environmental',
  'Survey',
  'Right-of-Way',
  'Construction Support',
]

export const DEFAULT_RATES: RateTable = {
  'Principal In Charge (PIC)': 225,
  'Project Manager (PM)': 185,
  'Senior Engineer (SE)': 160,
  'Engineer (Eng)': 130,
  'Assistant Engineer (AE)': 110,
  'Engineering Technician (ET)': 95,
}

export const OVERHEAD_MULTIPLIER = 1.85
export const PROFIT_RATE = 0.10

export interface HistoricalRecord {
  id: string
  contractNumber: string
  projectName: string
  projectType: string
  district: string
  phase: string
  taskNumber: string
  taskName: string
  discipline: string
  // Hours by staff category
  estimatedHours: Record<string, number>
  actualHours: Record<string, number>
  completedDate: string
  source: 'WHE Import' | 'CSV Import' | 'Manual'
}
