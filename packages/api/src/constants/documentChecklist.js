/** Checklist padrão — etapa Documentação (RH) e Pré-admissão (DP) */
export const DEFAULT_DOCUMENT_CHECKLIST_ITEMS = [
  {
    slug: 'ctps_digital',
    label: 'CTPS Digital',
    description:
      'Carteira de Trabalho Digital (print ou PDF do app CTPS Digital, ou comprovante da versão digital).',
    sortOrder: 0,
    required: true,
  },
  {
    slug: 'rg_cpf',
    label: 'RG e CPF',
    description:
      'Documento de identidade com foto (RG ou CNH) e CPF. Envie frente e verso quando aplicável.',
    sortOrder: 1,
    required: true,
  },
  {
    slug: 'comprovante_residencia',
    label: 'Comprovante de residência recente',
    description: 'Conta de luz, água, telefone ou similar emitido nos últimos 90 dias.',
    sortOrder: 2,
    required: true,
  },
  {
    slug: 'certificado_reservista',
    label: 'Certificado de reservista',
    description: 'Obrigatório para candidatos do sexo masculino.',
    sortOrder: 3,
    required: false,
  },
  {
    slug: 'certidao_nascimento_filhos',
    label: 'Certidão de nascimento dos filhos (até 14 anos)',
    description: 'Envie se tiver filhos com até 14 anos de idade.',
    sortOrder: 4,
    required: false,
  },
  {
    slug: 'cpf_filhos',
    label: 'CPF dos filhos',
    description: 'Envie se tiver filhos com até 14 anos de idade.',
    sortOrder: 5,
    required: false,
  },
  {
    slug: 'titulo_eleitor',
    label: 'Título de eleitor',
    description: 'Documento ou comprovante do Título de Eleitor.',
    sortOrder: 6,
    required: true,
  },
  {
    slug: 'antecedentes_criminais',
    label: 'Antecedentes criminais',
    description: 'Certidão emitida no site unificado do TJPE (Pernambuco).',
    helpUrl: 'https://certidoesunificadas.app.tjpe.jus.br/',
    sortOrder: 7,
    required: true,
  },
  {
    slug: 'autodeclaracao',
    label: 'Autodeclaração Étnico-Racial',
    description:
      'Preencha e assine eletronicamente pelo portal — os dados são gerados automaticamente, sem necessidade de enviar PDF.',
    sortOrder: 8,
    required: true,
  },
]

const CHECKLIST_META_BY_SLUG = Object.fromEntries(
  DEFAULT_DOCUMENT_CHECKLIST_ITEMS.map((item) => [
    item.slug,
    { helpUrl: item.helpUrl || null },
  ]),
)

export function getChecklistItemMeta(slug, label) {
  if (slug && CHECKLIST_META_BY_SLUG[slug]) {
    return CHECKLIST_META_BY_SLUG[slug]
  }
  if (label) {
    const item = DEFAULT_DOCUMENT_CHECKLIST_ITEMS.find((entry) => entry.label === label)
    if (item) return { helpUrl: item.helpUrl || null }
  }
  return { helpUrl: null }
}

/** Identifica item de autodeclaração (slug ou rótulos legados no banco) */
export function isEthnicDeclarationChecklistItem(slug, label) {
  if (slug === 'autodeclaracao') return true
  return /autodeclara/i.test(String(label || ''))
}

export function resolveChecklistCanonicalSlug(slug, label) {
  if (isEthnicDeclarationChecklistItem(slug, label)) return 'autodeclaracao'
  return slug || ''
}

export function resolveChecklistItemDefaults(slug, label) {
  const canonical = resolveChecklistCanonicalSlug(slug, label)
  if (canonical) {
    const bySlug = DEFAULT_DOCUMENT_CHECKLIST_ITEMS.find((entry) => entry.slug === canonical)
    if (bySlug) return bySlug
  }
  return (
    DEFAULT_DOCUMENT_CHECKLIST_ITEMS.find((entry) => entry.slug === slug) ||
    DEFAULT_DOCUMENT_CHECKLIST_ITEMS.find((entry) => entry.label === label) ||
    null
  )
}

export const DOCUMENTATION_ITEM_STATUS_LABELS = {
  PENDING: 'Pendente',
  UPLOADED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
}
