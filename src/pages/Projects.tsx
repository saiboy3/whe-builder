import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import NewProjectModal from '../components/NewProjectModal'

const riskDot: Record<string, string> = {
  GREEN: 'bg-green-500', green: 'bg-green-500',
  YELLOW: 'bg-amber-400', yellow: 'bg-amber-400',
  RED: 'bg-red-500', red: 'bg-red-500',
}

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  Active: 'bg-blue-100 text-blue-700',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-700',
  'Awaiting Approval': 'bg-amber-100 text-amber-700',
  ON_HOLD: 'bg-slate-100 text-slate-600',
  'On Hold': 'bg-slate-100 text-slate-600',
  COMPLETED: 'bg-green-100 text-green-700',
  Completed: 'bg-green-100 text-green-700',
}

const approvalBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  Draft: 'bg-slate-100 text-slate-500',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  Submitted: 'bg-blue-100 text-blue-700',
  PM_APPROVED: 'bg-purple-100 text-purple-700',
  'PM Approved': 'bg-purple-100 text-purple-700',
  PRINCIPAL_APPROVED: 'bg-green-100 text-green-700',
  'Principal Approved': 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function Projects() {
  const { projects, setSelectedProjectId } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)

  const districts = [...new Set(projects.map(p => p.district).filter(Boolean))]

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.contractNumber?.includes(q)
    const matchDistrict = !filterDistrict || p.district === filterDistrict
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchDistrict && matchStatus
  })

  function openProject(id: string) {
    setSelectedProjectId(id)
    navigate('/estimation')
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-100 rounded-lg px-3 py-2">
          <Search size={15} className="text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or contract #..."
            className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 w-full"
          />
        </div>
        <Filter size={15} className="text-slate-400" />
        <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} projects</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">District</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">PM</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Approval</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimate %</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr
                key={p.id}
                className="hover:bg-amber-50 cursor-pointer transition-colors"
                onClick={() => openProject(p.id)}
              >
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.contractNumber}</div>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{p.district}</td>
                <td className="px-4 py-3.5 text-slate-600">{p.pm?.name ?? p.pm ?? '—'}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {(p.status ?? '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${approvalBadge[p.approvalStatus] ?? 'bg-slate-100'}`}>
                    {(p.approvalStatus ?? '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${p.estimationComplete}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{p.estimationComplete}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${riskDot[p.risk] ?? 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-600 capitalize">{(p.risk ?? '').toLowerCase()}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No projects match your filters.</div>
        )}
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
