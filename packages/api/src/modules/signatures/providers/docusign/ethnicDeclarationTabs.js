import { formatCpf } from '../../../../utils/candidateProfile.js'
import { RACE_CATEGORY_LABELS } from '../../../../constants/candidateDocuments.js'

/** Ordem dos campos de texto no template DocuSign (de cima para baixo no documento). */
export const ETHNIC_DECLARATION_TEXT_FIELD_ORDER = [
  'candidate_name',
  'candidate_cpf',
  'candidate_city',
  'dia',
  'mes',
  'ano',
]

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function buildEthnicDeclarationFieldValues({ candidate, signedAt = new Date() }) {
  const date = signedAt instanceof Date ? signedAt : new Date(signedAt)

  return {
    candidate_name: candidate?.name || '',
    candidate_cpf: formatCpf(candidate?.cpf) || '',
    candidate_city: candidate?.city || '',
    dia: String(date.getDate()).padStart(2, '0'),
    mes: MONTH_NAMES_PT[date.getMonth()] || '',
    ano: String(date.getFullYear()).slice(-2),
  }
}

function sortTemplateTextTabs(tabs) {
  const top = []
  const bottom = []

  for (const tab of tabs) {
    if (Number(tab.yPosition || 0) < 400) {
      top.push(tab)
    } else {
      bottom.push(tab)
    }
  }

  const byX = (left, right) => Number(left.xPosition || 0) - Number(right.xPosition || 0)

  top.sort(byX)
  bottom.sort(byX)

  return [...top, ...bottom]
}

function templateHasCustomTextLabels(templateTextTabs) {
  const knownLabels = new Set(ETHNIC_DECLARATION_TEXT_FIELD_ORDER)
  return templateTextTabs.some((tab) => knownLabels.has(String(tab.tabLabel || '').trim()))
}

function buildTextTabs(fieldValues, templateTextTabs = []) {
  const orderedTabs = sortTemplateTextTabs(templateTextTabs)

  if (templateHasCustomTextLabels(templateTextTabs)) {
    return ETHNIC_DECLARATION_TEXT_FIELD_ORDER.map((tabLabel) => ({
      tabLabel,
      value: String(fieldValues[tabLabel] ?? ''),
    }))
  }

  return ETHNIC_DECLARATION_TEXT_FIELD_ORDER.slice(0, orderedTabs.length).map((fieldKey, index) => ({
    tabLabel: orderedTabs[index].tabLabel,
    value: String(fieldValues[fieldKey] ?? ''),
  }))
}

export function buildEthnicDeclarationEnvelopeTabUpdates(fieldValues, envelopeTextTabs = []) {
  const orderedTabs = sortTemplateTextTabs(envelopeTextTabs)

  return {
    textTabs: ETHNIC_DECLARATION_TEXT_FIELD_ORDER.slice(0, orderedTabs.length).map((fieldKey, index) => ({
      tabId: orderedTabs[index].tabId,
      value: String(fieldValues[fieldKey] ?? ''),
    })),
  }
}

function buildCheckboxTabs(raceCategory, templateCheckboxTabs = []) {
  if (!raceCategory) return []

  const label = RACE_CATEGORY_LABELS[raceCategory]
  const alternateLabel = `race_${String(raceCategory).toLowerCase()}`
  if (!label) return []

  const matchedTab = templateCheckboxTabs.find((tab) => {
    const tabLabel = String(tab.tabLabel || '').trim()
    const tabName = String(tab.name || '').trim()
    return [label, alternateLabel, raceCategory, raceCategory.toLowerCase()].includes(tabLabel)
      || [label, alternateLabel].includes(tabName)
  })

  if (matchedTab?.tabId) {
    return [{ tabId: matchedTab.tabId, selected: 'true' }]
  }

  if (matchedTab?.tabLabel) {
    return [{ tabLabel: matchedTab.tabLabel, selected: 'true' }]
  }

  return [{ tabLabel: label, selected: 'true' }]
}

export function buildEthnicDeclarationDocuSignTabs({
  candidate,
  raceCategory = null,
  signedAt = new Date(),
  templateTextTabs = [],
  templateCheckboxTabs = [],
}) {
  const fieldValues = buildEthnicDeclarationFieldValues({ candidate, signedAt })
  const textTabs = buildTextTabs(fieldValues, templateTextTabs)
  const checkboxTabs = buildCheckboxTabs(raceCategory, templateCheckboxTabs)

  const tabs = { textTabs }
  if (checkboxTabs.length) tabs.checkboxTabs = checkboxTabs
  return tabs
}
