import { X, Mail, Phone, Briefcase, Link2, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { STATUS_MAP, formatDate } from './talentPoolUtils'
import { useAuth } from '@/context/AuthContext'

const STATUS_ACTIONS = [
  { status: 'PENDING', label: 'Marcar pendente' },
  { status: 'REVIEWED', label: 'Marcar analisado' },
  { status: 'CONVERTED', label: 'Marcar convertido' },
  { status: 'ARCHIVED', label: 'Arquivar' },
]

export function TalentPoolDetailPanel({
  entry,
  onClose,
  onStatusChange,
  onDownloadResume,
  updating,
  downloading,
}) {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('talent_pool:write')
  const statusInfo = STATUS_MAP[entry.status] || STATUS_MAP.PENDING

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar" />
      <aside className="relative w-full max-w-md bg-white h-full shadow-xl border-l border-neutral-200 flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{entry.name}</h2>
            <Badge variant={statusInfo.variant} className="mt-2">
              {statusInfo.label}
            </Badge>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          <InfoRow icon={Mail} label="E-mail" value={entry.email} />
          <InfoRow icon={Phone} label="Telefone" value={entry.phone} />
          <InfoRow icon={Briefcase} label="Vaga pretendida" value={entry.desiredJob} />
          <InfoRow icon={Briefcase} label="Área" value={entry.areaLabel || entry.area} />
          {entry.linkedin && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">LinkedIn</p>
              <a
                href={entry.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#003d7a] hover:underline break-all"
              >
                <Link2 size={14} />
                {entry.linkedin}
              </a>
            </div>
          )}
          {entry.message && (
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">Mensagem</p>
              <p className="text-neutral-700 whitespace-pre-wrap">{entry.message}</p>
            </div>
          )}
          <div className="text-xs text-neutral-400">
            Cadastrado em {formatDate(entry.createdAt)}
          </div>
        </div>

        <footer className="p-5 border-t border-neutral-100 space-y-3">
          {entry.hasResume && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onDownloadResume(entry)}
              disabled={downloading}
            >
              <Download size={16} />
              {downloading ? 'Baixando...' : 'Baixar currículo'}
            </Button>
          )}
          {!entry.hasResume && (
            <p className="text-xs text-neutral-400 flex items-center gap-1.5">
              <FileText size={14} />
              Currículo não anexado
            </p>
          )}
          {canWrite && (
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ACTIONS.map((action) => (
                <Button
                  key={action.status}
                  variant={entry.status === action.status ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={updating || entry.status === action.status}
                  onClick={() => onStatusChange(entry.id, action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </footer>
      </aside>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-400 mb-1">{label}</p>
      <p className="inline-flex items-center gap-1.5 text-neutral-800">
        <Icon size={14} className="text-neutral-400 shrink-0" />
        {value || '—'}
      </p>
    </div>
  )
}
