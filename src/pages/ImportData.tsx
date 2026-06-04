import { useState, useRef } from 'react'
import { Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet, FileText, X, Plus } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext'
import type { HistoricalRecord } from '../types'
import { STAFF_CATEGORIES } from '../types'

// MassDOT WHE Form 1.3 column mapping
// Col B (index 1) = task number, Col C (index 2) = task name
// Col E (4) = PIC, F (5) = PM, G (6) = SE, H (7) = Eng, I (8) = AE, J (9) = ET, K (10) = Admin
const WHE_COL_MAP: Record<number, string> = {
  4: 'Principal',
  5: 'Project Manager',
  6: 'Senior Engineer',
  7: 'Engineer',
  8: 'Designer',
  9: 'CADD',
  10: 'Clerical',
}

const SECTION_LABELS: Record<string, string> = {
  '1': 'Preliminary Design', '10': 'Preliminary Design', '11': 'Preliminary Design', '12': 'Preliminary Design', '13': 'Preliminary Design',
  '15': 'Preliminary Design',
  '2': '25% Design', '3': '25% Design', '35': '25% Design',
  '4': '75% Design',
  '45': '100% / PS&E',
  '5': '100% / PS&E', '6': '75% Design', '7': 'Preliminary Design', '75': '75% Design',
  '8': '100% / PS&E', '9': '100% / PS&E',
}

function taskToPhase(taskNum: number): string {
  const prefix = String(taskNum).slice(0, 2)
  const first = String(taskNum).slice(0, 1)
  if (['45', '80'].includes(prefix)) return '100% / PS&E'
  if (['35'].includes(prefix)) return '25% Design'
  if (['40', '41', '42', '43', '44'].includes(prefix)) return '75% Design'
  if (['30', '31', '32', '33', '34'].includes(prefix)) return '25% Design'
  if (['10', '11', '12', '13', '15', '70', '71'].includes(prefix)) return 'Preliminary Design'
  if (['20', '21', '22', '23'].includes(prefix)) return 'Preliminary Design'
  if (['50'].includes(prefix)) return '100% / PS&E'
  if (['60', '75', '76'].includes(prefix)) return '75% Design'
  if (first === '1') return 'Preliminary Design'
  if (first === '2') return 'Preliminary Design'
  if (first === '3') return '25% Design'
  if (first === '4') return '75% Design'
  if (first === '5') return '100% / PS&E'
  if (first === '6') return '75% Design'
  if (first === '7') return 'Preliminary Design'
  if (first === '8') return '100% / PS&E'
  return 'Preliminary Design'
}

function taskToDiscipline(taskNum: number): string {
  const n = taskNum
  if ((n >= 700 && n <= 761)) return 'Structures'
  if ((n >= 600 && n <= 608)) return 'Survey'
  if ((n >= 500 && n <= 504)) return 'Right-of-Way'
  if ((n >= 150 && n <= 188)) return 'Environmental'
  if ([301,302,320,404].includes(n)) return 'Utilities'
  if ([305,306,307,308,309,310,311,312,321,322,323,324,325,326,327,328,329,330,
       405,406,407,408,409,410,411,412,420,421,422,423,424,425,426,427,428,429,430,431,
       452,453,454,455,456,457,458,459,460,461,462].includes(n)) return 'Roadway'
  if ([313,314,413].includes(n)) return 'Hydraulics/Drainage'
  if ([315,316,317,318,319,414,415,416,417,418,419].includes(n)) return 'Traffic'
  if (n >= 200 && n < 300) return 'Roadway'
  if (n >= 100 && n < 150) return 'Roadway'
  return 'Roadway'
}

interface ParseResult {
  records: Partial<HistoricalRecord>[]
  warnings: string[]
  projectInfo: { contractNumber?: string; location?: string }
}

function parseWHEExcel(buffer: ArrayBuffer, meta: { projectName: string; projectType: string; district: string; completedDate: string }): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const wsName = wb.SheetNames.find(n => n.toLowerCase().includes('1.3') || n.toLowerCase().includes('work hour')) ?? wb.SheetNames[0]
  const ws = wb.Sheets[wsName]
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })

  const records: Partial<HistoricalRecord>[] = []
  const warnings: string[] = []
  const projectInfo: ParseResult['projectInfo'] = {}

  // Try to extract contract number from header area (rows 0-6)
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r] as any[]
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] ?? '').trim()
      if (val.match(/^\d{6,}$/) && !projectInfo.contractNumber) {
        projectInfo.contractNumber = val
      }
    }
  }

  let tasksFound = 0
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] as any[]
    const taskNumRaw = row[1]
    const taskName = String(row[2] ?? '').trim()

    if (!taskNumRaw || !taskName || taskName === 'SUBTOTAL' || taskName.includes('SECTION')) continue
    const taskNum = Number(taskNumRaw)
    if (!Number.isInteger(taskNum) || taskNum < 100 || taskNum > 999) continue

    const estimatedHours: Record<string, number> = {}
    let hasAnyHours = false

    for (const [colIdx, staffCat] of Object.entries(WHE_COL_MAP)) {
      const val = Number(row[Number(colIdx)])
      if (!isNaN(val) && val > 0) {
        estimatedHours[staffCat] = val
        hasAnyHours = true
      }
    }

    if (!hasAnyHours) continue

    records.push({
      id: `import-${Date.now()}-${r}`,
      contractNumber: projectInfo.contractNumber ?? meta.projectName,
      projectName: meta.projectName,
      projectType: meta.projectType,
      district: meta.district,
      phase: taskToPhase(taskNum),
      taskNumber: String(taskNum),
      taskName,
      discipline: taskToDiscipline(taskNum),
      estimatedHours,
      actualHours: {},
      completedDate: meta.completedDate,
      source: 'WHE Import' as const,
    })
    tasksFound++
  }

  if (tasksFound === 0) warnings.push('No task data found — make sure the file is a completed MassDOT WHE Form 1.3')
  return { records, warnings, projectInfo }
}

function parseCSV(text: string): Partial<HistoricalRecord>[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const get = (key: string) => vals[header.indexOf(key)] ?? ''
    const estimatedHours: Record<string, number> = {}
    const actualHours: Record<string, number> = {}
    for (const cat of STAFF_CATEGORIES) {
      const key = cat.toLowerCase().replace(/ /g, '_')
      const est = Number(get(`est_${key}`))
      const act = Number(get(`act_${key}`))
      if (est > 0) estimatedHours[cat] = est
      if (act > 0) actualHours[cat] = act
    }
    return {
      id: `csv-${Date.now()}-${i}`,
      contractNumber: get('contract_number'),
      projectName: get('project_name'),
      projectType: get('project_type'),
      district: get('district'),
      phase: get('phase'),
      taskNumber: get('task_number'),
      taskName: get('task_name'),
      discipline: get('discipline'),
      estimatedHours,
      actualHours,
      completedDate: get('completed_date'),
      source: 'CSV Import' as const,
    }
  }).filter(r => r.taskNumber && r.taskName)
}

function generateCSVTemplate(): string {
  const staffEst = STAFF_CATEGORIES.map(c => `est_${c.toLowerCase().replace(/ /g, '_')}`).join(',')
  const staffAct = STAFF_CATEGORIES.map(c => `act_${c.toLowerCase().replace(/ /g, '_')}`).join(',')
  const header = `contract_number,project_name,project_type,district,phase,task_number,task_name,discipline,completed_date,${staffEst},${staffAct}`
  const example = `107624,Route 9 Corridor,Roadway Reconstruction,District 3,25% Design,305,Preliminary Horizontal Geometry,Roadway,2025-06-01,2,4,16,32,24,40,2,2,5,18,35,26,42,2`
  return `${header}\n${example}\n`
}

interface ManualEntry {
  contractNumber: string
  projectName: string
  projectType: string
  district: string
  phase: string
  taskNumber: string
  taskName: string
  discipline: string
  completedDate: string
  estimatedHours: Record<string, number>
  actualHours: Record<string, number>
}

const BLANK_ENTRY: ManualEntry = {
  contractNumber: '', projectName: '', projectType: 'Roadway Reconstruction',
  district: 'District 3', phase: 'Preliminary Design', taskNumber: '', taskName: '',
  discipline: 'Roadway', completedDate: '', estimatedHours: {}, actualHours: {},
}

export default function ImportData() {
  const { historicalRecords, addHistoricalRecords, clearHistoricalRecords } = useApp()

  const [tab, setTab] = useState<'whe' | 'csv' | 'manual'>('whe')
  const [wheMeta, setWheMeta] = useState({ projectName: '', projectType: 'Roadway Reconstruction', district: 'District 3', completedDate: '' })
  const [preview, setPreview] = useState<Partial<HistoricalRecord>[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [imported, setImported] = useState(false)
  const [manualEntry, setManualEntry] = useState<ManualEntry>({ ...BLANK_ENTRY })
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  function handleWHEFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = parseWHEExcel(ev.target!.result as ArrayBuffer, wheMeta)
      setPreview(result.records)
      setWarnings(result.warnings)
      setImported(false)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const records = parseCSV(ev.target!.result as string)
      setPreview(records)
      setWarnings(records.length === 0 ? ['No valid rows found in CSV'] : [])
      setImported(false)
    }
    reader.readAsText(file)
  }

  function confirmImport() {
    addHistoricalRecords(preview as HistoricalRecord[])
    setImported(true)
    setPreview([])
  }

  function addManualEntry() {
    const record: HistoricalRecord = {
      id: `manual-${Date.now()}`,
      source: 'Manual',
      ...manualEntry,
    }
    addHistoricalRecords([record])
    setManualEntry({ ...BLANK_ENTRY })
    setImported(true)
    setTimeout(() => setImported(false), 2000)
  }

  function downloadTemplate() {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'whe_historical_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const PHASES = ['Preliminary Design', '25% Design', '75% Design', '100% / PS&E']
  const DISCIPLINES = ['Roadway', 'Traffic', 'Structures', 'Hydraulics/Drainage', 'Utilities', 'Environmental', 'Survey', 'Right-of-Way', 'Construction Support']
  const TYPES = ['Roadway Reconstruction', 'Bridge Rehabilitation', 'Intersection Safety', 'Drainage Improvement', 'Corridor Study', 'Resurfacing', 'Signal Upgrade']

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Import Historical Data</h1>
          <p className="text-sm text-slate-500 mt-1">Feed the estimation intelligence engine with completed project data</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{historicalRecords.length} records loaded</span>
          {historicalRecords.length > 0 && (
            <button onClick={() => { if (confirm('Clear all imported historical records?')) clearHistoricalRecords() }}
              className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {([['whe', 'Import WHE Excel', FileSpreadsheet], ['csv', 'Import CSV', FileText], ['manual', 'Manual Entry', Plus]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); setPreview([]); setWarnings([]); setImported(false) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* WHE Import */}
      {tab === 'whe' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>How it works:</strong> Drop in any completed MassDOT WHE Form 1.3 Excel file. The parser reads task numbers (column B), task names (column C), and hours per staff category (columns E–K). Real projects may have custom tasks — those import as-is with their task numbers preserved.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-700">Project Metadata</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Project Name"><input value={wheMeta.projectName} onChange={e => setWheMeta(m => ({...m, projectName: e.target.value}))} placeholder="e.g. Route 9 Corridor" className="fi" /></Field>
              <Field label="Completion Date"><input type="date" value={wheMeta.completedDate} onChange={e => setWheMeta(m => ({...m, completedDate: e.target.value}))} className="fi" /></Field>
              <Field label="Project Type">
                <select value={wheMeta.projectType} onChange={e => setWheMeta(m => ({...m, projectType: e.target.value}))} className="fi">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="District">
                <select value={wheMeta.district} onChange={e => setWheMeta(m => ({...m, district: e.target.value}))} className="fi">
                  {['District 1','District 2','District 3','District 4','District 5','District 6'].map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              <Upload size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-amber-500" />
              <p className="text-sm font-medium text-slate-600">Click to upload completed WHE Form 1.3</p>
              <p className="text-xs text-slate-400 mt-1">.xlsx or .xls — estimated hours will be read from the form</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleWHEFile} className="hidden" />
            </div>
          </div>
        </div>
      )}

      {/* CSV Import */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700">CSV Import</h3>
                <p className="text-xs text-slate-400 mt-0.5">Best for bulk importing projects with both estimated AND actual hours</p>
              </div>
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                <Download size={14} /> Download Template
              </button>
            </div>

            <div
              onClick={() => csvRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            >
              <FileText size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-amber-500" />
              <p className="text-sm font-medium text-slate-600">Click to upload CSV file</p>
              <p className="text-xs text-slate-400 mt-1">Use the template above for proper column format</p>
              <input ref={csvRef} type="file" accept=".csv,.txt" onChange={handleCSVFile} className="hidden" />
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-600 mb-1">CSV columns:</div>
              <div>contract_number, project_name, project_type, district, phase, task_number, task_name, discipline, completed_date</div>
              <div>est_principal, est_project_manager, est_senior_engineer, est_engineer, est_designer, est_cadd, est_clerical</div>
              <div>act_principal, act_project_manager, act_senior_engineer, act_engineer, act_designer, act_cadd, act_clerical</div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry */}
      {tab === 'manual' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">Manual Entry</h3>
          <p className="text-xs text-slate-400">Enter one task at a time — best for a handful of key reference tasks</p>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Contract #"><input value={manualEntry.contractNumber} onChange={e => setManualEntry(m => ({...m, contractNumber: e.target.value}))} placeholder="107624" className="fi" /></Field>
            <Field label="Project Name"><input value={manualEntry.projectName} onChange={e => setManualEntry(m => ({...m, projectName: e.target.value}))} placeholder="Route 9 Corridor" className="fi" /></Field>
            <Field label="Completed Date"><input type="date" value={manualEntry.completedDate} onChange={e => setManualEntry(m => ({...m, completedDate: e.target.value}))} className="fi" /></Field>
            <Field label="Project Type">
              <select value={manualEntry.projectType} onChange={e => setManualEntry(m => ({...m, projectType: e.target.value}))} className="fi">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="District">
              <select value={manualEntry.district} onChange={e => setManualEntry(m => ({...m, district: e.target.value}))} className="fi">
                {['District 1','District 2','District 3','District 4','District 5','District 6'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Completed Date"><input type="date" value={manualEntry.completedDate} onChange={e => setManualEntry(m => ({...m, completedDate: e.target.value}))} className="fi" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Task Number"><input value={manualEntry.taskNumber} onChange={e => setManualEntry(m => ({...m, taskNumber: e.target.value}))} placeholder="305" className="fi" /></Field>
            <Field label="Task Name"><input value={manualEntry.taskName} onChange={e => setManualEntry(m => ({...m, taskName: e.target.value}))} placeholder="Preliminary Horizontal Geometry" className="fi" /></Field>
            <Field label="Phase">
              <select value={manualEntry.phase} onChange={e => setManualEntry(m => ({...m, phase: e.target.value}))} className="fi">
                {PHASES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Discipline">
              <select value={manualEntry.discipline} onChange={e => setManualEntry(m => ({...m, discipline: e.target.value}))} className="fi">
                {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          {/* Hours entry */}
          <div className="grid grid-cols-4 gap-3">
            {STAFF_CATEGORIES.map(cat => (
              <div key={cat}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{cat} — Est / Act</label>
                <div className="flex gap-1">
                  <input type="number" min={0} placeholder="Est"
                    value={manualEntry.estimatedHours[cat] ?? ''}
                    onChange={e => setManualEntry(m => ({...m, estimatedHours: {...m.estimatedHours, [cat]: Number(e.target.value)}}))}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <input type="number" min={0} placeholder="Act"
                    value={manualEntry.actualHours[cat] ?? ''}
                    onChange={e => setManualEntry(m => ({...m, actualHours: {...m.actualHours, [cat]: Number(e.target.value)}}))}
                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addManualEntry}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              imported ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}>
            {imported ? <CheckCircle2 size={15} /> : <Plus size={15} />}
            {imported ? 'Added!' : 'Add Record'}
          </button>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-amber-700"><AlertTriangle size={14} />{w}</div>
          ))}
        </div>
      )}

      {/* Preview + confirm */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Preview — {preview.length} tasks found</h3>
              <p className="text-xs text-slate-400 mt-0.5">Review before importing into historical database</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPreview([]); setWarnings([]) }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg">
                <X size={14} /> Discard
              </button>
              <button onClick={confirmImport}
                className="flex items-center gap-2 text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                <CheckCircle2 size={14} /> Import {preview.length} Records
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="px-4 py-2 text-left">Task #</th>
                  <th className="px-4 py-2 text-left">Task Name</th>
                  <th className="px-4 py-2 text-left">Phase</th>
                  <th className="px-4 py-2 text-left">Discipline</th>
                  <th className="px-4 py-2 text-right">Est. Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.map((r, i) => {
                  const total = Object.values(r.estimatedHours ?? {}).reduce((s, v) => s + v, 0)
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-1.5 font-mono font-bold text-amber-700">{r.taskNumber}</td>
                      <td className="px-4 py-1.5 text-slate-700 max-w-xs truncate">{r.taskName}</td>
                      <td className="px-4 py-1.5 text-slate-500">{r.phase}</td>
                      <td className="px-4 py-1.5 text-slate-500">{r.discipline}</td>
                      <td className="px-4 py-1.5 text-right font-semibold text-slate-700">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {imported && preview.length === 0 && tab !== 'manual' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
          <CheckCircle2 size={20} />
          <div>
            <div className="font-semibold">Import successful</div>
            <div className="text-sm text-green-600">Data is now available in Historical Analytics and will inform future AI estimates</div>
          </div>
        </div>
      )}

      {/* Loaded records summary */}
      {historicalRecords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Loaded Historical Records ({historicalRecords.length})</h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-500 font-semibold">
                  <th className="px-4 py-2 text-left">Contract</th>
                  <th className="px-4 py-2 text-left">Task #</th>
                  <th className="px-4 py-2 text-left">Task Name</th>
                  <th className="px-4 py-2 text-left">Phase</th>
                  <th className="px-4 py-2 text-right">Est. Hrs</th>
                  <th className="px-4 py-2 text-right">Act. Hrs</th>
                  <th className="px-4 py-2 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historicalRecords.map(r => {
                  const est = Object.values(r.estimatedHours).reduce((s, v) => s + v, 0)
                  const act = Object.values(r.actualHours).reduce((s, v) => s + v, 0)
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-1.5 text-slate-600">{r.contractNumber}</td>
                      <td className="px-4 py-1.5 font-mono font-bold text-amber-700">{r.taskNumber}</td>
                      <td className="px-4 py-1.5 text-slate-700 max-w-xs truncate">{r.taskName}</td>
                      <td className="px-4 py-1.5 text-slate-500">{r.phase}</td>
                      <td className="px-4 py-1.5 text-right font-medium">{est}</td>
                      <td className={`px-4 py-1.5 text-right font-medium ${act > 0 ? (act > est ? 'text-red-600' : 'text-green-600') : 'text-slate-300'}`}>
                        {act > 0 ? act : '—'}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${r.source === 'WHE Import' ? 'bg-green-100 text-green-700' : r.source === 'CSV Import' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {r.source}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`.fi { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 12px; font-size: 13px; color: #1e293b; outline: none; background: white; } .fi:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.15); }`}</style>
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
