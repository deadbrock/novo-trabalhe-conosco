import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.resolve(__dirname, '../../../logs/docusign')

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
}

function logFilePath() {
  ensureLogsDir()
  const date = new Date().toISOString().slice(0, 10)
  return path.join(logsDir, `${date}.jsonl`)
}

export function logDocuSign(type, data = {}) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      ...data,
    }
    fs.appendFileSync(logFilePath(), `${JSON.stringify(entry)}\n`, 'utf8')
  } catch (error) {
    console.error('[DocuSignLogger]', error.message)
  }
}

export function logDocuSignRequest(action, meta = {}) {
  logDocuSign('request', { action, ...meta })
}

export function logDocuSignResponse(action, meta = {}) {
  logDocuSign('response', { action, ...meta })
}

export function logDocuSignError(action, error, meta = {}) {
  logDocuSign('error', {
    action,
    message: error?.message || String(error),
    code: error?.code || null,
    ...meta,
  })
}

export function logDocuSignWebhook(event, meta = {}) {
  logDocuSign('webhook', { event, ...meta })
}
