import { useState } from 'react'
import { Save, CheckCircle2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  designEscalationFactor, deriveBillingRates,
  computeMeanSalaryRates, MASSDOT_TITLE_MAP
} from '../lib/rateEscalation'
import { STAFF_CATEGORIES } from '../types'

export default function RateConfig() {
  const { rateConfig, setRateConfig, billingRates } = useApp()
  const [form, setForm] = useState({ ...rateConfig })
  const [saved, setSaved] = useState(false)
  const [showHED640, setShowHED640] = useState(false)

  const designFactor = designEscalationFactor(form.designMonths)
  const derivedRates = deriveBillingRates(form)
  const meanRates = computeMeanSalaryRates(form)

  function setBillingRate(cat: string, val: number) {
    setForm(f => ({ ...f, billingRates: { ...f.billingRates, [cat]: val } }))
  }

  function setDirectRate(cat: string, val: number) {
    setForm(f => ({ ...f, directSalaryRates: { ...f.directSalaryRates, [cat]: val } }))
  }

  function applyDerived() {
    setForm(f => ({ ...f, billingRates: deriveBillingRates(f) }))
  }

  function save() {
    setRateConfig(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rate Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Set your firm's billing rates — used across all project fee calculations
        </p>
      </div>

      {/* Primary: Billing Rates */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Billing Rates</h2>
            <p className="text-xs text-slate-400 mt-0.5">What you charge clients per hour — used to calculate estimated fees in the WBS builder</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Staff Category</th>
              <th className="px-4 py-3 text-left">MassDOT Title</th>
              <th className="px-4 py-3 text-right">Billing Rate ($/hr)</th>
              <th className="px-4 py-3 text-right">Current Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STAFF_CATEGORIES.map(cat => {
              const current = billingRates[cat] ?? 0
              const newRate = form.billingRates[cat] ?? 0
              const changed = Math.abs(newRate - current) > 0.01
              return (
                <tr key={cat} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{cat}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{MASSDOT_TITLE_MAP[cat]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-400 text-xs">$</span>
                      <input
                        type="number" min={0} step={5}
                        value={newRate}
                        onChange={e => setBillingRate(cat, Number(e.target.value))}
                        className="w-28 text-right border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
                      />
                      <span className="text-slate-400 text-xs">/hr</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${changed ? 'text-amber-600' : 'text-slate-500'}`}>
                      ${current.toFixed(0)}{changed ? ` → $${newRate.toFixed(0)}` : ''}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Overhead & Profit (for reference / HED-640) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Overhead & Profit</h2>
        <p className="text-xs text-slate-400">Used by the HED-640 calculator below. Not applied to billing rates (those are already loaded).</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Overhead Multiplier</label>
            <input type="number" min={1} max={4} step={0.01}
              value={form.overheadMultiplier}
              onChange={e => setForm(f => ({ ...f, overheadMultiplier: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-xs text-slate-400 mt-1">Typically 1.50–2.50 for engineering firms</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Profit Rate (e.g. 0.10 = 10%)</label>
            <input type="number" min={0} max={0.3} step={0.01}
              value={form.profitRate}
              onChange={e => setForm(f => ({ ...f, profitRate: Number(e.target.value) }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* HED-640 Calculator (collapsible) */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        <button
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
          onClick={() => setShowHED640(v => !v)}
        >
          <div className="text-left">
            <div className="font-semibold text-slate-700">HED-640 Calculator (Reference)</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Derive billing rates from direct salaries using MassDOT's 3% escalation formula — for audit / submission verification
            </div>
          </div>
          {showHED640 ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </button>

        {showHED640 && (
          <div className="border-t border-slate-200 p-5 space-y-5 bg-white">
            {/* Duration inputs */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Design Phase Duration (months)</label>
                <input type="number" min={1} max={120}
                  value={form.designMonths}
                  onChange={e => setForm(f => ({ ...f, designMonths: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Construction Phase Duration (months)</label>
                <input type="number" min={0} max={120}
                  value={form.constructionMonths}
                  onChange={e => setForm(f => ({ ...f, constructionMonths: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-amber-800 text-xs mb-1">Design Escalation Factor</div>
                <div className="text-xl font-bold text-amber-700">{designFactor.toFixed(4)}</div>
                <div className="text-xs text-slate-400 mt-1">Formula: (1 + 1.03^d) / 2</div>
                <div className="text-xs text-slate-400">d = {(form.designMonths / 12).toFixed(2)} years</div>
              </div>
            </div>

            {/* Direct salary table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-right">Direct Salary ($/hr)</th>
                  <th className="px-4 py-2 text-right">Mean Design Rate</th>
                  <th className="px-4 py-2 text-right">Derived Billing Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STAFF_CATEGORIES.map(cat => (
                  <tr key={cat} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700">{cat}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400 text-xs">$</span>
                        <input type="number" min={0} step={0.5}
                          value={form.directSalaryRates[cat] ?? 0}
                          onChange={e => setDirectRate(cat, Number(e.target.value))}
                          className="w-20 text-right border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-300"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600 text-xs">${(meanRates[cat] ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-700">${(derivedRates[cat] ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-3">
              <button
                onClick={applyDerived}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw size={14} /> Apply Derived Rates as Billing Rates
              </button>
              <span className="text-xs text-slate-400">This will overwrite the billing rates above</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Rates'}
        </button>
      </div>
    </div>
  )
}
