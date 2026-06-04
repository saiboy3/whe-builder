import { useState } from 'react'
import { Save, CheckCircle2, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  designEscalationFactor, constructionEscalationFactor,
  computeMeanSalaryRates, computeBillingRates,
  MASSDOT_TITLE_MAP, ANNUAL_INFLATION
} from '../lib/rateEscalation'
import { STAFF_CATEGORIES } from '../types'

export default function RateConfig() {
  const { rateConfig, setRateConfig, billingRates } = useApp()
  const [form, setForm] = useState({ ...rateConfig })
  const [saved, setSaved] = useState(false)

  const designFactor = designEscalationFactor(form.designMonths)
  const constructionFactor = constructionEscalationFactor(form.designMonths, form.constructionMonths)
  const meanRates = computeMeanSalaryRates(form)
  const previewBillingRates = computeBillingRates(form)

  function setRate(cat: string, val: number) {
    setForm(f => ({ ...f, existingRates: { ...f.existingRates, [cat]: val } }))
  }

  function save() {
    setRateConfig(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rate Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">
          HED-640 salary escalation engine — rates auto-escalate at {((ANNUAL_INFLATION - 1) * 100).toFixed(0)}% annually per MassDOT methodology
        </p>
      </div>

      {/* Duration inputs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Project Duration</h2>
        <p className="text-xs text-slate-400">Used to compute mean salary rates per the HED-640 escalation formula</p>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Design Phase Duration (months)</label>
            <input
              type="number" min={1} max={120}
              value={form.designMonths}
              onChange={e => setForm(f => ({ ...f, designMonths: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Construction Phase Duration (months)</label>
            <input
              type="number" min={0} max={120}
              value={form.constructionMonths}
              onChange={e => setForm(f => ({ ...f, constructionMonths: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-1">
            <div className="font-semibold text-amber-800">Escalation Factors</div>
            <div className="text-xs text-amber-700">Design phase: <strong>{designFactor.toFixed(4)}</strong></div>
            <div className="text-xs text-amber-700">Construction phase: <strong>{constructionFactor.toFixed(4)}</strong></div>
            <div className="text-xs text-slate-400 mt-1">Formula: (1 + 1.03^d) / 2</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Overhead Multiplier
              <span className="ml-2 text-slate-400 font-normal">(firm's overhead rate, typically 1.50–2.50)</span>
            </label>
            <input
              type="number" min={1} max={4} step={0.01}
              value={form.overheadMultiplier}
              onChange={e => setForm(f => ({ ...f, overheadMultiplier: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Profit Rate
              <span className="ml-2 text-slate-400 font-normal">(e.g. 0.10 = 10%)</span>
            </label>
            <input
              type="number" min={0} max={0.3} step={0.01}
              value={form.profitRate}
              onChange={e => setForm(f => ({ ...f, profitRate: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Rate table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Direct Salary Rates</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your firm's current average direct salary rates — these are NOT billing rates</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <Info size={13} />
            Per HED-640 instructions
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Staff Category</th>
              <th className="px-4 py-3 text-left">MassDOT Title</th>
              <th className="px-4 py-3 text-right">Existing Avg Rate ($/hr)</th>
              <th className="px-4 py-3 text-right">Mean Design Rate ($/hr)</th>
              <th className="px-4 py-3 text-right">Billing Rate ($/hr)</th>
              <th className="px-4 py-3 text-right">vs. Current</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STAFF_CATEGORIES.map(cat => {
              const existing = form.existingRates[cat] ?? 0
              const mean = meanRates[cat] ?? 0
              const billing = previewBillingRates[cat] ?? 0
              const currentBilling = billingRates[cat] ?? 0
              const diff = billing - currentBilling
              return (
                <tr key={cat} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{cat}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{MASSDOT_TITLE_MAP[cat]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-400 text-xs">$</span>
                      <input
                        type="number" min={0} step={0.50}
                        value={existing}
                        onChange={e => setRate(cat, Number(e.target.value))}
                        className="w-24 text-right border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-slate-700">${mean.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-amber-700">${billing.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-medium ${diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}$${diff.toFixed(2)}`}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={6} className="px-5 py-2 text-xs text-slate-400">
                Billing Rate = Mean Design Rate × {form.overheadMultiplier}x OH × {(1 + form.profitRate).toFixed(2)} profit
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Rate Configuration'}
        </button>
      </div>
    </div>
  )
}
