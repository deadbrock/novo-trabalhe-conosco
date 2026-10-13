/** Registro extensível de documentos eletrônicos do portal do candidato */
export const CANDIDATE_DOCUMENT_REGISTRY = {
  ETHNIC_DECLARATION: {
    type: 'ETHNIC_DECLARATION',
    slug: 'ethnic-declaration',
    label: 'Autodeclaração Étnico-Racial',
    description: 'Declaração de autoidentificação étnico-racial para admissão.',
    documentationItemSlug: 'autodeclaracao',
    routePath: '/portal-do-candidato/autodeclaracao-etnica',
  },
  // Futuro: LGPD, WORK_CONTRACT, TRANSPORT_VOUCHER, etc.
}

export const RACE_CATEGORY_OPTIONS = [
  { value: 'BRANCA', label: 'Branca' },
  { value: 'PRETA', label: 'Preta' },
  { value: 'PARDA', label: 'Parda' },
  { value: 'AMARELA', label: 'Amarela' },
  { value: 'INDIGENA', label: 'Indígena' },
]

export const RACE_CATEGORY_LABELS = Object.fromEntries(
  RACE_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
)

export const DOCUMENT_STATUS_LABELS = {
  PENDING: 'Aguardando assinatura',
  SIGNED: 'Concluído',
  REJECTED: 'Reprovado',
}

export function getDocumentDefinition(type) {
  return Object.values(CANDIDATE_DOCUMENT_REGISTRY).find((entry) => entry.type === type) || null
}

export function isValidRaceCategory(value) {
  return RACE_CATEGORY_OPTIONS.some((item) => item.value === value)
}

export function formatCurrentDatePtBr(date = new Date()) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
