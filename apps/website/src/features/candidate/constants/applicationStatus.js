export const APPLICATION_STATUS = {
  pending: { label: 'Em análise', variant: 'blue' },
  review: { label: 'Triagem', variant: 'default' },
  interview: { label: 'Entrevista agendada', variant: 'brand' },
  offer: { label: 'Proposta', variant: 'blue' },
  rejected: { label: 'Encerrada', variant: 'outline' },
  withdrawn: { label: 'Cancelada', variant: 'outline' },
}

export function formatApplicationDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pt-BR')
}
