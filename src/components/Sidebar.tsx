import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Calculator,
  BarChart3, CheckCircle, HardHat, Sparkles, LogOut, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',           label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/projects',   label: 'Projects',             icon: FolderOpen },
  { to: '/estimation', label: 'Estimation Builder',   icon: Calculator },
  { to: '/assistant',  label: 'AI Assistant',         icon: Sparkles },
  { to: '/analytics',  label: 'Analytics',            icon: BarChart3 },
  { to: '/approvals',  label: 'Approvals',            icon: CheckCircle },
]

const roleColors: Record<string, string> = {
  PRINCIPAL: 'bg-amber-500 text-slate-900',
  PM:        'bg-blue-500 text-white',
  ENGINEER:  'bg-green-500 text-white',
  ADMIN:     'bg-purple-500 text-white',
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <HardHat className="text-amber-400 flex-shrink-0" size={20} />
          <div>
            <div className="text-sm font-bold text-white leading-tight">WHE Builder</div>
            <div className="text-xs text-slate-500">MassDOT Estimator</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? to === '/assistant'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-amber-500 text-slate-900 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + settings */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`
          }
        >
          <Settings size={15} />
          Settings
        </NavLink>

        {user && (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColors[user.role] ?? 'bg-slate-600 text-white'}`}>
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-300 truncate">{user.name}</div>
                <div className="text-xs text-slate-600 capitalize">{user.role.toLowerCase()}</div>
              </div>
            </div>
            <button onClick={logout} className="text-slate-600 hover:text-red-400 transition-colors ml-1" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
