import { createContext, useContext, useState, ReactNode } from 'react'
import type { Project, UserRole } from '../types'
import { SAMPLE_PROJECTS } from '../data/sampleData'

interface AppContextType {
  projects: Project[]
  setProjects: (p: Project[]) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  currentRole: UserRole
  setCurrentRole: (r: UserRole) => void
  updateProject: (updated: Project) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(SAMPLE_PROJECTS[0].id)
  const [currentRole, setCurrentRole] = useState<UserRole>('PM')

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <AppContext.Provider value={{
      projects, setProjects,
      selectedProjectId, setSelectedProjectId,
      currentRole, setCurrentRole,
      updateProject,
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
