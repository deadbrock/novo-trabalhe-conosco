export const CHANNEL_MAP = {
  EMAIL: { label: 'E-mail', variant: 'blue' },
  WHATSAPP: { label: 'WhatsApp', variant: 'green' },
}

export const LOG_STATUS_MAP = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  SENT: { label: 'Enviado', variant: 'green' },
  FAILED: { label: 'Falhou', variant: 'red' },
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

export const TEMPLATE_VARIABLES = ['{{nome}}', '{{email}}', '{{vaga}}', '{{empresa}}', '{{data_entrevista}}', '{{link}}']
