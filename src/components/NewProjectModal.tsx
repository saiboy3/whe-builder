import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'
import { PHASES } from '../types'

interface Props { onClose: () => void }

const DISTRICTS = ['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6']
const PROJECT_TYPES = ['Roadway Reconstruction', 'Bridge Rehabilitation', 'Intersection Safety', 'Drainage Improvement', 'Corridor Study', 'Other']

export default function NewProjectModal({ onClose }: Props) {
  const { projects, setProjects } = useApp()
  const [form, setForm] = useState({
    contractNumber: '',
    name: '',
    description: '',
    district: 'District 3',
    projectType: 'Roadway Reconstruction',
    phase: PHASES[0],
    pm: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const newProject: Project = {
      id: `p${Date.now()}`,
      contractNumber: form.contractNumber,
      name: form.name,
      description: form.description,
      district: form.district,
      pm: form.pm,
      status: 'Active',
      risk: 'green',
      approvalStatus: 'Draft',
      estimationComplete: 0,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProjects([newProject, ...projects])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Create New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contract Number" required>
              <input value={form.contractNumber} onChange={e => set('contractNumber', e.target.value)}
                className="field-input" placeholder="e.g. 109001" required />
            </Field>
            <Field label="District" required>
              <select value={form.district} onChange={e => set('district', e.target.value)} className="field-input">
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Project Name" required>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="field-input" placeholder="e.g. Route 28 Resurfacing" required />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="field-input resize-none" rows={2} placeholder="Brief project description..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Type">
              <select value={form.projectType} onChange={e => set('projectType', e.target.value)} className="field-input">
                {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Starting Phase">
              <select value={form.phase} onChange={e => set('phase', e.target.value)} className="field-input">
                {PHASES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Project Manager">
            <input value={form.pm} onChange={e => set('pm', e.target.value)}
              className="field-input" placeholder="PM name" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit"
              className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors">
              Create Project
            </button>
          </div>
        </form>
      </div>

      <style>{`.field-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; color: #1e293b; outline: none; background: white; } .field-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }`}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
