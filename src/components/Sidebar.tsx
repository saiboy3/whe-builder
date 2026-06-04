import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Calculator, LayoutTemplate,
  History, CheckCircle, FileBarChart2, HardHat, Download, Sparkles, LogOut,
  Upload, Settings2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/estimation', label: 'Estimation Builder', icon: Calculator },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/templates', label: 'WBS Templates', icon: LayoutTemplate },
  { to: '/history', label: 'Historical Data', icon: History },
  { to: '/approvals', label: 'Approvals', icon: CheckCircle },
  { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/export', label: 'Export Center', icon: Download },
  { to: '/import', label: 'Import Data', icon: Upload },
  { to: '/rates', label: 'Rate Configuration', icon: Settings2 },
]

const roleColors: Record<string, string> = {
  PRINCIPAL: 'bg-amber-500 text-slate-900',
  PM: 'bg-blue-500 text-white',
  ENGINEER: 'bg-green-500 text-white',
  ADMIN: 'bg-purple-500 text-white',
}

export default function Sidebar() {
  const { user, logout } = useAuth()

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

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? label === 'AI Assistant'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-amber-500 text-slate-900 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColors[user.role] ?? 'bg-slate-600 text-white'}`}>
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
