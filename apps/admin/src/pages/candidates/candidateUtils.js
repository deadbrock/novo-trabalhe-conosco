export const STATUS_MAP = {
  ACTIVE: { label: 'Ativo', variant: 'green' },
  PENDING: { label: 'Pendente', variant: 'amber' },
  INACTIVE: { label: 'Inativo', variant: 'default' },
}

export const APPLICATION_STATUS_MAP = {
  PENDING: { label: 'Pendente', variant: 'amber' },
  REVIEW: { label: 'Em análise', variant: 'blue' },
  INTERVIEW: { label: 'Entrevista', variant: 'blue' },
  OFFER: { label: 'Proposta', variant: 'green' },
  REJECTED: { label: 'Reprovado', variant: 'red' },
  WITHDRAWN: { label: 'Desistiu', variant: 'default' },
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function locationLabel(city, state) {
  if (city && state) return `${city}, ${state}`
  return city || state || '—'
}

export function formatMonthYear(value) {
  if (!value) return '—'
  const [year, month] = value.split('-')
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export function formatExperiencePeriod(experience) {
  const start = formatMonthYear(experience.startDate)
  const end = experience.current ? 'Atual' : formatMonthYear(experience.endDate)
  return `${start} — ${end}`
}

export function formatBirthDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')
}

export function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
