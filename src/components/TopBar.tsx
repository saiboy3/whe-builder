import { Bell, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { projects, selectedProjectId, setSelectedProjectId } = useApp()
  const { user } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      <select
        value={selectedProjectId ?? ''}
        onChange={e => setSelectedProjectId(e.target.value)}
        className="text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 max-w-xs"
      >
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.contractNumber} — {p.name}</option>
        ))}
      </select>

      <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-100 rounded-md px-3 py-1.5">
        <Search size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 w-full"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        {user && (
          <span className="text-xs text-slate-500">
            Signed in as <span className="font-semibold text-slate-700">{user.name}</span>
            <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-xs">{user.role}</span>
          </span>
        )}

        <button className="relative text-slate-500 hover:text-slate-800">
          <Bell size={19} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">2</span>
        </button>
      </div>
    </header>
  )
}
