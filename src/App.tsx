import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import EstimationBuilder from './pages/EstimationBuilder'
import Templates from './pages/Templates'
import Historical from './pages/Historical'
import Approvals from './pages/Approvals'
import ExportCenter from './pages/ExportCenter'
import Reports from './pages/Reports'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-slate-100">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/estimation" element={<EstimationBuilder />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/history" element={<Historical />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/export" element={<ExportCenter />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
