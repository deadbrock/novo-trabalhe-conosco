import { ROUTES } from './routes'

export const mainNavigation = [
  { label: 'Nossa História', href: ROUTES.HISTORY },
  { label: 'Nossa Cultura', href: ROUTES.CULTURE },
  { label: 'Benefícios', href: ROUTES.BENEFITS },
  { label: 'Áreas', href: ROUTES.AREAS },
  { label: 'Processo Seletivo', href: ROUTES.PROCESS },
  { label: 'Vagas', href: ROUTES.JOBS },
]

export const footerNavigation = {
  empresa: [
    { label: 'Nossa História', href: ROUTES.HISTORY },
    { label: 'Nossa Cultura', href: ROUTES.CULTURE },
    { label: 'Benefícios', href: ROUTES.BENEFITS },
    { label: 'Áreas de Atuação', href: ROUTES.AREAS },
  ],
  carreiras: [
    { label: 'Vagas Abertas', href: ROUTES.JOBS },
    { label: 'Processo Seletivo', href: ROUTES.PROCESS },
    { label: 'Banco de Talentos', href: ROUTES.TALENT_POOL },
    { label: 'Portal do Candidato', href: ROUTES.CANDIDATE_PORTAL },
  ],
}
