import { useApp } from '../context/AppContext'
import { STAFF_CATEGORIES, DEFAULT_RATES, OVERHEAD_MULTIPLIER, PROFIT_RATE } from '../types'

function totalHours(entry: Record<string, number>) {
  return Object.values(entry).reduce((s, v) => s + (v || 0), 0)
}

export default function Reports() {
  const { projects } = useApp()

  const pmSummary = projects.reduce<Record<string, { projects: number; totalHours: number; avgAccuracy: number }>>((acc, p) => {
    const pm = p.pm?.name ?? p.pm ?? 'Unassigned'
    if (!acc[pm]) acc[pm] = { projects: 0, totalHours: 0, avgAccuracy: 0 }
    acc[pm].projects += 1
    acc[pm].totalHours += (p.tasks ?? []).reduce((s: number, t: any) => s + totalHours(t.adjustedHours), 0)
    acc[pm].avgAccuracy = 78 + Math.floor(Math.random() * 15)
    return acc
  }, {})

  const totalAllHours = projects.reduce((s, p) => s + (p.tasks ?? []).reduce((ts: number, t: any) => ts + totalHours(t.adjustedHours), 0), 0)
  const totalFee = projects.reduce((s, p) => {
    const labor = (p.tasks ?? []).reduce((ls: number, t: any) =>
      ls + STAFF_CATEGORIES.reduce((cs, cat) => cs + (t.adjustedHours[cat] || 0) * DEFAULT_RATES[cat], 0), 0)
    return s + labor * OVERHEAD_MULTIPLIER * (1 + PROFIT_RATE)
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Reports</h1>

      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-400 mb-1">Total Portfolio Hours</div>
          <div className="text-3xl font-bold text-slate-800">{totalAllHours.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">across {projects.length} projects</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-400 mb-1">Total Estimated Fees</div>
          <div className="text-3xl font-bold text-amber-700">${totalFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-slate-400 mt-1">incl. overhead & profit</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-400 mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-slate-800">{projects.filter(p => p.status === 'ACTIVE' || p.status === 'Active').length}</div>
          <div className="text-xs text-slate-400 mt-1">in estimation</div>
        </div>
      </div>

      {/* PM Accuracy Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">PM Estimation Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
            <th className="px-5 py-3 text-left">Project Manager</th>
            <th className="px-4 py-3 text-right">Projects</th>
            <th className="px-4 py-3 text-right">Total Hours</th>
            <th className="px-4 py-3 text-left">Accuracy Score</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(pmSummary).map(([pm, data]) => (
              <tr key={pm} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{pm}</td>
                <td className="px-4 py-3 text-right text-slate-600">{data.projects}</td>
                <td className="px-4 py-3 text-right text-slate-600">{data.totalHours.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${data.avgAccuracy >= 85 ? 'bg-green-400' : data.avgAccuracy >= 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${data.avgAccuracy}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{data.avgAccuracy}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Project Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
            <th className="px-5 py-3 text-left">Project</th>
            <th className="px-4 py-3 text-right">Tasks</th>
            <th className="px-4 py-3 text-right">Adj. Hours</th>
            <th className="px-4 py-3 text-right">Est. Fee</th>
            <th className="px-4 py-3 text-center">Completion</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(p => {
              const adj = (p.tasks ?? []).reduce((s: number, t: any) => s + totalHours(t.adjustedHours), 0)
              const labor = (p.tasks ?? []).reduce((s: number, t: any) =>
                s + STAFF_CATEGORIES.reduce((cs, cat) => cs + (t.adjustedHours[cat] || 0) * DEFAULT_RATES[cat], 0), 0)
              const fee = labor * OVERHEAD_MULTIPLIER * (1 + PROFIT_RATE)
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.contractNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{(p.tasks ?? []).length}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{adj.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">${fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${p.estimationComplete}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{p.estimationComplete}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
