import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCpf } from '../utils/candidateProfile.js'
import { RACE_CATEGORY_OPTIONS, formatCurrentDatePtBr } from '../constants/candidateDocuments.js'

const BRAND_RED = rgb(0.784, 0.02, 0.059)
const BRAND_BLUE = rgb(0, 0.239, 0.478)
const TEXT = rgb(0.12, 0.12, 0.12)
const MUTED = rgb(0.45, 0.45, 0.45)
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

const LEGAL_TEXT =
  'Esta autodeclaração atende a exigência do art. 39, § 8º, da Lei nº 12.288/2010, alterado pela Lei nº 14.553/2023 e da Portaria MTE nº 3.784/2023, que obriga a prestação da informação nas inclusões, alterações ou retificações cadastrais dos trabalhadores ocorridas a partir de 1º de janeiro de 2024, respeitando o critério de autodeclaração do trabalhador, em conformidade com a classificação utilizada pelo Instituto Brasileiro de Geografia e Estatística - IBGE.'

const CLOSING_TEXT =
  'Por ser expressão da verdade, firmo e assino a presente para que a mesma produza seus efeitos legais e de direito.'

export function buildEthnicDeclarationPdfData({
  candidate,
  raceCategory = null,
  raceDescription = '',
  signedAt = new Date(),
}) {
  const date = signedAt instanceof Date ? signedAt : new Date(signedAt)

  return {
    candidateName: candidate?.name || '',
    candidateCpf: formatCpf(candidate?.cpf) || '',
    candidateCity: candidate?.city || '',
    raceCategory,
    raceDescription: String(raceDescription || '').trim(),
    currentDate: formatCurrentDatePtBr(date),
    day: String(date.getDate()).padStart(2, '0'),
    month: MONTH_NAMES_PT[date.getMonth()] || '',
    year: String(date.getFullYear()),
  }
}

function drawBicolorLine(page, y, width) {
  const half = width / 2
  page.drawLine({ start: { x: 48, y }, end: { x: 48 + half, y }, thickness: 1.2, color: BRAND_BLUE })
  page.drawLine({ start: { x: 48 + half, y }, end: { x: 48 + width, y }, thickness: 1.2, color: BRAND_RED })
}

function drawFooterBand(page, width) {
  page.drawRectangle({ x: 0, y: 0, width: width / 2, height: 10, color: BRAND_RED })
  page.drawRectangle({ x: width / 2, y: 0, width: width / 2, height: 10, color: BRAND_BLUE })
}

function drawHeader(page, width, height) {
  drawBicolorLine(page, height - 48, width - 96)
}

function drawFooter(page, fonts, width) {
  const y = 52
  drawBicolorLine(page, y + 28, width - 96)

  const col1 = 48
  const col2 = width / 2 - 52
  const col3 = width - 200

  page.drawText('81 4042-7878', { x: col1, y: y + 14, size: 7.5, font: fonts.regular, color: TEXT })
  page.drawText('81 99123-6035', { x: col1, y: y + 4, size: 7.5, font: fonts.regular, color: TEXT })

  page.drawText('www.fgservices.com.br', { x: col2, y: y + 8, size: 7.5, font: fonts.regular, color: TEXT })

  page.drawText('Rua Minas Gerais, 137, Ana Albuquerque,', {
    x: col3,
    y: y + 14,
    size: 6.8,
    font: fonts.regular,
    color: TEXT,
  })
  page.drawText('Igarassu - PE', { x: col3, y: y + 5, size: 6.8, font: fonts.regular, color: TEXT })

  drawFooterBand(page, width)
}
function wrapText(text, font, size, maxWidth) {
  const words = String(text || '').split(/\s+/)
  const lines = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)
  return lines
}

function drawParagraph(page, font, text, x, y, maxWidth, size, lineHeight = size + 4) {
  const lines = wrapText(text, font, size, maxWidth)
  let cursorY = y

  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color: TEXT })
    cursorY -= lineHeight
  }

  return cursorY
}

function drawCheckbox(page, fonts, label, x, y, checked) {
  page.drawRectangle({
    x,
    y: y - 10,
    width: 10,
    height: 10,
    borderColor: TEXT,
    borderWidth: 0.8,
  })

  if (checked) {
    page.drawText('X', { x: x + 1.5, y: y - 9.5, size: 9, font: fonts.bold, color: TEXT })
  }

  page.drawText(label, { x: x + 16, y: y - 9, size: 11, font: fonts.regular, color: TEXT })
}

function drawDeclarationIntro(page, fonts, data, template, width, startY) {
  const margin = 48
  const maxWidth = width - margin * 2
  const name = template ? '______________________________' : data.candidateName || '—'
  const cpf = template ? '___________________' : data.candidateCpf || '—'

  const intro =
    `Eu, ${name}, inscrito no CPF sob o nº ${cpf}, AUTODECLARO, sob as penas da lei, minha raça/etnia sendo:`

  return drawParagraph(page, fonts.regular, intro, margin, startY, maxWidth, 11, 15)
}

export async function generateEthnicDeclarationPdf(data = {}, { template = false } = {}) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fonts = { regular, bold }

  const { width, height } = page.getSize()

  drawHeader(page, width, height)

  page.drawText('AUTODECLARAÇÃO ÉTNICO-RACIAL', {
    x: width / 2 - 118,
    y: height - 72,
    size: 13,
    font: bold,
    color: TEXT,
  })

  let y = height - 108
  y = drawDeclarationIntro(page, fonts, data, template, width, y)

  y -= 8
  for (const option of RACE_CATEGORY_OPTIONS) {
    const checked = !template && data.raceCategory === option.value
    drawCheckbox(page, fonts, option.label, 48, y, checked)
    y -= 20
  }

  if (!template && data.raceDescription) {
    y -= 4
    y = drawParagraph(
      page,
      fonts.regular,
      `Complemento: ${data.raceDescription}`,
      48,
      y,
      width - 96,
      10,
      13,
    )
  }

  y -= 10
  y = drawParagraph(page, fonts.regular, LEGAL_TEXT, 48, y, width - 96, 9.5, 12)
  y -= 8
  y = drawParagraph(page, fonts.regular, CLOSING_TEXT, 48, y, width - 96, 10, 13)

  y -= 18
  const city = template ? '________________________' : data.candidateCity || '—'
  const day = template ? '_____' : data.day || '—'
  const month = template ? '__________________' : data.month || '—'
  const yearSuffix = template ? '_____' : data.year?.slice(-2) || '—'
  const dateLine = `${city}, ${day} de ${month} de 20${yearSuffix}.`

  page.drawText(dateLine, {
    x: width / 2 - regular.widthOfTextAtSize(dateLine, 11) / 2,
    y,
    size: 11,
    font: regular,
    color: TEXT,
  })

  y -= 48
  const signLineWidth = 220
  const signX = width / 2 - signLineWidth / 2

  page.drawLine({
    start: { x: signX, y },
    end: { x: signX + signLineWidth, y },
    thickness: 0.8,
    color: TEXT,
  })

  page.drawText('Assinatura', {
    x: width / 2 - regular.widthOfTextAtSize('Assinatura', 10) / 2,
    y: y - 14,
    size: 10,
    font: regular,
    color: MUTED,
  })

  if (!template) {
    page.drawText('/sign_here/', {
      x: signX + 70,
      y: y + 2,
      size: 8,
      font: regular,
      color: rgb(1, 1, 1),
    })
  }

  drawFooter(page, fonts, width)

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function generateEthnicDeclarationPdfForSigning({ candidate, raceCategory, raceDescription }) {
  const data = buildEthnicDeclarationPdfData({ candidate, raceCategory, raceDescription })
  return generateEthnicDeclarationPdf(data, { template: false })
}

export async function generateEthnicDeclarationTemplateBuffer() {
  return generateEthnicDeclarationPdf({}, { template: true })
}
