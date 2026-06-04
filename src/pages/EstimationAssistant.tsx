import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { STAFF_CATEGORIES } from '../types'
import type { WBSTask, Phase, Discipline } from '../types'
import { getTaskNumber } from '../lib/taskNumbers'

// Real MassDOT roadway project types from projectinfo portal
const PROJECT_TYPES = [
  // Full Reconstruction
  'Hwy Reconstr - Restr and Rehab',
  'Hwy Reconstr - Major Widening',
  'Roadway Modernization',
  'Roadway Additional Capacity',
  'Roadway Minor Widening',
  'New Road',
  'Roadway - Reconstr - Sidewalks and Curbing',
  // Intersection
  'Intersection Reconstruction',
  'Safety Improvements',
  'Traffic Signal Upgrades',
  'Intelligent Transportation Sys',
  // Bridge
  'Bridge Replacement',
  'Bridge Rehabilitation',
  'Bridge Deck Replacement',
  'New Bridge',
  // Pavement
  'Resurfacing',
  'Resurfacing Interstate',
  'Resurfacing DOT Owned Non-Interstate',
  'Pavement Rehabilitation',
  'Limited Access Pavement Preservation',
  // Drainage
  'Drainage',
  'Culvert Replacement',
  // Active Transportation
  'Bike Facility Construction',
  'Shared Use Path Construction',
  'Sidewalk Construction',
  'Accessibility Improvements',
  // Other
  'Targeted Modernization - Multiple Locations',
]

// Which primary metric to show based on project type
const PRIMARY_METRIC: Record<string, 'roadMiles' | 'bridges' | 'intersections'> = {
  'Bridge Replacement': 'bridges',
  'Bridge Rehabilitation': 'bridges',
  'Bridge Deck Replacement': 'bridges',
  'New Bridge': 'bridges',
  'Intersection Reconstruction': 'intersections',
  'Safety Improvements': 'intersections',
  'Traffic Signal Upgrades': 'intersections',
  'Intelligent Transportation Sys': 'intersections',
  'Accessibility Improvements': 'intersections',
}
const DISTRICTS = ['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6']
const PHASES_LIST = ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E']

interface EstimateResult {
  summary: string
  confidenceScore: number
  totalEstimatedHours: number
  disciplines: Array<{
    discipline: string
    tasks: Array<{
      phase: string
      taskName: string
      hours: Record<string, number>
      lowHours: number
      likelyHours: number
      highHours: number
      rationale: string
    }>
  }>
  riskFlags: string[]
  similarProjects: string[]
  assumptions: string[]
}


export default function EstimationAssistant() {
  const { projects, selectedProjectId, updateProject } = useApp()
  const project = projects.find(p => p.id === selectedProjectId)

  const [form, setForm] = useState({
    projectType: 'Hwy Reconstr - Restr and Rehab',
    district: 'District 3',
    description: '',
    complexity: 3,
    roadMiles: '',
    bridges: '',
    intersections: '',
    phases: ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E'] as string[],
  })

  const [result, setResult] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function togglePhase(phase: string) {
    set('phases', form.phases.includes(phase)
      ? form.phases.filter(p => p !== phase)
      : [...form.phases, phase])
  }

  async function runEstimate() {
    setLoading(true)
    setError('')
    setResult(null)
    setImported(false)
    try {
      const token = localStorage.getItem('whe_token') ?? ''
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const e = (() => { try { return JSON.parse(text) } catch { return null } })()
        throw new Error(`[${res.status}] ${(e?.error ?? text.slice(0, 200)) || 'Estimation failed'}`)
      }
      const data = await res.json()
      setResult(data)
      setExpanded(new Set(data.disciplines.map((d: any) => d.discipline)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function importToProject() {
    if (!result || !project) return
    setImporting(true)
    const newTasks: WBSTask[] = result.disciplines.flatMap(d =>
      d.tasks.map((t, i) => ({
        id: `ai-${d.discipline}-${i}-${Date.now()}`,
        taskNumber: getTaskNumber(t.phase, d.discipline, t.taskName),
        phase: t.phase as Phase,
        discipline: d.discipline as Discipline,
        taskName: t.taskName,
        hours: t.hours,
        adjustedHours: t.hours,
        factor: 1.0,
        notes: t.rationale,
      }))
    )
    updateProject({ ...project, tasks: [...(project.tasks ?? []), ...newTasks] } as any)
    setImporting(false)
    setImported(true)
  }

  const confidenceColor = (score: number) =>
    score >= 80 ? 'text-green-600 bg-green-50 border-green-200'
    : score >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estimation Assistant</h1>
          <p className="text-sm text-slate-500">Claude AI-powered work hour recommendations based on MassDOT norms</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Input form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm">Project Parameters</h2>

          <Field label="Project Type">
            <select value={form.projectType} onChange={e => set('projectType', e.target.value)} className="fi">
              {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="District">
            <select value={form.district} onChange={e => set('district', e.target.value)} className="fi">
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>

          <Field label="Project Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe the project scope, key constraints, or special conditions..."
              className="fi resize-none"
            />
          </Field>

          <Field label={`Complexity: ${form.complexity}/5`}>
            <input
              type="range" min={1} max={5} value={form.complexity}
              onChange={e => set('complexity', Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Simple</span><span>Average</span><span>Complex</span>
            </div>
          </Field>

          {/* Size metrics — highlighted based on primary metric for project type */}
          {(() => {
            const primary = PRIMARY_METRIC[form.projectType] ?? 'roadMiles'
            const hl = 'border-purple-400 bg-purple-50 ring-1 ring-purple-200'
            return (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Size metrics — <span className="text-purple-600 font-medium">highlighted field</span> is primary for this project type
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Road Miles">
                    <input type="number" min={0} step={0.1}
                      value={form.roadMiles} onChange={e => set('roadMiles', e.target.value)}
                      placeholder="0"
                      className={`fi ${primary === 'roadMiles' ? hl : ''}`} />
                  </Field>
                  <Field label="Bridges">
                    <input type="number" min={0}
                      value={form.bridges} onChange={e => set('bridges', e.target.value)}
                      placeholder="0"
                      className={`fi ${primary === 'bridges' ? hl : ''}`} />
                  </Field>
                  <Field label="Intersections">
                    <input type="number" min={0}
                      value={form.intersections} onChange={e => set('intersections', e.target.value)}
                      placeholder="0"
                      className={`fi ${primary === 'intersections' ? hl : ''}`} />
                  </Field>
                </div>
              </div>
            )
          })()}

          <Field label="Phases to Estimate">
            <div className="space-y-1.5">
              {PHASES_LIST.map(phase => (
                <label key={phase} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.phases.includes(phase)}
                    onChange={() => togglePhase(phase)}
                    className="accent-amber-500"
                  />
                  <span className="text-xs text-slate-600">{phase}</span>
                </label>
              ))}
            </div>
          </Field>

          <button
            onClick={runEstimate}
            disabled={loading || form.phases.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Claude is estimating...' : 'Generate AI Estimate'}
          </button>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="col-span-2 space-y-4">
          {!result && !loading && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <Sparkles size={32} className="mx-auto mb-3 text-purple-300" />
              <p className="text-sm">Fill in the project parameters and click <strong className="text-purple-600">Generate AI Estimate</strong></p>
              <p className="text-xs mt-1">Claude will analyze your project against MassDOT norms and historical data</p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin text-purple-500" />
              <p className="text-sm text-slate-600 font-medium">Claude is analyzing your project...</p>
              <p className="text-xs text-slate-400 mt-1">Comparing against MassDOT norms and historical project data</p>
            </div>
          )}

          {result && (
            <>
              {/* Summary bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">{result.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`text-center px-4 py-2 rounded-lg border ${confidenceColor(result.confidenceScore)}`}>
                      <div className="text-xl font-bold">{result.confidenceScore}%</div>
                      <div className="text-xs font-medium">Confidence</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="text-xl font-bold text-slate-800">{result.totalEstimatedHours.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">Total Hours</div>
                    </div>
                    {project && (
                      <button
                        onClick={importToProject}
                        disabled={importing || imported}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          imported ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {imported ? <CheckCircle2 size={15} /> : <Plus size={15} />}
                        {imported ? 'Imported!' : 'Import to WBS'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk flags */}
              {result.riskFlags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 font-semibold text-sm">
                    <AlertTriangle size={15} /> Risk Flags
                  </div>
                  <ul className="space-y-1">
                    {result.riskFlags.map((f, i) => <li key={i} className="text-xs text-amber-700 flex items-start gap-2"><span className="mt-0.5">•</span>{f}</li>)}
                  </ul>
                </div>
              )}

              {/* Assumptions — filter out setup/env var messages */}
              {result.assumptions.filter(a => !a.toLowerCase().includes('anthropic') && !a.toLowerCase().includes('env var') && !a.toLowerCase().includes('vercel')).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold text-sm">
                    <CheckCircle2 size={15} /> Assumptions
                  </div>
                  <ul className="space-y-1">
                    {result.assumptions
                      .filter(a => !a.toLowerCase().includes('anthropic') && !a.toLowerCase().includes('env var') && !a.toLowerCase().includes('vercel'))
                      .map((a, i) => <li key={i} className="text-xs text-blue-700 flex items-start gap-2"><span className="mt-0.5">•</span>{a}</li>)}
                  </ul>
                </div>
              )}

              {/* Discipline breakdown */}
              {result.disciplines.map(disc => (
                <div key={disc.discipline} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpanded(prev => {
                      const next = new Set(prev)
                      next.has(disc.discipline) ? next.delete(disc.discipline) : next.add(disc.discipline)
                      return next
                    })}
                  >
                    <div className="flex items-center gap-2">
                      {expanded.has(disc.discipline) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      <span className="font-semibold text-slate-800">{disc.discipline}</span>
                      <span className="text-xs text-slate-400">{disc.tasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{disc.tasks.reduce((s, t) => s + t.likelyHours, 0)} likely hrs</span>
                      <span className="text-slate-300">|</span>
                      <span>{disc.tasks.reduce((s, t) => s + t.lowHours, 0)}–{disc.tasks.reduce((s, t) => s + t.highHours, 0)} range</span>
                    </div>
                  </div>

                  {expanded.has(disc.discipline) && (
                    <div className="border-t border-slate-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold">
                            <th className="px-3 py-2 text-center w-16">Task #</th>
                            <th className="px-4 py-2 text-left">Phase / Task</th>
                            {STAFF_CATEGORIES.map(c => (
                              <th key={c} className="px-2 py-2 text-center min-w-[52px]">{c.split(' ').pop()}</th>
                            ))}
                            <th className="px-3 py-2 text-center">Low</th>
                            <th className="px-3 py-2 text-center font-bold text-slate-700">Likely</th>
                            <th className="px-3 py-2 text-center">High</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {disc.tasks.map((task, i) => (
                            <tr key={i} className="hover:bg-purple-50 group">
                              <td className="px-3 py-2 text-center font-mono font-bold text-amber-700">
                                {getTaskNumber(task.phase, disc.discipline, task.taskName)}
                              </td>
                              <td className="px-4 py-2">
                                <div className="font-medium text-slate-700">{task.taskName}</div>
                                <div className="text-slate-400 text-xs">{task.phase}</div>
                                {task.rationale && (
                                  <div className="text-slate-400 italic mt-0.5 hidden group-hover:block">{task.rationale}</div>
                                )}
                              </td>
                              {STAFF_CATEGORIES.map(cat => (
                                <td key={cat} className="px-2 py-2 text-center text-slate-600">
                                  {task.hours[cat] || 0}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-center text-slate-400">{task.lowHours}</td>
                              <td className="px-3 py-2 text-center font-bold text-purple-700">{task.likelyHours}</td>
                              <td className="px-3 py-2 text-center text-slate-400">{task.highHours}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <style>{`.fi { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 11px; font-size: 13px; color: #1e293b; outline: none; background: white; } .fi:focus { border-color: #a855f7; box-shadow: 0 0 0 2px rgba(168,85,247,0.15); }`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
