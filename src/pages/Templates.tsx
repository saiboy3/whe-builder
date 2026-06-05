import { useState } from 'react'
import { Lock, Plus, Copy, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

interface TemplateTask { id: string; phase: string; discipline: string; taskName: string }
interface Template { id: string; name: string; description: string; isLocked: boolean; tasks: TemplateTask[] }

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-roadway',
    name: 'Standard Roadway Design',
    description: 'MassDOT standard roadway WBS — Preliminary through PS&E',
    isLocked: true,
    tasks: [
      { id: 't1', phase: 'Preliminary Design', discipline: 'Roadway', taskName: 'Data Collection & Site Visit' },
      { id: 't2', phase: 'Preliminary Design', discipline: 'Roadway', taskName: 'Conceptual Layout' },
      { id: 't3', phase: 'Preliminary Design', discipline: 'Survey', taskName: 'Survey Coordination' },
      { id: 't4', phase: 'Preliminary Design', discipline: 'Environmental', taskName: 'Environmental Screening' },
      { id: 't5', phase: '25% Design', discipline: 'Roadway', taskName: 'Horizontal Alignment' },
      { id: 't6', phase: '25% Design', discipline: 'Roadway', taskName: 'Vertical Profile' },
      { id: 't7', phase: '25% Design', discipline: 'Traffic', taskName: 'Traffic Analysis' },
      { id: 't8', phase: '25% Design', discipline: 'Hydraulics/Drainage', taskName: 'Initial Drainage Design' },
      { id: 't9', phase: '75% Design', discipline: 'Roadway', taskName: 'Final Roadway Design' },
      { id: 't10', phase: '75% Design', discipline: 'Utilities', taskName: 'Utility Coordination' },
      { id: 't11', phase: '100% Design', discipline: 'Roadway', taskName: 'Final Plans' },
      { id: 't12', phase: '100% Design', discipline: 'Roadway', taskName: 'Specifications' },
      { id: 't13', phase: '100% Design', discipline: 'Roadway', taskName: 'Cost Estimates' },
      { id: 't14', phase: '100% Design', discipline: 'Roadway', taskName: 'QA/QC' },
    ],
  },
  {
    id: 'tpl-bridge',
    name: 'Bridge Rehabilitation',
    description: 'Standard WBS for MassDOT bridge rehab projects',
    isLocked: true,
    tasks: [
      { id: 'b1', phase: 'Preliminary Design', discipline: 'Structures', taskName: 'Bridge Inspection Review' },
      { id: 'b2', phase: 'Preliminary Design', discipline: 'Structures', taskName: 'Conceptual Repair Strategy' },
      { id: 'b3', phase: '25% Design', discipline: 'Structures', taskName: 'Structural Analysis' },
      { id: 'b4', phase: '25% Design', discipline: 'Structures', taskName: 'Preliminary Drawings' },
      { id: 'b5', phase: '75% Design', discipline: 'Structures', taskName: 'Final Structural Design' },
      { id: 'b6', phase: '75% Design', discipline: 'Hydraulics/Drainage', taskName: 'Scour Analysis' },
      { id: 'b7', phase: '100% Design', discipline: 'Structures', taskName: 'Final Plans' },
      { id: 'b8', phase: '100% Design', discipline: 'Structures', taskName: 'Load Rating' },
      { id: 'b9', phase: '100% Design', discipline: 'Structures', taskName: 'QA/QC' },
    ],
  },
]

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['tpl-roadway']))

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function cloneTemplate(tpl: Template) {
    const clone: Template = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      isLocked: false,
      tasks: tpl.tasks.map(t => ({ ...t, id: `${t.id}-copy` })),
    }
    setTemplates(prev => [...prev, clone])
  }

  function deleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  function lockTemplate(id: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isLocked: true } : t))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">WBS Templates</h1>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Template
        </button>
      </div>

      <div className="space-y-4">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => toggleExpand(tpl.id)}
            >
              {expanded.has(tpl.id) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{tpl.name}</h3>
                  {tpl.isLocked && (
                    <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{tpl.description} · {tpl.tasks.length} tasks</p>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => cloneTemplate(tpl)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                  <Copy size={13} /> Clone
                </button>
                {!tpl.isLocked && (
                  <>
                    <button onClick={() => lockTemplate(tpl.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                      <Lock size={13} /> Lock
                    </button>
                    <button onClick={() => deleteTemplate(tpl.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {expanded.has(tpl.id) && (
              <div className="border-t border-slate-100">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 text-slate-500 font-semibold">
                    <th className="px-5 py-2 text-left">Phase</th>
                    <th className="px-4 py-2 text-left">Discipline</th>
                    <th className="px-4 py-2 text-left">Task Name</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {tpl.tasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-5 py-2 text-slate-500">{task.phase}</td>
                        <td className="px-4 py-2 text-slate-600">{task.discipline}</td>
                        <td className="px-4 py-2 text-slate-800">{task.taskName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
