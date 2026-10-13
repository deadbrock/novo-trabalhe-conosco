import { Mail, Briefcase } from 'lucide-react'
import { formatRelativeDate } from './pipelineUtils'

const OWNER_LABEL = {
  LOCAL: 'Origem',
  HQ_HR: 'RH sede',
  DP: 'DP',
}

function formatClock(clock) {
  if (!clock || clock.status === 'COMPLETED') return null
  const days = clock.elapsedDays
  const hours = clock.elapsedHours
  if (days >= 1) return `${days}d`
  return `${hours}h`
}

export function ApplicationCard({ application, onDragStart, isDragging }) {
  const rhLabel = formatClock(application.rhClock)
  const dpLabel = formatClock(application.dpClock)

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, application)}
      className={`rounded-lg border border-neutral-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50 ring-2 ring-[#003d7a]/30' : ''
      }`}
    >
      <h4 className="text-sm font-medium text-neutral-900 leading-snug">{application.candidateName}</h4>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 truncate">
        <Mail size={12} className="shrink-0" />
        {application.candidateEmail}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600">
        <Briefcase size={12} className="shrink-0 text-neutral-400" />
        <span className="truncate">{application.jobTitle}</span>
      </p>
      {application.unitName && (
        <p className="mt-1 text-[11px] text-neutral-500 truncate">{application.unitName}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {application.currentOwner && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-neutral-100 text-neutral-600 px-2 py-0.5">
            {OWNER_LABEL[application.currentOwner] || application.currentOwner}
          </span>
        )}
        {rhLabel && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-amber-50 text-amber-800 px-2 py-0.5">
            RH {rhLabel}
          </span>
        )}
        {dpLabel && (
          <span className="text-[10px] uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5">
            DP {dpLabel}
          </span>
        )}
      </div>
      {application.returnedReason && (
        <p className="mt-2 text-[11px] text-red-700 bg-red-50 rounded px-2 py-1">
          Devolvido: {application.returnedReason}
        </p>
      )}
      <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-400">
        {formatRelativeDate(application.updatedAt || application.createdAt)}
      </p>
    </article>
  )
}
