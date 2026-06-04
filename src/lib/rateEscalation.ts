// HED-640 Salary Rate Escalation Engine
// Source: MassDOT Highway Division Form HED-640 (2019)
//
// Design Phase Mean Rate   = Existing Rate × (1 + r^d) / 2
// Construction Phase Rate  = Existing Rate × r^d × (1 + r^c) / 2
// where r = 1.03 (3% annual inflation), d = design duration (years), c = construction duration (years)

export const ANNUAL_INFLATION = 1.03

export interface RateConfig {
  // Firm's current average direct salary rates ($/hr)
  existingRates: Record<string, number>
  // Project durations
  designMonths: number
  constructionMonths: number
  // Overhead multiplier (firm-specific, typically 1.5–2.5)
  overheadMultiplier: number
  // Profit rate
  profitRate: number
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  existingRates: {
    'Principal':       110,   // PIC — direct salary, not billing rate
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

/** Escalation factor for design phase */
export function designEscalationFactor(designMonths: number): number {
  const d = designMonths / 12
  return (1 + Math.pow(ANNUAL_INFLATION, d)) / 2
}

/** Escalation factor for construction phase */
export function constructionEscalationFactor(designMonths: number, constructionMonths: number): number {
  const d = designMonths / 12
  const c = constructionMonths / 12
  return Math.pow(ANNUAL_INFLATION, d) * (1 + Math.pow(ANNUAL_INFLATION, c)) / 2
}

/** Mean direct salary rate for design phase */
export function designMeanRate(existingRate: number, designMonths: number): number {
  return existingRate * designEscalationFactor(designMonths)
}

/** Billing rate = mean salary × overhead multiplier × (1 + profit) */
export function billingRate(
  existingRate: number,
  designMonths: number,
  overheadMultiplier: number,
  profitRate: number
): number {
  const mean = designMeanRate(existingRate, designMonths)
  return mean * overheadMultiplier * (1 + profitRate)
}

/** Compute all billing rates for a given config */
export function computeBillingRates(config: RateConfig): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [cat, rate] of Object.entries(config.existingRates)) {
    result[cat] = Math.round(billingRate(rate, config.designMonths, config.overheadMultiplier, config.profitRate) * 100) / 100
  }
  return result
}

/** Compute mean direct salary rates (for HED-640 submission) */
export function computeMeanSalaryRates(config: RateConfig): Record<string, number> {
  const factor = designEscalationFactor(config.designMonths)
  const result: Record<string, number> = {}
  for (const [cat, rate] of Object.entries(config.existingRates)) {
    result[cat] = Math.round(rate * factor * 100) / 100
  }
  return result
}

// MassDOT standardized title mapping
export const MASSDOT_TITLE_MAP: Record<string, string> = {
  'Principal':        'Principal In Charge (PIC)',
  'Project Manager':  'Project Manager (PM)',
  'Senior Engineer':  'Senior Engineer (SE)',
  'Engineer':         'Engineer (Eng)',
  'Designer':         'Assistant Engineer (AE)',
  'CADD':             'Engineering Technician (ET)',
  'Clerical':         'Administrative',
}
