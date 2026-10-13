import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
import { isDocuSignConfigured } from '../src/services/docusign.client.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const envPath = path.join(root, '.env')
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const userLine = envFile.split('\n').find((l) => l.startsWith('DOCUSIGN_USER_ID=')) || '(missing)'
const accountLine = envFile.split('\n').find((l) => l.startsWith('DOCUSIGN_ACCOUNT_ID=')) || '(missing)'

function mask(value) {
  if (!value) return '(vazio)'
  if (value.length <= 8) return `${value.slice(0, 2)}***`
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

console.log('--- DocuSign — diagnóstico ---')
console.log('.env path:', envPath)
console.log('.env userId line:', userLine.replace(/=.+/, '=***'))
console.log('.env accountId line:', accountLine.replace(/=.+/, '=***'))
console.log('process userId:', mask(env.docusignUserId))
console.log('process accountId:', mask(env.docusignAccountId))
console.log('basePath:', env.docusignBasePath)
console.log('oauthBasePath:', env.docusignOAuthBasePath)
console.log('templateAutodeclaracao:', mask(env.docusignTemplateAutodeclaracao))
console.log('templateRole:', env.docusignTemplateRole)
console.log('privateKey:', env.docusignPrivateKey ? `ok (${env.docusignPrivateKey.length} chars)` : 'ausente')
console.log('configured:', isDocuSignConfigured())

if (!isDocuSignConfigured()) {
  console.error('\nFALHA: variáveis obrigatórias incompletas.')
  process.exit(1)
}

try {
  const docusign = await import('docusign-esign')
  const apiClient = new docusign.default.ApiClient()
  apiClient.setOAuthBasePath(env.docusignOAuthBasePath)
  const privateKey = env.docusignPrivateKey.replace(/\\n/g, '\n')
  const response = await apiClient.requestJWTUserToken(
    env.docusignIntegrationKey,
    env.docusignUserId,
    ['signature', 'impersonation'],
    Buffer.from(privateKey),
    3600,
  )
  console.log('\nOK: JWT obtido com sucesso')
  console.log('tokenExpiresIn:', response.body.expires_in, 's')
} catch (error) {
  console.error('\nFALHA ao obter JWT:')
  const body = error.response?.body || error.response?.data
  if (body?.error) {
    console.error('error:', body.error)
    if (body.error_description) console.error('description:', body.error_description)
  } else {
    console.error(error.message || error)
  }
  process.exit(1)
}
