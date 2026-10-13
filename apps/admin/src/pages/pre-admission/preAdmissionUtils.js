export const PRE_ADMISSION_STATUS_MAP = {
  PENDING_DOCS: { label: 'Aguardando docs', variant: 'amber' },
  UNDER_REVIEW: { label: 'Em análise RH', variant: 'blue' },
  FORWARDED_TO_DP: { label: 'No DP', variant: 'default' },
  APPROVED: { label: 'Aprovado DP', variant: 'green' },
  REJECTED: { label: 'Reprovado', variant: 'red' },
  HIRED: { label: 'Contratado', variant: 'green' },
}

export const CHECKLIST_STATUS_MAP = {
  PENDING: { label: 'Pendente', variant: 'default' },
  UPLOADED: { label: 'Enviado', variant: 'blue' },
  APPROVED: { label: 'Aprovado', variant: 'green' },
  REJECTED: { label: 'Reprovado', variant: 'red' },
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
