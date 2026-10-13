export const EDUCATION_LEVELS = [
  { value: 'fundamental_incompleto', label: 'Ensino Fundamental incompleto' },
  { value: 'fundamental_completo', label: 'Ensino Fundamental completo' },
  { value: 'medio_incompleto', label: 'Ensino Médio incompleto' },
  { value: 'medio_completo', label: 'Ensino Médio completo' },
  { value: 'tecnico', label: 'Ensino Técnico' },
  { value: 'superior_incompleto', label: 'Ensino Superior incompleto' },
  { value: 'superior_completo', label: 'Ensino Superior completo' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
  { value: 'mestrado', label: 'Mestrado' },
  { value: 'doutorado', label: 'Doutorado' },
]

const EDUCATION_LABELS = Object.fromEntries(EDUCATION_LEVELS.map((item) => [item.value, item.label]))

export function stripCpf(value) {
  return String(value || '').replace(/\D/g, '')
}

export function formatCpf(value) {
  const digits = stripCpf(value)
  if (digits.length !== 11) return value || ''
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCpf(value) {
  const digits = stripCpf(value)
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  if (check !== Number(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  return check === Number(digits[10])
}

export function educationLevelLabel(value) {
  return EDUCATION_LABELS[value] || value || ''
}

export function normalizeExperiences(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((item) => ({
      company: String(item?.company || '').trim(),
      role: String(item?.role || '').trim(),
      startDate: String(item?.startDate || '').trim(),
      endDate: item?.current ? '' : String(item?.endDate || '').trim(),
      current: Boolean(item?.current),
      description: String(item?.description || '').trim(),
    }))
    .filter((item) => item.company || item.role)
}

export function normalizeCourses(list) {
  if (!Array.isArray(list)) return []

  return list
    .map((item) => ({
      name: String(item?.name || '').trim(),
      institution: String(item?.institution || '').trim(),
      completionYear: String(item?.completionYear || '').trim(),
      workloadHours: String(item?.workloadHours || '').trim(),
    }))
    .filter((item) => item.name || item.institution)
}

export function parseBirthDate(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function mapStoredProfile(profile) {
  if (!profile) {
    return {
      cpf: '',
      birthDate: null,
      linkedin: '',
      street: '',
      addressNumber: '',
      complement: '',
      neighborhood: '',
      zipCode: '',
      city: '',
      state: '',
      educationLevel: '',
      summary: '',
      raceCategory: null,
      raceDescription: '',
      experiences: [],
      courses: [],
    }
  }

  return {
    cpf: formatCpf(profile.cpf),
    birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : null,
    linkedin: profile.linkedin || '',
    street: profile.street || '',
    addressNumber: profile.addressNumber || '',
    complement: profile.complement || '',
    neighborhood: profile.neighborhood || '',
    zipCode: profile.zipCode || '',
    city: profile.city || '',
    state: profile.state || '',
    educationLevel: profile.educationLevel || '',
    summary: profile.summary || '',
    raceCategory: profile.raceCategory || null,
    raceDescription: profile.raceDescription || '',
    experiences: normalizeExperiences(profile.experiences),
    courses: normalizeCourses(profile.courses),
  }
}

export function formatFullAddress(profile) {
  const parts = []

  if (profile?.street) {
    let line = profile.street
    if (profile.addressNumber) line += `, ${profile.addressNumber}`
    if (profile.complement) line += ` — ${profile.complement}`
    parts.push(line)
  }

  if (profile?.neighborhood) parts.push(profile.neighborhood)

  const cityState = [profile?.city, profile?.state].filter(Boolean).join(', ')
  if (cityState) parts.push(cityState)

  if (profile?.zipCode) parts.push(`CEP ${profile.zipCode}`)

  return parts.join(' · ')
}

export function buildProfileUpdateData(profileUpdates = {}, existing = {}) {
  const profile = profileUpdates.profile || {}
  const data = {}

  if (profileUpdates.name !== undefined) {
    data.name = String(profileUpdates.name).trim() || existing.name
  }

  if (profileUpdates.phone !== undefined) {
    data.phone = String(profileUpdates.phone).trim()
  }

  if (profile.linkedin !== undefined) data.linkedin = String(profile.linkedin).trim()
  if (profile.city !== undefined) data.city = String(profile.city).trim()
  if (profile.state !== undefined) data.state = String(profile.state).trim()
  if (profile.summary !== undefined) data.summary = String(profile.summary).trim()
  if (profile.street !== undefined) data.street = String(profile.street).trim()
  if (profile.addressNumber !== undefined) data.addressNumber = String(profile.addressNumber).trim()
  if (profile.complement !== undefined) data.complement = String(profile.complement).trim()
  if (profile.neighborhood !== undefined) data.neighborhood = String(profile.neighborhood).trim()
  if (profile.zipCode !== undefined) data.zipCode = String(profile.zipCode).replace(/\D/g, '')
  if (profile.educationLevel !== undefined) data.educationLevel = String(profile.educationLevel).trim()

  if (profile.cpf !== undefined) {
    const cpfDigits = stripCpf(profile.cpf)
    if (cpfDigits && !isValidCpf(cpfDigits)) {
      throw new Error('INVALID_CPF')
    }
    data.cpf = cpfDigits
  }

  if (profile.birthDate !== undefined) {
    data.birthDate = profile.birthDate ? parseBirthDate(profile.birthDate) : null
    if (profile.birthDate && !data.birthDate) {
      throw new Error('INVALID_BIRTH_DATE')
    }
  }

  if (profile.experiences !== undefined) {
    data.experiences = normalizeExperiences(profile.experiences)
  }

  if (profile.courses !== undefined) {
    data.courses = normalizeCourses(profile.courses)
  }

  return data
}

export function profileCompleteness(user, profileFields) {
  const profile = profileFields || {}
  const fields = [
    user?.phone,
    profile.cpf,
    profile.birthDate,
    profile.street,
    profile.city,
    profile.state,
    profile.educationLevel,
    profile.summary,
    profile.linkedin,
    profile.resumeFileName,
    profile.experiences?.length > 0,
    profile.courses?.length > 0,
  ]

  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}
