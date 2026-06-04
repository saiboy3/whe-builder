// Rate Configuration
// Primary: billing rates entered directly (what you charge clients)
// Optional: HED-640 calculator to derive billing rates from direct salaries

export const ANNUAL_INFLATION = 1.03

export interface RateConfig {
  // Direct billing rates ($/hr) — primary input
  billingRates: Record<string, number>
  // HED-640 reference fields (optional, for MassDOT submissions)
  directSalaryRates: Record<string, number>
  designMonths: number
  constructionMonths: number
  overheadMultiplier: number
  profitRate: number
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  billingRates: {
    'Principal In Charge (PIC)': 225,
    'Project Manager (PM)':      185,
    'Senior Engineer (SE)':      160,
    'Engineer (Eng)':            130,
    'Assistant Engineer (AE)':   110,
    'Engineering Technician (ET)': 95,
  },
  directSalaryRates: {
    'Principal In Charge (PIC)': 110,
    'Project Manager (PM)':       90,
    'Senior Engineer (SE)':       75,
    'Engineer (Eng)':             60,
    'Assistant Engineer (AE)':    52,
    'Engineering Technician (ET)': 45,
  },
  designMonths: 24,
  constructionMonths: 18,
  overheadMultiplier: 1.85,
  profitRate: 0.10,
}

// HED-640 formula helpers (reference / audit use)
export function designEscalationFactor(designMonths: number): number {
  const d = designMonths / 12
  return (1 + Math.pow(ANNUAL_INFLATION, d)) / 2
}

export function constructionEscalationFactor(designMonths: number, constructionMonths: number): number {
  const d = designMonths / 12
  const c = constructionMonths / 12
  return Math.pow(ANNUAL_INFLATION, d) * (1 + Math.pow(ANNUAL_INFLATION, c)) / 2
}

export function computeMeanSalaryRates(config: RateConfig): Record<string, number> {
  const factor = designEscalationFactor(config.designMonths)
  const result: Record<string, number> = {}
  for (const [cat, rate] of Object.entries(config.directSalaryRates)) {
    result[cat] = Math.round(rate * factor * 100) / 100
  }
  return result
}

/** Derive billing rates from direct salaries using HED-640 formula */
export function deriveBillingRates(config: RateConfig): Record<string, number> {
  const factor = designEscalationFactor(config.designMonths)
  const result: Record<string, number> = {}
  for (const [cat, rate] of Object.entries(config.directSalaryRates)) {
    result[cat] = Math.round(rate * factor * config.overheadMultiplier * (1 + config.profitRate) * 100) / 100
  }
  return result
}

/** Return billing rates — always the primary source */
export function computeBillingRates(config: RateConfig): Record<string, number> {
  return config.billingRates
}

export const MASSDOT_TITLE_MAP: Record<string, string> = {
  'Principal In Charge (PIC)':    'Principal In Charge (PIC)',
  'Project Manager (PM)':         'Project Manager (PM)',
  'Senior Engineer (SE)':         'Senior Engineer (SE)',
  'Engineer (Eng)':               'Engineer (Eng)',
  'Assistant Engineer (AE)':      'Assistant Engineer (AE)',
  'Engineering Technician (ET)':  'Engineering Technician (ET)',
}
