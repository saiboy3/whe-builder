import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface VarianceRow {
  discipline: string
  estimated: number
  actual: number
  variance: number
  variancePct: number
  projects: number
}

const HISTORICAL: VarianceRow[] = [
  { discipline: 'Roadway', estimated: 1240, actual: 1387, variance: 147, variancePct: 11.9, projects: 8 },
  { discipline: 'Traffic', estimated: 320, actual: 338, variance: 18, variancePct: 5.6, projects: 6 },
  { discipline: 'Structures', estimated: 890, actual: 1024, variance: 134, variancePct: 15.1, projects: 4 },
  { discipline: 'Hydraulics/Drainage', estimated: 280, actual: 334, variance: 54, variancePct: 19.3, projects: 5 },
  { discipline: 'Utilities', estimated: 160, actual: 155, variance: -5, variancePct: -3.1, projects: 4 },
  { discipline: 'Environmental', estimated: 120, actual: 118, variance: -2, variancePct: -1.7, projects: 3 },
  { discipline: 'Survey', estimated: 200, actual: 212, variance: 12, variancePct: 6.0, projects: 5 },
]

const PROJECTS_HIST = [
  { contract: '104211', name: 'US-1 Widening Saugus', type: 'Roadway', district: 'D4', estimated: 680, actual: 812, variance: 132, completed: '2024-06' },
  { contract: '103887', name: 'Rt. 128 Bridge Deck', type: 'Structures', district: 'D6', estimated: 890, actual: 1024, variance: 134, completed: '2023-09' },
  { contract: '105102', name: 'Main St. Signal Upgrade', type: 'Traffic', district: 'D3', estimated: 240, actual: 234, variance: -6, completed: '2024-11' },
  { contract: '102944', name: 'Rt. 2 Drainage', type: 'Hydraulics', district: 'D3', estimated: 310, actual: 388, variance: 78, completed: '2023-04' },
  { contract: '101788', name: 'Tremont St. Ped Safety', type: 'Roadway', district: 'D6', estimated: 420, actual: 440, variance: 20, completed: '2022-12' },
]

export default function Historical() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Historical Analytics</h1>

      {/* Variance by Discipline */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Estimate vs. Actual — By Discipline</h2>
          <p className="text-xs text-slate-400 mt-0.5">Aggregated across all completed projects</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left">Discipline</th>
            <th className="px-4 py-3 text-right">Est. Hours</th>
            <th className="px-4 py-3 text-right">Actual Hours</th>
            <th className="px-4 py-3 text-right">Variance</th>
            <th className="px-4 py-3 text-right">Variance %</th>
            <th className="px-4 py-3 text-center">Projects</th>
            <th className="px-5 py-3 text-left">Trend</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {HISTORICAL.map(row => (
              <tr key={row.discipline} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{row.discipline}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.estimated}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.actual}</td>
                <td className={`px-4 py-3 text-right font-semibold ${row.variance > 0 ? 'text-red-600' : row.variance < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                  {row.variance > 0 ? '+' : ''}{row.variance}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${row.variancePct > 10 ? 'text-red-600' : row.variancePct > 5 ? 'text-amber-600' : 'text-green-600'}`}>
                  {row.variancePct > 0 ? '+' : ''}{row.variancePct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center text-slate-500">{row.projects}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${row.variancePct > 10 ? 'bg-red-400' : row.variancePct > 5 ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${Math.min(Math.abs(row.variancePct) * 3, 100)}%` }}
                      />
                    </div>
                    {row.variancePct > 5 ? <TrendingUp size={14} className="text-red-400" />
                      : row.variancePct < 0 ? <TrendingDown size={14} className="text-green-400" />
                      : <Minus size={14} className="text-slate-300" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historical Projects */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Completed Projects</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click any project to use as a reference for a new estimate</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left">Project</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">District</th>
            <th className="px-4 py-3 text-right">Est. Hrs</th>
            <th className="px-4 py-3 text-right">Actual Hrs</th>
            <th className="px-4 py-3 text-right">Variance</th>
            <th className="px-4 py-3 text-left">Completed</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {PROJECTS_HIST.map(p => (
              <tr key={p.contract} className="hover:bg-amber-50 cursor-pointer transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.contract}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.type}</td>
                <td className="px-4 py-3 text-slate-600">{p.district}</td>
                <td className="px-4 py-3 text-right text-slate-600">{p.estimated}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{p.actual}</td>
                <td className={`px-4 py-3 text-right font-semibold ${p.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {p.variance > 0 ? '+' : ''}{p.variance}
                </td>
                <td className="px-4 py-3 text-slate-500">{p.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
