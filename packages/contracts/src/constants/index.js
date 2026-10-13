export const STORAGE_PROVIDERS = {
  LOCAL: 'LOCAL',
  SUPABASE: 'SUPABASE',
  RAILWAY: 'RAILWAY',
}

export const API_ROUTES = {
  HEALTH: '/api/health',
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    STAFF_LOGIN: '/api/admin/auth/login',
    STAFF_REFRESH: '/api/admin/auth/refresh',
    STAFF_LOGOUT: '/api/admin/auth/logout',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
  },
  CANDIDATE: {
    ME: '/api/candidate/me',
    PROFILE: '/api/candidate/profile',
    RESUME: '/api/candidate/resume',
    APPLICATIONS: '/api/candidate/applications',
    DASHBOARD: '/api/candidate/dashboard',
  },
  ADMIN: {
    ME: '/api/admin/me',
    DASHBOARD: '/api/admin/dashboard',
    PIPELINE: '/api/admin/pipeline',
  },
  TALENT_POOL: '/api/talent-pool',
  PUBLIC: {
    CMS: '/api/public/cms',
    JOBS: '/api/public/jobs',
  },
}

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
