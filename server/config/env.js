import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const env = {
  port: Number(process.env.API_PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fg-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  sendgridApiKey: (process.env.SENDGRID_API_KEY || '').trim(),
  sendgridFromEmail: (process.env.SENDGRID_FROM_EMAIL || 'carreiras@fgservices.com.br').trim(),
  sendgridFromName: (process.env.SENDGRID_FROM_NAME || 'FG Services Carreiras').trim(),
}
