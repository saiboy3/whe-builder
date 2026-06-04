import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import EstimationBuilder from './pages/EstimationBuilder'
import EstimationAssistant from './pages/EstimationAssistant'
import Analytics from './pages/Analytics'
import Approvals from './pages/Approvals'
import Settings from './pages/Settings'

function AppShell() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/projects"   element={<Projects />} />
              <Route path="/estimation" element={<EstimationBuilder />} />
              <Route path="/assistant"  element={<EstimationAssistant />} />
              <Route path="/analytics"  element={<Analytics />} />
              <Route path="/approvals"  element={<Approvals />} />
              <Route path="/settings"   element={<Settings />} />
              {/* Legacy redirects */}
              <Route path="/history"    element={<Navigate to="/analytics" replace />} />
              <Route path="/reports"    element={<Navigate to="/analytics" replace />} />
              <Route path="/export"     element={<Navigate to="/estimation" replace />} />
              <Route path="/templates"  element={<Navigate to="/settings?tab=templates" replace />} />
              <Route path="/import"     element={<Navigate to="/settings?tab=import" replace />} />
              <Route path="/rates"      element={<Navigate to="/settings?tab=rates" replace />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
