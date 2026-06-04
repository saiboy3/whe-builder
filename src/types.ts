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
  | 'Principal'
  | 'Project Manager'
  | 'Senior Engineer'
  | 'Engineer'
  | 'Designer'
  | 'CADD'
  | 'Clerical'

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
  'Principal',
  'Project Manager',
  'Senior Engineer',
  'Engineer',
  'Designer',
  'CADD',
  'Clerical',
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
  'Principal': 225,
  'Project Manager': 185,
  'Senior Engineer': 160,
  'Engineer': 130,
  'Designer': 110,
  'CADD': 95,
  'Clerical': 75,
}

export const OVERHEAD_MULTIPLIER = 1.85
export const PROFIT_RATE = 0.10
