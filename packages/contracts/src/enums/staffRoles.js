export const StaffRole = {
  ADMIN: 'admin',
  RECRUITMENT_MANAGER: 'recruitment_manager',
  RECRUITMENT_ANALYST: 'recruitment_analyst',
  HR_DEPARTMENT: 'hr_department',
  /** @deprecated use RECRUITMENT_MANAGER */
  RH: 'recruitment_manager',
  /** @deprecated perfis legados — não atribuir a novos usuários */
  SUPERVISOR: 'supervisor',
  COORDINATOR: 'coordinator',
  DIRECTOR: 'director',
}

/** Papéis disponíveis para atribuição ao criar/editar usuários */
export const ASSIGNABLE_STAFF_ROLES = [
  StaffRole.ADMIN,
  StaffRole.RECRUITMENT_MANAGER,
  StaffRole.RECRUITMENT_ANALYST,
  StaffRole.HR_DEPARTMENT,
]

export const ROLE_DISPLAY_NAMES = {
  [StaffRole.ADMIN]: 'Administrador',
  [StaffRole.RECRUITMENT_MANAGER]: 'Gestor de Recrutamento',
  [StaffRole.RECRUITMENT_ANALYST]: 'Analista de Recrutamento',
  [StaffRole.HR_DEPARTMENT]: 'Departamento Pessoal',
}
