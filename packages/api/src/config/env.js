import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../../../..')

dotenv.config({ path: path.resolve(monorepoRoot, '.env'), override: true })

function resolveStoragePath(configuredPath) {
  if (!configuredPath) {
    return path.resolve(__dirname, '../../uploads')
  }
  if (path.isAbsolute(configuredPath)) {
    return configuredPath
  }
  return path.resolve(monorepoRoot, configuredPath)
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.API_PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fg-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  staffJwtExpiresIn: process.env.STAFF_JWT_EXPIRES_IN || '8h',
  staffRefreshExpiresIn: process.env.STAFF_REFRESH_EXPIRES_IN || '30d',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  databaseUrl: process.env.DATABASE_URL || '',
  sendgridApiKey: (process.env.SENDGRID_API_KEY || '').trim(),
  sendgridFromEmail: (process.env.SENDGRID_FROM_EMAIL || 'carreiras@fgservices.com.br').trim(),
  sendgridFromName: (process.env.SENDGRID_FROM_NAME || 'FG Services Carreiras').trim(),
  hrNotifyEmail: (process.env.HR_NOTIFY_EMAIL || '').trim(),
  storageProvider: (process.env.STORAGE_PROVIDER || 'LOCAL').toUpperCase(),
  storageLocalPath: resolveStoragePath(process.env.STORAGE_LOCAL_PATH),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET || 'fg-careers',
  docusignIntegrationKey: (process.env.DOCUSIGN_INTEGRATION_KEY || '').trim(),
  docusignUserId: (process.env.DOCUSIGN_USER_ID || '').trim(),
  docusignAccountId: (process.env.DOCUSIGN_ACCOUNT_ID || '').trim(),
  docusignPrivateKey: (process.env.DOCUSIGN_PRIVATE_KEY || '').trim(),
  docusignPrivateKeyPath: process.env.DOCUSIGN_PRIVATE_KEY_PATH
    ? path.resolve(monorepoRoot, process.env.DOCUSIGN_PRIVATE_KEY_PATH)
    : '',
  docusignBasePath: (process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi').trim(),
  docusignOAuthBasePath: (process.env.DOCUSIGN_OAUTH_BASE_PATH || 'account-d.docusign.com').trim(),
  docusignTemplateAutodeclaracao: (process.env.DOCUSIGN_TEMPLATE_ID_AUTODECLARACAO || '').trim(),
  docusignTemplateRole: (process.env.DOCUSIGN_TEMPLATE_ROLE || 'signer').trim(),
  docusignConnectHmacKey: (process.env.DOCUSIGN_CONNECT_HMAC_KEY || '').trim(),
}
