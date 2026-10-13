export const STAGE_COLOR_STYLES = {
  blue: { header: 'bg-blue-50/80 border-blue-200', dot: 'bg-blue-500', text: 'text-blue-700' },
  violet: { header: 'bg-violet-50/80 border-violet-200', dot: 'bg-violet-500', text: 'text-violet-700' },
  cyan: { header: 'bg-cyan-50/80 border-cyan-200', dot: 'bg-cyan-500', text: 'text-cyan-700' },
  amber: { header: 'bg-amber-50/80 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
  orange: { header: 'bg-orange-50/80 border-orange-200', dot: 'bg-orange-500', text: 'text-orange-700' },
  indigo: { header: 'bg-indigo-50/80 border-indigo-200', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  emerald: { header: 'bg-emerald-50/80 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  green: { header: 'bg-green-50/80 border-green-200', dot: 'bg-green-500', text: 'text-green-700' },
  slate: { header: 'bg-neutral-50/80 border-neutral-200', dot: 'bg-neutral-400', text: 'text-neutral-700' },
}

export const STAGE_COLOR_OPTIONS = Object.keys(STAGE_COLOR_STYLES)

export function stageStyles(color) {
  return STAGE_COLOR_STYLES[color] || STAGE_COLOR_STYLES.slate
}

export function formatRelativeDate(iso) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days}d atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
