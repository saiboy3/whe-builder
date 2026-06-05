import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Save, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { WBSTask, Phase, Discipline, Project } from '../types'
import { STAFF_CATEGORIES } from '../types'
import { getTaskNumber, STAFF_LABEL_MAP, SECTIONS, getSectionForTask } from '../lib/taskNumbers'

function totalHours(entry: Record<string, number>) {
  return Object.values(entry).reduce((s, v) => s + (v || 0), 0)
}

function totalCost(entry: Record<string, number>, rates: Record<string, number>) {
  return STAFF_CATEGORIES.reduce((s, cat) => s + (entry[cat] || 0) * (rates[cat] ?? 0), 0)
}

export default function EstimationBuilder() {
  const { projects, selectedProjectId, updateProject, billingRates, rateConfig } = useApp()
  const rates = billingRates
  const project = projects.find(p => p.id === selectedProjectId)

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ taskId: string; cat: string } | null>(null)
  const [saved, setSaved] = useState(false)

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <AlertCircle size={32} className="mx-auto mb-2" />
          <p>No project selected. Choose a project from the top bar.</p>
        </div>
      </div>
    )
  }

  const tasks = project.tasks ?? []

  // Group tasks by MassDOT Section (100, 150, 200…), sorted by task number within each section
  const sectionGroups = useMemo(() => {
    const map = new Map<string, WBSTask[]>() // sectionNumber → tasks
    for (const t of tasks) {
      const num = t.taskNumber || getTaskNumber(t.phase, t.discipline, t.taskName)
      const sec = getSectionForTask(num)
      if (!map.has(sec.number)) map.set(sec.number, [])
      map.get(sec.number)!.push(t)
    }
    for (const [, secTasks] of map) {
      secTasks.sort((a, b) => parseInt(a.taskNumber ?? '9999', 10) - parseInt(b.taskNumber ?? '9999', 10))
    }
    // Return sections in WHE form order (only sections that have tasks)
    return SECTIONS
      .map(s => ({ section: s, tasks: map.get(s.number) ?? [] }))
      .filter(g => g.tasks.length > 0)
  }, [tasks])

  function toggleCollapse(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function updateHour(taskId: string, cat: string, value: number) {
    const updated = tasks.map(t => {
      if (t.id !== taskId) return t
      const hours = { ...t.hours, [cat]: value }
      const adjustedHours = { ...t.adjustedHours, [cat]: Math.round(value * t.factor) }
      return { ...t, hours, adjustedHours }
    })
    updateProject({ ...project, tasks: updated, updatedAt: new Date().toISOString() } as Project)
  }

  function updateFactor(taskId: string, factor: number) {
    const updated = tasks.map(t => {
      if (t.id !== taskId) return t
      const adjustedHours = Object.fromEntries(
        STAFF_CATEGORIES.map(cat => [cat, Math.round((t.hours[cat] || 0) * factor)])
      )
      return { ...t, factor, adjustedHours }
    })
    updateProject({ ...project, tasks: updated } as Project)
  }

  function addTask(phase: Phase, discipline: Discipline) {
    const taskName = 'New Task'
    const newTask: WBSTask = {
      id: `t${Date.now()}`,
      taskNumber: getTaskNumber(phase, discipline, taskName),
      phase, discipline,
      taskName,
      hours: Object.fromEntries(STAFF_CATEGORIES.map(c => [c, 0])),
      adjustedHours: Object.fromEntries(STAFF_CATEGORIES.map(c => [c, 0])),
      factor: 1.0,
      notes: '',
    }
    updateProject({ ...project, tasks: [...tasks, newTask] } as Project)
  }

  function deleteTask(taskId: string) {
    updateProject({ ...project, tasks: tasks.filter(t => t.id !== taskId) } as Project)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Grand totals
  const grandEstimated = tasks.reduce((s, t) => s + totalHours(t.hours), 0)
  const grandAdjusted = tasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0)
  const laborCost = tasks.reduce((s, t) => s + totalCost(t.adjustedHours, rates), 0)
  const totalWithOH = laborCost  // billing rates already include OH + profit

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{project.name}</h1>
          <p className="text-xs text-slate-500">{project.contractNumber} · WBS Estimation Builder</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Adjusted Hours</div>
            <div className="text-xl font-bold text-amber-600">{grandAdjusted.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Est. Fee (w/ OH + Profit)</div>
            <div className="text-xl font-bold text-slate-800">${totalWithOH.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saved ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <Save size={15} /> {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white">
              <th className="px-4 py-2.5 text-left text-xs font-semibold sticky left-0 bg-slate-800 w-20">Task #</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold w-56 bg-slate-800">Task Name</th>
              {STAFF_CATEGORIES.map(cat => (
                <th key={cat} className="px-2 py-2.5 text-center text-xs font-semibold min-w-[60px]" title={cat}>
                  {STAFF_LABEL_MAP[cat] ?? cat}
                </th>
              ))}
              <th className="px-3 py-2.5 text-center text-xs font-semibold min-w-[60px]">Est.</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold min-w-[55px]">Factor</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold min-w-[65px]">Adj.</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold min-w-[90px]">Labor $</th>
              <th className="px-2 py-2.5 text-center text-xs font-semibold w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sectionGroups.map(({ section, tasks: secTasks }) => {
              const secKey = `sec-${section.number}`
              const secCollapsed = collapsed.has(secKey)
              const secEst = secTasks.reduce((s, t) => s + totalHours(t.hours), 0)
              const secAdj = secTasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0)

              return (
                <React.Fragment key={secKey}>
                  {/* Section header — matches MassDOT WHE Form 1.3 */}
                  <tr
                    className="bg-slate-800 text-white cursor-pointer select-none"
                    onClick={() => toggleCollapse(secKey)}
                  >
                    <td className="px-3 py-2 sticky left-0 bg-slate-800" colSpan={STAFF_CATEGORIES.length + 3}>
                      <span className="flex items-center gap-2">
                        {secCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        <span className="text-xs font-bold text-amber-400">SECTION {section.number}</span>
                        <span className="text-xs font-semibold text-white uppercase tracking-wide">{section.name}</span>
                        <span className="text-slate-500 text-xs font-normal ml-1">{secTasks.length} tasks</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-300">{secEst}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-center text-xs text-amber-300 font-semibold">{secAdj}</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-2 py-2">
                      <button
                        onClick={e => { e.stopPropagation(); addTask(secTasks[0]?.phase ?? 'Preliminary Design', 'Roadway') }}
                        className="text-slate-500 hover:text-amber-400"
                        title="Add task to this section"
                      ><Plus size={13} /></button>
                    </td>
                  </tr>

                  {/* Tasks in sequence */}
                  {!secCollapsed && secTasks.map((task, idx) => {
                    const est = totalHours(task.hours)
                    const adj = totalHours(task.adjustedHours)
                    const labor = totalCost(task.adjustedHours, rates)
                    const isEven = idx % 2 === 0

                    return (
                      <tr key={task.id} className={`border-b border-slate-100 hover:bg-amber-50 group ${isEven ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className={`px-3 py-1.5 sticky left-0 text-center font-mono text-xs font-bold text-amber-700 ${isEven ? 'bg-white' : 'bg-slate-50'} group-hover:bg-amber-50`}>
                          {task.taskNumber || getTaskNumber(task.phase, task.discipline, task.taskName)}
                        </td>
                        <td className={`px-2 py-1.5 ${isEven ? 'bg-white' : 'bg-slate-50'} group-hover:bg-amber-50`}>
                          <div className="flex items-center gap-2">
                            <input
                              value={task.taskName}
                              onChange={e => {
                                const updated = tasks.map(t => t.id === task.id ? { ...t, taskName: e.target.value } : t)
                                updateProject({ ...project, tasks: updated } as Project)
                              }}
                              className="text-xs text-slate-700 bg-transparent outline-none flex-1 hover:bg-white focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5 min-w-0"
                            />
                            <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 hidden group-hover:inline">{task.discipline}</span>
                          </div>
                        </td>
                        {STAFF_CATEGORIES.map(cat => (
                          <td key={cat} className="px-1 py-1">
                            <input
                              type="number" min={0}
                              value={task.hours[cat] || 0}
                              onFocus={() => setEditingCell({ taskId: task.id, cat })}
                              onBlur={() => setEditingCell(null)}
                              onChange={e => updateHour(task.id, cat, Number(e.target.value))}
                              className={`w-full text-center text-xs rounded py-1 outline-none transition-colors ${
                                editingCell?.taskId === task.id && editingCell?.cat === cat
                                  ? 'bg-amber-100 ring-1 ring-amber-400'
                                  : 'bg-transparent hover:bg-slate-100'
                              }`}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-center text-xs font-semibold text-slate-600">{est}</td>
                        <td className="px-1 py-1">
                          <input type="number" min={0.1} max={3} step={0.05}
                            value={task.factor}
                            onChange={e => updateFactor(task.id, Number(e.target.value))}
                            className="w-full text-center text-xs rounded py-1 bg-transparent hover:bg-slate-100 outline-none"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-center text-xs font-bold text-amber-700">{adj}</td>
                        <td className="px-3 py-1.5 text-center text-xs text-slate-500">${labor.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>

          {/* Grand total footer */}
          <tfoot>
            <tr className="bg-slate-800 text-white font-bold sticky bottom-0">
              <td className="px-3 py-3 text-xs sticky left-0 bg-slate-800"></td>
              <td className="px-4 py-3 text-sm bg-slate-800">TOTAL</td>
              {STAFF_CATEGORIES.map(cat => {
                const catTotal = tasks.reduce((s, t) => s + (t.hours[cat] || 0), 0)
                return <td key={cat} className="px-2 py-3 text-center text-xs">{catTotal}</td>
              })}
              <td className="px-3 py-3 text-center">{grandEstimated}</td>
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3 text-center text-amber-300">{grandAdjusted}</td>
              <td className="px-3 py-3 text-center text-xs">${(tasks.reduce((s, t) => s + totalCost(t.adjustedHours, rates), 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Rate legend */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-2 flex items-center gap-6 text-xs text-slate-400 flex-shrink-0">
        <span className="font-semibold text-slate-600">Billing Rates:</span>
        {STAFF_CATEGORIES.map(cat => (
          <span key={cat}>{STAFF_LABEL_MAP[cat] ?? cat}: <span className="text-slate-600">${rates[cat]?.toFixed(0)}/hr</span></span>
        ))}
        <span className="ml-4 text-amber-600 font-medium">OH {rateConfig.overheadMultiplier}x · Profit {(rateConfig.profitRate * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}
