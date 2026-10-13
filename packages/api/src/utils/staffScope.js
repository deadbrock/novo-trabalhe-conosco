const HQ_ROLES = new Set(['admin', 'recruitment_manager'])

export function isHeadquartersStaff(user) {
  if (!user) return false
  if (HQ_ROLES.has(user.role)) return true
  return Boolean(user.unit?.isHeadquarters)
}

export function isDpStaff(user) {
  return user?.role === 'hr_department' || user?.role === 'admin'
}

export function staffUnitId(user) {
  return user?.unit?.id || user?.unitId || null
}

export function staffStateCodes(user) {
  const fromUnit = user?.unit?.stateCodes || []
  const fromScope = user?.scope?.states || []
  return [...new Set([...fromUnit, ...fromScope].map((code) => String(code).toUpperCase()))]
}

/** Filtro de vagas: unidade do staff, senão estados do escopo. Sede/admin vê tudo. */
export function jobScopeWhere(user) {
  if (!user || isHeadquartersStaff(user) || isDpStaff(user)) return {}

  const unitId = staffUnitId(user)
  if (unitId) return { unitId }

  const states = staffStateCodes(user)
  if (states.length) return { stateCode: { in: states } }

  return {}
}

/**
 * Filtro de candidaturas:
 * - Sede/admin: tudo
 * - DP: dono DP
 * - Unidade local: a própria unidade, inclusive devoluções
 */
export function applicationScopeWhere(user) {
  if (!user || isHeadquartersStaff(user)) return {}

  if (user.role === 'hr_department') {
    return { currentOwner: 'DP' }
  }

  const unitId = staffUnitId(user)
  if (unitId) return { unitId }

  const states = staffStateCodes(user)
  if (states.length) return { job: { stateCode: { in: states } } }

  return {}
}

export function canManageHeadquartersQueues(user) {
  return isHeadquartersStaff(user)
}
