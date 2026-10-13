export const ROUTES = {
  HOME: '/',
  HISTORY: '/nossa-historia',
  CULTURE: '/nossa-cultura',
  BENEFITS: '/beneficios',
  AREAS: '/areas-de-atuacao',
  PROCESS: '/processo-seletivo',
  TALENT_POOL: '/banco-de-talentos',
  JOBS: '/vagas',
  JOB_DETAIL: '/vagas/:slug',
  CANDIDATE_PORTAL: '/portal-do-candidato',
  CANDIDATE_PROFILE: '/portal-do-candidato/perfil',
  CANDIDATE_APPLICATIONS: '/portal-do-candidato/candidaturas',
  CANDIDATE_PRE_ADMISSION: '/portal-do-candidato/documentacao',
  CANDIDATE_ETHNIC_DECLARATION: '/portal-do-candidato/autodeclaracao-etnica',
  CANDIDATE_SIGNATURES: '/portal-do-candidato/assinaturas',
  CANDIDATE_SIGNING_RETURN: '/portal-do-candidato/assinatura/retorno',
  LOGIN: '/login',
  REGISTER: '/cadastro',
  REGISTER_SUCCESS: '/cadastro/sucesso',
  VERIFY_EMAIL: '/verificar-email',
}

export function jobDetailPath(slug) {
  return `/vagas/${slug}`
}
