export function renderTemplate(text, variables = {}) {
  if (!text) return ''
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}

export function buildCandidateVariables({ candidateName, candidateEmail, jobTitle, companyName, interviewDate, meetingLink }) {
  return {
    nome: candidateName || '',
    email: candidateEmail || '',
    vaga: jobTitle || '',
    empresa: companyName || 'FG Services',
    data_entrevista: interviewDate || '',
    link: meetingLink || '',
  }
}
