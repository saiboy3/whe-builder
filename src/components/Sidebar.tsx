import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Calculator, LayoutTemplate,
  History, CheckCircle, FileBarChart2, HardHat, Download,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/estimation', label: 'Estimation Builder', icon: Calculator },
  { to: '/templates', label: 'WBS Templates', icon: LayoutTemplate },
  { to: '/history', label: 'Historical Data', icon: History },
  { to: '/approvals', label: 'Approvals', icon: CheckCircle },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/export', label: 'Export Center', icon: Download },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen flex-shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <HardHat className="text-amber-400" size={22} />
          <div>
            <div className="text-sm font-bold text-white leading-tight">WHE Builder</div>
            <div className="text-xs text-slate-400">MassDOT Estimator</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500 text-slate-900 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 text-xs text-slate-500">
        v1.0.0 — Phase 1
      </div>
    </aside>
  )
}
