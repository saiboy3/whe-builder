import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Project, HistoricalRecord } from '../types'
import type { RateConfig } from '../lib/rateEscalation'
import { DEFAULT_RATE_CONFIG, computeBillingRates } from '../lib/rateEscalation'
import { SAMPLE_PROJECTS } from '../data/sampleData'

interface AppContextType {
  projects: Project[]
  setProjects: (p: Project[]) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  updateProject: (updated: Project) => void
  // Rate configuration
  rateConfig: RateConfig
  setRateConfig: (r: RateConfig) => void
  billingRates: Record<string, number>
  // Historical records
  historicalRecords: HistoricalRecord[]
  addHistoricalRecords: (records: HistoricalRecord[]) => void
  clearHistoricalRecords: () => void
}

const AppContext = createContext<AppContextType | null>(null)

function loadRateConfig(): RateConfig {
  try {
    const stored = localStorage.getItem('whe_rate_config')
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_RATE_CONFIG
}

function loadHistoricalRecords(): HistoricalRecord[] {
  try {
    const stored = localStorage.getItem('whe_historical')
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(SAMPLE_PROJECTS[0].id)
  const [rateConfig, _setRateConfig] = useState<RateConfig>(loadRateConfig)
  const [historicalRecords, _setHistoricalRecords] = useState<HistoricalRecord[]>(loadHistoricalRecords)

  const billingRates = computeBillingRates(rateConfig)

  function setRateConfig(config: RateConfig) {
    _setRateConfig(config)
    localStorage.setItem('whe_rate_config', JSON.stringify(config))
  }

  function addHistoricalRecords(records: HistoricalRecord[]) {
    _setHistoricalRecords(prev => {
      const merged = [...prev, ...records]
      localStorage.setItem('whe_historical', JSON.stringify(merged))
      return merged
    })
  }

  function clearHistoricalRecords() {
    _setHistoricalRecords([])
    localStorage.removeItem('whe_historical')
  }

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <AppContext.Provider value={{
      projects, setProjects,
      selectedProjectId, setSelectedProjectId,
      updateProject,
      rateConfig, setRateConfig, billingRates,
      historicalRecords, addHistoricalRecords, clearHistoricalRecords,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
