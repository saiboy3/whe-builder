import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { STAFF_CATEGORIES } from '../types'
import type { WBSTask, Phase, Discipline } from '../types'
import { getTaskNumber, SECTIONS, getSectionForTask } from '../lib/taskNumbers'

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
const PHASES_LIST = ['Preliminary Design', '25% Design', '75% Design', '100% Design', 'PS&E']

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
    phases: ['Preliminary Design', '25% Design', '75% Design', '100% Design', 'PS&E'] as string[],
  })

  const [result, setResult] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  // Risk flag addressing — keyed by flag index
  interface RiskAddress {
    open: boolean
    reviewed: boolean
    note: string
    extraHours: number
    discipline: string
  }
  const [riskAddresses, setRiskAddresses] = useState<Record<number, RiskAddress>>({})

  function setRiskField(idx: number, field: keyof RiskAddress, value: any) {
    setRiskAddresses(prev => ({
      ...prev,
      [idx]: { open: false, reviewed: false, note: '', extraHours: 0, discipline: 'Roadway', ...prev[idx], [field]: value },
    }))
  }

  const DISCIPLINES_LIST = ['Roadway', 'Traffic', 'Structures', 'Hydraulics/Drainage', 'Utilities', 'Environmental', 'Survey', 'Right-of-Way']

  // Guess affected discipline from flag text
  function guessDiscipline(flag: string): string {
    const f = flag.toLowerCase()
    if (f.includes('signal') || f.includes('intersection') || f.includes('traffic')) return 'Traffic'
    if (f.includes('bridge') || f.includes('structure') || f.includes('structural')) return 'Structures'
    if (f.includes('drainage') || f.includes('hydraulic') || f.includes('culvert')) return 'Hydraulics/Drainage'
    if (f.includes('survey') || f.includes('miles') || f.includes('subsurface')) return 'Survey'
    if (f.includes('environmental') || f.includes('wetland') || f.includes('permit')) return 'Environmental'
    if (f.includes('row') || f.includes('right of way') || f.includes('taking')) return 'Right-of-Way'
    return 'Roadway'
  }

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
      // Expand all sections by default
      setExpanded(new Set(SECTIONS.map(s => `sec-${s.number}`)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function importToProject() {
    if (!result || !project) return
    setImporting(true)

    // Collect risk flag notes and extra hours by discipline
    const flagNotes: Record<string, string[]> = {}
    const flagExtraHours: Record<string, number> = {}
    Object.entries(riskAddresses).forEach(([idxStr, addr]) => {
      if (!addr.reviewed && addr.extraHours === 0 && !addr.note) return
      const disc = addr.discipline
      if (addr.note) {
        if (!flagNotes[disc]) flagNotes[disc] = []
        flagNotes[disc].push(`Risk flag note: ${addr.note}`)
      }
      if (addr.extraHours > 0) {
        flagExtraHours[disc] = (flagExtraHours[disc] ?? 0) + addr.extraHours
      }
    })

    const baseTasks: WBSTask[] = result.disciplines.flatMap(d =>
      d.tasks.map((t, i) => ({
        id: `ai-${d.discipline}-${i}-${Date.now()}`,
        taskNumber: getTaskNumber(t.phase, d.discipline, t.taskName),
        phase: t.phase as Phase,
        discipline: d.discipline as Discipline,
        taskName: t.taskName,
        hours: t.hours,
        adjustedHours: t.hours,
        factor: 1.0,
        notes: [t.rationale, ...(flagNotes[d.discipline] ?? [])].filter(Boolean).join(' | '),
      }))
    )

    // Add extra-hours tasks for risk flag adjustments
    const extraTasks: WBSTask[] = Object.entries(flagExtraHours).map(([disc, hrs], i) => {
      const flagIdx = Object.entries(riskAddresses).find(([, a]) => a.discipline === disc && a.extraHours > 0)?.[0]
      const flag = flagIdx !== undefined && result.riskFlags[Number(flagIdx)] ? result.riskFlags[Number(flagIdx)] : 'Risk flag adjustment'
      const phase: Phase = 'Preliminary Design'
      return {
        id: `risk-adj-${disc}-${Date.now()}-${i}`,
        taskNumber: getTaskNumber(phase, disc as Discipline, 'Risk Flag Adjustment'),
        phase,
        discipline: disc as Discipline,
        taskName: `Risk Flag Adjustment — ${flag.slice(0, 60)}`,
        hours: { 'Principal In Charge (PIC)': 0, 'Project Manager (PM)': Math.round(hrs * 0.2), 'Senior Engineer (SE)': Math.round(hrs * 0.3), 'Engineer (Eng)': Math.round(hrs * 0.4), 'Assistant Engineer (AE)': Math.round(hrs * 0.1), 'Engineering Technician (ET)': 0 },
        adjustedHours: { 'Principal In Charge (PIC)': 0, 'Project Manager (PM)': Math.round(hrs * 0.2), 'Senior Engineer (SE)': Math.round(hrs * 0.3), 'Engineer (Eng)': Math.round(hrs * 0.4), 'Assistant Engineer (AE)': Math.round(hrs * 0.1), 'Engineering Technician (ET)': 0 },
        factor: 1.0,
        notes: `Extra hours added from risk flag review`,
      }
    })

    updateProject({ ...project, tasks: [...(project.tasks ?? []), ...baseTasks, ...extraTasks] } as any)
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

              {/* Risk flags — interactive, each can be addressed */}
              {result.riskFlags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 text-amber-700 font-semibold text-sm border-b border-amber-200">
                    <AlertTriangle size={15} />
                    Risk Flags — Address before importing
                    <span className="ml-auto text-xs font-normal text-amber-500">
                      {Object.values(riskAddresses).filter(a => a.reviewed).length}/{result.riskFlags.length} reviewed
                    </span>
                  </div>
                  <div className="divide-y divide-amber-100">
                    {result.riskFlags.map((flag, i) => {
                      const addr = riskAddresses[i] ?? { open: false, reviewed: false, note: '', extraHours: 0, discipline: guessDiscipline(flag) }
                      return (
                        <div key={i} className={`px-4 py-3 ${addr.reviewed ? 'bg-green-50' : 'bg-amber-50'}`}>
                          {/* Flag header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="mt-0.5 flex-shrink-0">
                                {addr.reviewed
                                  ? <CheckCircle2 size={14} className="text-green-600" />
                                  : <AlertTriangle size={14} className="text-amber-600" />}
                              </span>
                              <span className={`text-xs ${addr.reviewed ? 'text-green-700 line-through opacity-60' : 'text-amber-800'}`}>{flag}</span>
                            </div>
                            <button
                              onClick={() => setRiskField(i, 'open', !addr.open)}
                              className="text-xs font-medium px-2 py-0.5 rounded border transition-colors flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                            >
                              {addr.open ? 'Close' : 'Address'}
                            </button>
                          </div>

                          {/* Address panel */}
                          {addr.open && (
                            <div className="mt-3 pl-5 space-y-3">
                              {/* Note */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  How is this being addressed?
                                </label>
                                <textarea
                                  value={addr.note}
                                  onChange={e => setRiskField(i, 'note', e.target.value)}
                                  rows={2}
                                  placeholder="e.g. Signal design confirmed scoped at 2 hrs/intersection × 4 intersections = 8 hrs total in Traffic discipline"
                                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400 resize-none bg-white"
                                />
                              </div>

                              {/* Extra hours */}
                              <div className="flex items-end gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Add extra hours to discipline
                                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number" min={0} step={4}
                                      value={addr.extraHours || ''}
                                      onChange={e => setRiskField(i, 'extraHours', Number(e.target.value))}
                                      placeholder="0"
                                      className="w-20 text-center text-xs border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400"
                                    />
                                    <span className="text-xs text-slate-400">hrs to</span>
                                    <select
                                      value={addr.discipline}
                                      onChange={e => setRiskField(i, 'discipline', e.target.value)}
                                      className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                                    >
                                      {DISCIPLINES_LIST.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {/* Mark reviewed */}
                                <button
                                  onClick={() => {
                                    setRiskField(i, 'reviewed', true)
                                    setRiskField(i, 'open', false)
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                  <CheckCircle2 size={13} /> Mark Reviewed
                                </button>
                              </div>

                              {addr.extraHours > 0 && (
                                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
                                  {addr.extraHours} hrs will be added to <strong>{addr.discipline}</strong> as a "Risk Flag Adjustment" task when you import to WBS.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Summary if reviewed */}
                          {addr.reviewed && (addr.note || addr.extraHours > 0) && (
                            <div className="mt-1.5 pl-5 text-xs text-green-600 flex items-center gap-3">
                              {addr.note && <span className="italic truncate max-w-xs">"{addr.note}"</span>}
                              {addr.extraHours > 0 && <span className="font-medium">+{addr.extraHours}h {addr.discipline}</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
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

              {/* Results grouped by MassDOT Section — same structure as WBS Builder */}
              {(() => {
                // Flatten all tasks from all disciplines, assign task numbers
                const allTasks = result.disciplines.flatMap(disc =>
                  disc.tasks.map(t => ({
                    ...t,
                    discipline: disc.discipline,
                    taskNum: getTaskNumber(t.phase, disc.discipline, t.taskName),
                  }))
                )

                // Merge tasks with the same task number — in WHE form each task # is ONE row.
                // Hours from different disciplines are summed into a single entry.
                type FlatTask = typeof allTasks[0]
                const merged = new Map<string, FlatTask & { hours: Record<string, number> }>()
                for (const t of allTasks) {
                  if (merged.has(t.taskNum)) {
                    const ex = merged.get(t.taskNum)!
                    for (const cat of Object.keys(t.hours)) {
                      ex.hours[cat] = (ex.hours[cat] ?? 0) + (t.hours[cat] ?? 0)
                    }
                    ex.likelyHours += t.likelyHours
                    ex.lowHours    += t.lowHours
                    ex.highHours   += t.highHours
                  } else {
                    merged.set(t.taskNum, { ...t, hours: { ...t.hours } })
                  }
                }

                // Group merged tasks by section
                const sectionMap = new Map<string, FlatTask[]>()
                for (const t of merged.values()) {
                  const sec = getSectionForTask(t.taskNum)
                  if (!sectionMap.has(sec.number)) sectionMap.set(sec.number, [])
                  sectionMap.get(sec.number)!.push(t as FlatTask)
                }
                // Sort within each section by task number
                for (const tasks of sectionMap.values()) {
                  tasks.sort((a, b) => parseInt((a as any).taskNum, 10) - parseInt((b as any).taskNum, 10))
                }
                // Render in WHE form section order
                return SECTIONS
                  .map(sec => ({ sec, tasks: sectionMap.get(sec.number) ?? [] }))
                  .filter(g => g.tasks.length > 0)
                  .map(({ sec, tasks: secTasks }) => {
                    const secKey = `sec-${sec.number}`
                    const isOpen = expanded.has(secKey)
                    const likelyTotal = secTasks.reduce((s, t) => s + t.likelyHours, 0)
                    const lowTotal = secTasks.reduce((s, t) => s + t.lowHours, 0)
                    const highTotal = secTasks.reduce((s, t) => s + t.highHours, 0)
                    return (
                      <div key={secKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div
                          className="px-5 py-3 flex items-center justify-between cursor-pointer bg-slate-800 text-white hover:bg-slate-700"
                          onClick={() => setExpanded(prev => {
                            const next = new Set(prev)
                            next.has(secKey) ? next.delete(secKey) : next.add(secKey)
                            return next
                          })}
                        >
                          <div className="flex items-center gap-2">
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            <span className="text-xs font-bold text-amber-400">SECTION {sec.number}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-white">{sec.name}</span>
                            <span className="text-slate-500 text-xs ml-1">{secTasks.length} tasks</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-300">{lowTotal}–{highTotal} range</span>
                            <span className="font-bold text-amber-300">{likelyTotal} likely hrs</span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-slate-100 overflow-x-auto">
                            <table className="w-full text-xs table-fixed">
                              {/* Fixed column widths — same on every section so columns align */}
                              <colgroup>
                                <col style={{ width: '52px' }} />   {/* Task # */}
                                <col style={{ width: '220px' }} />  {/* Task Name */}
                                <col style={{ width: '120px' }} />  {/* Discipline */}
                                {STAFF_CATEGORIES.map(c => <col key={c} style={{ width: '46px' }} />)}
                                <col style={{ width: '48px' }} />   {/* Low */}
                                <col style={{ width: '56px' }} />   {/* Likely */}
                                <col style={{ width: '48px' }} />   {/* High */}
                              </colgroup>
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                  <th className="px-2 py-2 text-center">Task #</th>
                                  <th className="px-3 py-2 text-left">Task Name</th>
                                  <th className="px-2 py-2 text-left">Discipline</th>
                                  {STAFF_CATEGORIES.map(c => (
                                    <th key={c} className="px-1 py-2 text-center">
                                      {/* Abbreviation: extract just the 2–3 char code */}
                                      {c.match(/\(([^)]+)\)/)?.[1] ?? c.split(' ')[0]}
                                    </th>
                                  ))}
                                  <th className="px-1 py-2 text-center">Low</th>
                                  <th className="px-1 py-2 text-center text-purple-700 font-bold">Likely</th>
                                  <th className="px-1 py-2 text-center">High</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {secTasks.map((task, i) => (
                                  <tr key={i} className={`hover:bg-purple-50 group ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                    <td className="px-2 py-1.5 text-center font-mono font-bold text-amber-700">{task.taskNum}</td>
                                    <td className="px-3 py-1.5 truncate">
                                      <div className="font-medium text-slate-700 truncate" title={task.taskName}>{task.taskName}</div>
                                      {task.rationale && (
                                        <div className="text-slate-400 italic text-xs mt-0.5 hidden group-hover:block truncate">{task.rationale}</div>
                                      )}
                                    </td>
                                    <td className="px-2 py-1.5 text-slate-400 truncate" title={task.discipline}>{task.discipline}</td>
                                    {STAFF_CATEGORIES.map(cat => (
                                      <td key={cat} className="px-1 py-1.5 text-center text-slate-700">{task.hours[cat] || 0}</td>
                                    ))}
                                    <td className="px-1 py-1.5 text-center text-slate-400">{task.lowHours}</td>
                                    <td className="px-1 py-1.5 text-center font-bold text-purple-700">{task.likelyHours}</td>
                                    <td className="px-1 py-1.5 text-center text-slate-400">{task.highHours}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })
              })()}
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
