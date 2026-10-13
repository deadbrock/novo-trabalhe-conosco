export const jobs = [
  {
    id: '1',
    slug: 'exemplo',
    title: 'Exemplo',
    area: 'Exemplo',
    location: 'Exemplo',
    type: 'Exemplo',
    contract: 'Exemplo',
    level: 'Exemplo',
    postedAt: '2026-07-01',
    featured: true,
    description: 'Exemplo de descrição de um job.',
  },
  {
    id: '2',
    slug: 'exemplo',
    title: 'Exemplo',
    area: 'Exemplo',
    location: 'Exemplo',
    type: 'Híbrido',
    contract: 'CLT',
    level: 'Pleno',
    postedAt: '2026-07-05',
    featured: true,
    description: 'Exemplo de descrição de um job.',
  },
  {
    id: '3',
    slug: 'executivo-comercial',
    title: 'Executivo Comercial',
    area: 'Comercial',
    location: 'Exemplo',
    type: 'Presencial',
    contract: 'CLT',
    level: 'Sênior',
    postedAt: '2026-07-10',
    featured: true,
    description: 'Conduzir prospecção, negociação e relacionamento com contas estratégicas.',
  },
  {
    id: '4',
    slug: 'analista-de-rh',
    title: 'Analista de RH — Atração',
    area: 'Gente & Gestão',
    location: 'São Paulo, SP',
    type: 'Híbrido',
    contract: 'CLT',
    level: 'Pleno',
    postedAt: '2026-07-12',
    featured: false,
    description: 'Gerenciar processos seletivos end-to-end e fortalecer employer branding.',
  },
  {
    id: '5',
    slug: 'exemplo',
    title: 'Exemplo',
    area: 'Exemplo',
    location: 'Exemplo',
    type: 'Exemplo',
    contract: 'CLT',
    level: 'Sênior',
    postedAt: '2026-07-14',
    featured: false,
    description: 'Liderar controladoria, reporting gerencial e análises de performance.',
  },
]

export function getJobBySlug(slug) {
  return jobs.find((job) => job.slug === slug)
}

export function getFeaturedJobs(limit = 3) {
  return jobs.filter((job) => job.featured).slice(0, limit)
}
