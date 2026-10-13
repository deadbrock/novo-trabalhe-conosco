export const INTERVIEW_STATUS_MAP = {
  SCHEDULED: { label: 'Agendada', variant: 'blue' },
  COMPLETED: { label: 'Concluída', variant: 'green' },
  CANCELLED: { label: 'Cancelada', variant: 'default' },
  NO_SHOW: { label: 'Não compareceu', variant: 'red' },
}

export const INTERVIEW_TYPE_MAP = {
  PHONE: 'Telefone',
  VIDEO: 'Vídeo',
  IN_PERSON: 'Presencial',
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

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function groupInterviewsByDay(interviews) {
  const groups = new Map()

  for (const interview of interviews) {
    const dayKey = new Date(interview.scheduledAt).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    if (!groups.has(dayKey)) groups.set(dayKey, [])
    groups.get(dayKey).push(interview)
  }

  return Array.from(groups.entries())
}
