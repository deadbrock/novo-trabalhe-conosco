export const DEFAULT_PIPELINE_STAGES = [
  { slug: 'new', label: 'Novos', color: 'blue', sortOrder: 0, isTerminal: false },
  { slug: 'hr_review', label: 'Triagem RH', color: 'violet', sortOrder: 1, isTerminal: false },
  { slug: 'contact', label: 'Contato', color: 'cyan', sortOrder: 2, isTerminal: false },
  { slug: 'interview', label: 'Entrevista', color: 'amber', sortOrder: 3, isTerminal: false },
  { slug: 'documentation', label: 'Documentação', color: 'orange', sortOrder: 4, isTerminal: false },
  { slug: 'client_review', label: 'Avaliação Cliente', color: 'indigo', sortOrder: 5, isTerminal: false },
  { slug: 'approved', label: 'Aprovado', color: 'emerald', sortOrder: 6, isTerminal: false },
  { slug: 'hired', label: 'Contratado', color: 'green', sortOrder: 7, isTerminal: true },
]

export const STAGE_STATUS_MAP = {
  new: 'PENDING',
  hr_review: 'REVIEW',
  contact: 'REVIEW',
  interview: 'INTERVIEW',
  documentation: 'INTERVIEW',
  client_review: 'OFFER',
  approved: 'OFFER',
  hired: 'OFFER',
}
