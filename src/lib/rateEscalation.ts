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
    'Principal':       225,
    'Project Manager': 185,
    'Senior Engineer': 160,
    'Engineer':        130,
    'Designer':        110,
    'CADD':             95,
    'Clerical':         75,
  },
  directSalaryRates: {
    'Principal':       110,
    'Project Manager':  90,
    'Senior Engineer':  75,
    'Engineer':         60,
    'Designer':         52,
    'CADD':             45,
    'Clerical':         35,
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
  'Principal':        'PIC — Principal In Charge',
  'Project Manager':  'PM — Project Manager',
  'Senior Engineer':  'SE — Senior Engineer',
  'Engineer':         'Eng — Engineer',
  'Designer':         'AE — Assistant Engineer',
  'CADD':             'ET — Engineering Technician',
  'Clerical':         'Admin — Administrative',
}
