import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, CheckCircle2, Clock } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useApp } from '../context/AppContext'
import { STAFF_CATEGORIES, DEFAULT_RATES, OVERHEAD_MULTIPLIER, PROFIT_RATE, PHASES } from '../types'

interface ExportEntry { format: string; version: number; date: string }

function totalHours(entry: Record<string, number>) {
  return Object.values(entry).reduce((s, v) => s + (v || 0), 0)
}

export default function ExportCenter() {
  const { projects, selectedProjectId } = useApp()
  const project = projects.find(p => p.id === selectedProjectId)
  const [log, setLog] = useState<ExportEntry[]>([])
  const [exporting, setExporting] = useState<string | null>(null)

  if (!project) {
    return <div className="p-6 text-slate-400 text-sm">No project selected.</div>
  }

  const tasks = project.tasks ?? []

  function addLog(format: string, version: number) {
    setLog(prev => [{ format, version, date: new Date().toLocaleString() }, ...prev])
  }

  async function exportMassDOT() {
    setExporting('massdot')
    const wb = XLSX.utils.book_new()

    // Cover sheet
    const coverData = [
      ['MassDOT WORK HOUR ESTIMATE'],
      [],
      ['Contract Number:', project!.contractNumber],
      ['Project Name:', project!.name],
      ['District:', project!.district],
      ['Project Manager:', project!.pm ?? ''],
      ['Date:', new Date().toLocaleDateString()],
      ['Approval Status:', project!.approvalStatus],
    ]
    const coverSheet = XLSX.utils.aoa_to_sheet(coverData)
    coverSheet['A1'] = { v: 'MassDOT WORK HOUR ESTIMATE', t: 's', s: { font: { bold: true, sz: 16 } } }
    XLSX.utils.book_append_sheet(wb, coverSheet, 'Cover')

    // WHE sheet per phase
    for (const phase of PHASES) {
      const phaseTasks = tasks.filter(t => t.phase === phase)
      if (phaseTasks.length === 0) continue

      const header = ['Phase', 'Discipline', 'Task', ...STAFF_CATEGORIES, 'Total Est. Hrs', 'Factor', 'Total Adj. Hrs', 'Labor Cost']
      const rows = phaseTasks.map(t => {
        const est = totalHours(t.hours)
        const adj = totalHours(t.adjustedHours)
        const labor = STAFF_CATEGORIES.reduce((s, c) => s + (t.adjustedHours[c] || 0) * DEFAULT_RATES[c], 0)
        return [
          t.phase, t.discipline, t.taskName,
          ...STAFF_CATEGORIES.map(c => t.hours[c] || 0),
          est, t.factor, adj,
          `$${labor.toFixed(2)}`,
        ]
      })

      // Totals row
      const totals = ['', '', 'TOTAL',
        ...STAFF_CATEGORIES.map(c => phaseTasks.reduce((s, t) => s + (t.hours[c] || 0), 0)),
        phaseTasks.reduce((s, t) => s + totalHours(t.hours), 0),
        '',
        phaseTasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0),
        `$${phaseTasks.reduce((s, t) => s + STAFF_CATEGORIES.reduce((ls, c) => ls + (t.adjustedHours[c] || 0) * DEFAULT_RATES[c], 0), 0).toFixed(2)}`,
      ]

      const sheetData = [header, ...rows, [], totals]
      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(wb, ws, phase.slice(0, 31))
    }

    // Summary sheet
    const laborTotal = tasks.reduce((s, t) => s + STAFF_CATEGORIES.reduce((ls, c) => ls + (t.adjustedHours[c] || 0) * DEFAULT_RATES[c], 0), 0)
    const withOH = laborTotal * OVERHEAD_MULTIPLIER
    const withProfit = withOH * (1 + PROFIT_RATE)

    const summaryData = [
      ['COST SUMMARY'],
      [],
      ['Total Adjusted Hours:', tasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0)],
      ['Direct Labor Cost:', `$${laborTotal.toFixed(2)}`],
      [`Overhead (${OVERHEAD_MULTIPLIER}x):`, `$${(withOH - laborTotal).toFixed(2)}`],
      [`Profit (${(PROFIT_RATE * 100).toFixed(0)}%):`, `$${(withProfit - withOH).toFixed(2)}`],
      ['TOTAL ESTIMATED FEE:', `$${withProfit.toFixed(2)}`],
      [],
      ['Billing Rates:'],
      ...STAFF_CATEGORIES.map(c => [c, `$${DEFAULT_RATES[c]}/hr`]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

    XLSX.writeFile(wb, `WHE_${project!.contractNumber}_${project!.name.replace(/\s+/g, '_')}.xlsx`)
    addLog('MassDOT Excel', (log.filter(l => l.format === 'MassDOT Excel').length + 1))
    setExporting(null)
  }

  function exportPDF() {
    setExporting('pdf')
    const laborTotal = tasks.reduce((s, t) => s + STAFF_CATEGORIES.reduce((ls, c) => ls + (t.adjustedHours[c] || 0) * DEFAULT_RATES[c], 0), 0)
    const withOH = laborTotal * OVERHEAD_MULTIPLIER * (1 + PROFIT_RATE)

    const html = `
      <html><head><title>WHE Summary</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#1e293b}h1{color:#92400e}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc;font-weight:600}tr:nth-child(even){background:#f8fafc}.total{background:#92400e!important;color:white;font-weight:bold}</style>
      </head><body>
      <h1>MassDOT Work Hour Estimate</h1>
      <p><strong>Contract:</strong> ${project!.contractNumber} &nbsp; <strong>Project:</strong> ${project!.name}</p>
      <p><strong>District:</strong> ${project!.district} &nbsp; <strong>PM:</strong> ${project!.pm ?? ''} &nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <br>
      <table>
        <tr><th>Phase</th><th>Discipline</th><th>Task</th><th>Est. Hours</th><th>Factor</th><th>Adj. Hours</th></tr>
        ${tasks.map(t => `<tr><td>${t.phase}</td><td>${t.discipline}</td><td>${t.taskName}</td><td>${totalHours(t.hours)}</td><td>${t.factor}</td><td><strong>${totalHours(t.adjustedHours)}</strong></td></tr>`).join('')}
        <tr class="total"><td colspan="5">TOTAL ADJUSTED HOURS</td><td>${tasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0)}</td></tr>
      </table>
      <br><h2>Cost Summary</h2>
      <p>Total Estimated Fee (incl. OH + Profit): <strong>$${withOH.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></p>
      </body></html>
    `
    const w = window.open('', '_blank')!
    w.document.write(html)
    w.document.close()
    w.print()
    addLog('PDF Summary', (log.filter(l => l.format === 'PDF Summary').length + 1))
    setExporting(null)
  }

  const grandAdj = tasks.reduce((s, t) => s + totalHours(t.adjustedHours), 0)
  const laborTotal = tasks.reduce((s, t) => s + STAFF_CATEGORIES.reduce((ls, c) => ls + (t.adjustedHours[c] || 0) * DEFAULT_RATES[c], 0), 0)
  const totalFee = laborTotal * OVERHEAD_MULTIPLIER * (1 + PROFIT_RATE)

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Export Center</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <h2 className="font-semibold text-slate-700 text-sm mb-3">{project.name} — {project.contractNumber}</h2>
        <div className="flex gap-8 text-sm">
          <div><span className="text-slate-400">Total Adj. Hours:</span> <strong className="text-slate-800">{grandAdj.toLocaleString()}</strong></div>
          <div><span className="text-slate-400">Estimated Fee:</span> <strong className="text-amber-700">${totalFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
          <div><span className="text-slate-400">Approval Status:</span> <strong className="text-slate-800">{(project.approvalStatus ?? '').replace(/_/g, ' ')}</strong></div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-4">
        <ExportCard
          icon={<FileSpreadsheet size={28} className="text-green-600" />}
          title="MassDOT Excel Format"
          description="Official Work Hour Estimate spreadsheet. One sheet per phase, matching MassDOT submission format exactly."
          buttonLabel="Download .xlsx"
          loading={exporting === 'massdot'}
          onClick={exportMassDOT}
          accent="green"
        />
        <ExportCard
          icon={<FileText size={28} className="text-blue-600" />}
          title="PDF Summary Report"
          description="Printable summary with task breakdown and cost summary. Suitable for PM review meetings."
          buttonLabel="Generate PDF"
          loading={exporting === 'pdf'}
          onClick={exportPDF}
          accent="blue"
        />
      </div>

      {/* Export log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-600">Download History</div>
        {log.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No exports yet for this session.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
              <th className="px-5 py-2 text-left">Format</th>
              <th className="px-4 py-2 text-left">Version</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {log.map((entry, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800">{entry.format}</td>
                  <td className="px-4 py-3 text-slate-500">v{entry.version}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.date}</td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><CheckCircle2 size={13} /> Downloaded</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ExportCard({ icon, title, description, buttonLabel, loading, onClick, accent }: {
  icon: React.ReactNode; title: string; description: string; buttonLabel: string
  loading: boolean; onClick: () => void; accent: 'green' | 'blue'
}) {
  const colors = {
    green: { bg: 'bg-green-50', border: 'border-green-200', btn: 'bg-green-600 hover:bg-green-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700' },
  }
  const c = colors[accent]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 flex-1">{description}</p>
      <button
        onClick={onClick}
        disabled={loading}
        className={`${c.btn} text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60`}
      >
        {loading ? <Clock size={15} className="animate-spin" /> : <Download size={15} />}
        {loading ? 'Generating...' : buttonLabel}
      </button>
    </div>
  )
}
