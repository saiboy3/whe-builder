import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react'
import { useApp } from '../context/AppContext'

const STAGES = ['Engineer', 'PM', 'Principal']

const stageIcon = {
  'DRAFT': <Clock size={16} className="text-slate-400" />,
  'Draft': <Clock size={16} className="text-slate-400" />,
  'SUBMITTED': <Clock size={16} className="text-blue-500" />,
  'Submitted': <Clock size={16} className="text-blue-500" />,
  'PM_APPROVED': <CheckCircle2 size={16} className="text-purple-500" />,
  'PM Approved': <CheckCircle2 size={16} className="text-purple-500" />,
  'PRINCIPAL_APPROVED': <CheckCircle2 size={16} className="text-green-500" />,
  'Principal Approved': <CheckCircle2 size={16} className="text-green-500" />,
  'REJECTED': <XCircle size={16} className="text-red-500" />,
  Rejected: <XCircle size={16} className="text-red-500" />,
}

export default function Approvals() {
  const { projects, updateProject, currentRole } = useApp()
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? '')
  const [comment, setComment] = useState('')

  const project = projects.find(p => p.id === selectedId)

  function getStepStatus(stage: number) {
    const status = project?.approvalStatus ?? 'Draft'
    if (status === 'Draft') return stage === 0 ? 'current' : 'pending'
    if (status === 'Submitted') return stage === 0 ? 'done' : stage === 1 ? 'current' : 'pending'
    if (status === 'PM Approved') return stage <= 1 ? 'done' : 'current'
    if (status === 'Principal Approved') return 'done'
    if (status === 'Rejected') return stage === 0 ? 'done' : 'rejected'
    return 'pending'
  }

  function approve() {
    if (!project) return
    const next: typeof project.approvalStatus = currentRole === 'Engineer' ? 'Submitted'
      : currentRole === 'PM' ? 'PM Approved'
      : 'Principal Approved'
    updateProject({ ...project, approvalStatus: next })
    setComment('')
  }

  function reject() {
    if (!project) return
    updateProject({ ...project, approvalStatus: 'Rejected' })
    setComment('')
  }

  function submit() {
    if (!project) return
    updateProject({ ...project, approvalStatus: 'Submitted' })
    setComment('')
  }

  const canSubmit = currentRole === 'Engineer' && project?.approvalStatus === 'Draft'
  const canApprove = (currentRole === 'PM' && project?.approvalStatus === 'Submitted')
    || (currentRole === 'Principal' && project?.approvalStatus === 'PM Approved')
  const canReject = canApprove

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-800">Approval Workflow</h1>

      <div className="grid grid-cols-3 gap-4">
        {/* Project list */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-600">Projects</div>
          <div className="divide-y divide-slate-100">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${selectedId === p.id ? 'bg-amber-50 border-r-2 border-amber-500' : 'hover:bg-slate-50'}`}
              >
                <div>
                  <div className="text-sm font-medium text-slate-800 truncate max-w-[160px]">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.contractNumber}</div>
                </div>
                <div className="flex-shrink-0">
                  {stageIcon[p.approvalStatus as keyof typeof stageIcon] ?? <Clock size={16} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow detail */}
        <div className="col-span-2 space-y-4">
          {project && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-bold text-slate-800 mb-1">{project.name}</h2>
                <p className="text-xs text-slate-400 mb-4">{project.contractNumber} · PM: {project.pm}</p>

                {/* Stage timeline */}
                <div className="flex items-center gap-0">
                  {STAGES.map((stage, i) => {
                    const stepStatus = getStepStatus(i)
                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className={`flex-1 flex flex-col items-center p-3 rounded-lg border ${
                          stepStatus === 'done' ? 'border-green-300 bg-green-50'
                          : stepStatus === 'current' ? 'border-amber-300 bg-amber-50'
                          : stepStatus === 'rejected' ? 'border-red-300 bg-red-50'
                          : 'border-slate-200 bg-white'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                            stepStatus === 'done' ? 'bg-green-500 text-white'
                            : stepStatus === 'current' ? 'bg-amber-500 text-white'
                            : stepStatus === 'rejected' ? 'bg-red-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                          }`}>
                            {stepStatus === 'done' ? <CheckCircle2 size={16} />
                              : stepStatus === 'rejected' ? <XCircle size={16} />
                              : <span className="text-xs font-bold">{i + 1}</span>}
                          </div>
                          <div className="text-xs font-semibold text-slate-600">{stage}</div>
                          <div className="text-xs text-slate-400 capitalize">{stepStatus}</div>
                        </div>
                        {i < STAGES.length - 1 && (
                          <ChevronRight size={16} className="text-slate-300 mx-1 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action panel */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <MessageSquare size={15} /> Add Comment
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment or revision note..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-amber-300"
                />
                <div className="flex gap-3">
                  {canSubmit && (
                    <button onClick={submit}
                      className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                      Submit for PM Review
                    </button>
                  )}
                  {canApprove && (
                    <button onClick={approve}
                      className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                      <CheckCircle2 size={15} /> Approve
                    </button>
                  )}
                  {canReject && (
                    <button onClick={reject}
                      className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                      <XCircle size={15} /> Reject
                    </button>
                  )}
                  {!canSubmit && !canApprove && (
                    <p className="text-sm text-slate-400 italic">
                      Your role ({currentRole}) has no pending actions on this project.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
