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

export const EMPTY_EXPERIENCE = {
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

export const EMPTY_COURSE = {
  name: '',
  institution: '',
  completionYear: '',
  workloadHours: '',
}
