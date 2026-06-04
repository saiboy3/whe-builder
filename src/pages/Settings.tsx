import { useSearchParams } from 'react-router-dom'
import RateConfig from './RateConfig'
import ImportData from './ImportData'
import Templates from './Templates'
import { DollarSign, Upload, LayoutTemplate } from 'lucide-react'

const TABS = [
  { id: 'rates',     label: 'Billing Rates',    icon: DollarSign },
  { id: 'import',    label: 'Import Data',       icon: Upload },
  { id: 'templates', label: 'WBS Templates',     icon: LayoutTemplate },
]

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'rates'

  return (
    <div className="flex h-full">
      {/* Settings sub-nav */}
      <div className="w-44 border-r border-slate-200 bg-white pt-6 flex-shrink-0">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Settings</p>
        </div>
        <nav className="space-y-0.5 px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setParams({ tab: id })}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                tab === id
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === 'rates'     && <RateConfig />}
        {tab === 'import'    && <ImportData />}
        {tab === 'templates' && <Templates />}
      </div>
    </div>
  )
}
