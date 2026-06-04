import { useState } from 'react'
import { TrendingUp, BarChart3, GitCommitHorizontal, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

interface VarianceRow {
  discipline: string
  estimated: number
  actual: number
  variance: number
  variancePct: number
  projects: number
}

interface ProjectPoint {
  contract: string
  name: string
  type: string
  district: string
  estimated: number
  actual: number
  variance: number
  completed: string
}

const STATIC_VARIANCE: VarianceRow[] = [
  { discipline: 'Roadway',             estimated: 1240, actual: 1387, variance: 147,  variancePct: 11.9,  projects: 8 },
  { discipline: 'Traffic',             estimated: 320,  actual: 338,  variance: 18,   variancePct: 5.6,   projects: 6 },
  { discipline: 'Structures',          estimated: 890,  actual: 1024, variance: 134,  variancePct: 15.1,  projects: 4 },
  { discipline: 'Hydraulics/Drainage', estimated: 280,  actual: 334,  variance: 54,   variancePct: 19.3,  projects: 5 },
  { discipline: 'Utilities',           estimated: 160,  actual: 155,  variance: -5,   variancePct: -3.1,  projects: 4 },
  { discipline: 'Environmental',       estimated: 120,  actual: 118,  variance: -2,   variancePct: -1.7,  projects: 3 },
  { discipline: 'Survey',              estimated: 200,  actual: 212,  variance: 12,   variancePct: 6.0,   projects: 5 },
]

const STATIC_PROJECTS: ProjectPoint[] = [
  { contract: '104211', name: 'US-1 Widening Saugus',     type: 'Roadway',    district: 'D4', estimated: 680, actual: 812,  variance: 132,  completed: '2024-06' },
  { contract: '103887', name: 'Rt. 128 Bridge Deck',      type: 'Structures', district: 'D6', estimated: 890, actual: 1024, variance: 134,  completed: '2023-09' },
  { contract: '105102', name: 'Main St. Signal Upgrade',  type: 'Traffic',    district: 'D3', estimated: 240, actual: 234,  variance: -6,   completed: '2024-11' },
  { contract: '102944', name: 'Rt. 2 Drainage',           type: 'Hydraulics', district: 'D3', estimated: 310, actual: 388,  variance: 78,   completed: '2023-04' },
  { contract: '101788', name: 'Tremont St. Ped Safety',   type: 'Roadway',    district: 'D6', estimated: 420, actual: 440,  variance: 20,   completed: '2022-12' },
  { contract: '100452', name: 'Rt. 16 Bridge Rehab',      type: 'Structures', district: 'D4', estimated: 720, actual: 695,  variance: -25,  completed: '2022-08' },
  { contract: '106001', name: 'I-495 Interchange Study',  type: 'Roadway',    district: 'D3', estimated: 980, actual: 1140, variance: 160,  completed: '2024-03' },
]

type Tab = 'variance' | 'scatter' | 'projects'

export default function Analytics() {
  const { projects, historicalRecords } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('variance')

  // Merge static + imported historical for variance chart
  const importedVariance = historicalRecords.reduce<Record<string, { est: number; act: number; count: number }>>((acc, r) => {
    const disc = r.discipline
    if (!acc[disc]) acc[disc] = { est: 0, act: 0, count: 0 }
    const est = Object.values(r.estimatedHours).reduce((s, v) => s + v, 0)
    const act = Object.values(r.actualHours).reduce((s, v) => s + v, 0)
    if (est > 0) { acc[disc].est += est; acc[disc].act += act; acc[disc].count++ }
    return acc
  }, {})

  const variance: VarianceRow[] = historicalRecords.length > 0
    ? Object.entries(importedVariance).map(([discipline, d]) => ({
        discipline,
        estimated: d.est,
        actual: d.act,
        variance: d.act - d.est,
        variancePct: d.est > 0 ? ((d.act - d.est) / d.est) * 100 : 0,
        projects: d.count,
      }))
    : STATIC_VARIANCE

  // PM accuracy from active projects
  const pmSummary = projects.reduce<Record<string, { projects: number; totalHours: number }>>((acc, p) => {
    const pm = p.pm ?? 'Unassigned'
    if (!acc[pm]) acc[pm] = { projects: 0, totalHours: 0 }
    acc[pm].projects++
    acc[pm].totalHours += (p.tasks ?? []).reduce((s: number, t: any) =>
      s + Object.values(t.adjustedHours as Record<string, number>).reduce((a, v) => a + v, 0), 0)
    return acc
  }, {})

  const tabs: [Tab, string, typeof BarChart3][] = [
    ['variance', 'Variance by Discipline', BarChart3],
    ['scatter',  'Est. vs. Actual',        GitCommitHorizontal],
    ['projects', 'Completed Projects',     TrendingUp],
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <button
          onClick={() => navigate('/settings?tab=import')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-amber-300 transition-colors"
        >
          <Upload size={14} /> Import Historical Data
        </button>
      </div>

      {historicalRecords.length > 0 && (
        <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {historicalRecords.length} imported records — variance data reflects your firm's actual project history
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Variance chart */}
      {tab === 'variance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-5">Estimated vs. Actual Hours by Discipline</h2>
            <div className="space-y-4">
              {variance.map(row => {
                const maxVal = Math.max(...variance.map(r => r.actual)) + 50
                return (
                  <div key={row.discipline} className="flex items-center gap-4">
                    <div className="w-36 text-xs text-slate-600 text-right flex-shrink-0">{row.discipline}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 w-16 text-right">{row.estimated}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div className="bg-blue-400 h-3.5 rounded-full" style={{ width: `${(row.estimated / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs text-blue-500 font-medium w-8">Est.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 w-16 text-right">{row.actual}</div>
                        <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden">
                          <div
                            className={`h-3.5 rounded-full ${row.variancePct > 10 ? 'bg-red-400' : row.variancePct > 5 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${(row.actual / maxVal) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-12 ${row.variancePct > 10 ? 'text-red-500' : row.variancePct > 5 ? 'text-amber-500' : 'text-green-500'}`}>
                          {row.variancePct > 0 ? '+' : ''}{row.variancePct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Estimated</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> On target (&le;5%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 5–10% over</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> &gt;10% over</span>
            </div>
          </div>

          {/* PM accuracy */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">PM Summary</h2>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-5 py-3 text-left">Project Manager</th>
                <th className="px-4 py-3 text-right">Projects</th>
                <th className="px-4 py-3 text-right">Total Est. Hours</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(pmSummary).map(([pm, d]) => (
                  <tr key={pm} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{pm}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{d.projects}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{d.totalHours.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scatter */}
      {tab === 'scatter' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Estimated vs. Actual Hours</h2>
          <p className="text-xs text-slate-400 mb-6">Points above the diagonal = underestimated</p>
          <svg viewBox="0 0 600 400" className="w-full max-w-2xl">
            {[0, 200, 400, 600, 800, 1000].map(v => {
              const x = 60 + (v / 1200) * 500
              const y = 380 - (v / 1200) * 340
              return (
                <g key={v}>
                  <line x1={x} y1={20} x2={x} y2={380} stroke="#f1f5f9" strokeWidth={1} />
                  <line x1={60} y1={y} x2={560} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                  <text x={x} y={395} textAnchor="middle" fontSize={10} fill="#94a3b8">{v}</text>
                  <text x={48} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{v}</text>
                </g>
              )
            })}
            <line x1={60} y1={380} x2={560} y2={40} stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="6,4" />
            <text x={480} y={52} fontSize={10} fill="#94a3b8">Perfect estimate</text>
            {STATIC_PROJECTS.map(p => {
              const cx = 60 + (p.estimated / 1200) * 500
              const cy = 380 - (p.actual / 1200) * 340
              const color = p.variance > 50 ? '#ef4444' : p.variance < -20 ? '#22c55e' : '#f59e0b'
              return (
                <g key={p.contract}>
                  <circle cx={cx} cy={cy} r={7} fill={color} fillOpacity={0.75} stroke={color} strokeWidth={1.5} />
                  <text x={cx + 10} y={cy + 4} fontSize={9} fill="#475569">{p.name.split(' ').slice(0, 2).join(' ')}</text>
                </g>
              )
            })}
            <text x={300} y={412} textAnchor="middle" fontSize={11} fill="#64748b">Estimated Hours</text>
            <text x={14} y={200} textAnchor="middle" fontSize={11} fill="#64748b" transform="rotate(-90, 14, 200)">Actual Hours</text>
          </svg>
        </div>
      )}

      {/* Completed projects table */}
      {tab === 'projects' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Completed Projects</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
              <th className="px-5 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Est. Hrs</th>
              <th className="px-4 py-3 text-right">Actual Hrs</th>
              <th className="px-4 py-3 text-right">Variance</th>
              <th className="px-4 py-3 text-left">Accuracy</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {STATIC_PROJECTS.map(p => {
                const pct = (p.variance / p.estimated) * 100
                return (
                  <tr key={p.contract} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.contract} · {p.district}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{p.type}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.estimated}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">{p.actual}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {p.variance > 0 ? '+' : ''}{p.variance}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${Math.abs(pct) < 5 ? 'bg-green-400' : Math.abs(pct) < 15 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${Math.max(0, 100 - Math.abs(pct))}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{(100 - Math.abs(pct)).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
