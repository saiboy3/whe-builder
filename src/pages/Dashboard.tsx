import { AlertTriangle, CheckCircle2, Clock, FolderOpen, Plus, TrendingUp, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const riskColors: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  GREEN: 'bg-green-100 text-green-700',
  YELLOW: 'bg-amber-100 text-amber-700',
  RED: 'bg-red-100 text-red-700',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-700',
  ON_HOLD: 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const { projects } = useApp()
  const navigate = useNavigate()

  const active = projects.filter(p => p.status === 'ACTIVE' || p.status === 'Active')
  const awaitingApproval = projects.filter(p =>
    p.approvalStatus === 'SUBMITTED' || p.approvalStatus === 'PM_APPROVED' || p.status === 'AWAITING_APPROVAL'
  )
  const redRisk = projects.filter(p => p.risk === 'RED' || p.risk === 'red')

  const avgAccuracy = 81

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">MassDOT Work Hour Estimation Platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={15} /> Import MassDOT Template
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={<FolderOpen size={20} className="text-blue-500" />} label="Active Projects" value={active.length} bg="bg-blue-50" />
        <KpiCard icon={<Clock size={20} className="text-amber-500" />} label="Awaiting Approval" value={awaitingApproval.length} bg="bg-amber-50" />
        <KpiCard icon={<TrendingUp size={20} className="text-green-500" />} label="Estimation Accuracy" value={`${avgAccuracy}%`} bg="bg-green-50" />
        <KpiCard icon={<AlertTriangle size={20} className="text-red-500" />} label="Budget Risk Alerts" value={redRisk.length} bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-xs text-amber-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.slice(0, 5).map(p => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('/estimation')}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.contractNumber} · {p.district ?? p.district}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${p.estimationComplete}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8">{p.estimationComplete}%</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[p.risk] ?? 'bg-slate-100 text-slate-600'}`}>
                  {(p.risk ?? '').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Approvals Queue */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Approvals Queue</h2>
            <button onClick={() => navigate('/approvals')} className="text-xs text-amber-600 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {awaitingApproval.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 size={24} className="text-green-400" />
                All estimates are up to date
              </div>
            )}
            {awaitingApproval.map(p => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('/approvals')}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">PM: {p.pm?.name ?? p.pm}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.approvalStatus] ?? 'bg-slate-100'}`}>
                  {(p.approvalStatus ?? '').replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-5 flex items-center gap-4`}>
      <div className="p-2.5 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
