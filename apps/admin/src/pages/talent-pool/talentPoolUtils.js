export const STATUS_MAP = {
  PENDING: { label: 'Pendente', variant: 'amber' },
  REVIEWED: { label: 'Analisado', variant: 'blue' },
  CONVERTED: { label: 'Convertido', variant: 'green' },
  ARCHIVED: { label: 'Arquivado', variant: 'default' },
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
