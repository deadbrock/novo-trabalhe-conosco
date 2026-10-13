import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { env } from './config/env.js'
import { isDocuSignConfigured } from './modules/signatures/providers/docusign/DocuSignProvider.js'
import documentRoutes, { createAdminDocumentRoutes } from './modules/documents/DocumentRoutes.js'
import { prisma } from './lib/prisma.js'
import authRoutes from './routes/auth.routes.js'
import candidateRoutes from './routes/candidate.routes.js'
import talentPoolRoutes from './routes/talent-pool.routes.js'
import adminRoutes from './routes/admin.routes.js'
import jobsRoutes from './routes/jobs.routes.js'
import pipelineRoutes from './routes/pipeline.routes.js'
import talentPoolAdminRoutes from './routes/talent-pool.admin.routes.js'
import candidatesAdminRoutes from './routes/candidates.admin.routes.js'
import interviewsAdminRoutes from './routes/interviews.admin.routes.js'
import communicationAdminRoutes from './routes/communication.admin.routes.js'
import preAdmissionAdminRoutes from './routes/pre-admission.admin.routes.js'
import hrDepartmentAdminRoutes from './routes/hr-department.admin.routes.js'
import analyticsAdminRoutes from './routes/analytics.admin.routes.js'
import cmsAdminRoutes from './routes/cms.admin.routes.js'
import profileAdminRoutes from './routes/profile.admin.routes.js'
import settingsAdminRoutes from './routes/settings.admin.routes.js'
import publicRoutes from './routes/public.routes.js'
import webhooksRoutes from './routes/webhooks.routes.js'
import signaturesAdminRoutes from './routes/signatures.admin.routes.js'

const avatarsDir = path.join(env.storageLocalPath, 'avatars')
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true })
}

const app = express()

const allowedOrigins = [
  env.appUrl,
  env.adminUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use('/api/files/avatars', express.static(avatarsDir, { maxAge: '1h', etag: true }))

app.get('/api/health', async (_req, res) => {
  let dbStatus = 'ok'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'error'
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    db: dbStatus,
    sendgrid: Boolean(env.sendgridApiKey),
    sendgridFrom: env.sendgridFromEmail,
    storageProvider: env.storageProvider,
    docusign: isDocuSignConfigured(),
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/candidate', candidateRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/talent-pool', talentPoolRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', jobsRoutes)
app.use('/api/admin', pipelineRoutes)
app.use('/api/admin', talentPoolAdminRoutes)
app.use('/api/admin', candidatesAdminRoutes)
app.use('/api/admin', interviewsAdminRoutes)
app.use('/api/admin', communicationAdminRoutes)
app.use('/api/admin', preAdmissionAdminRoutes)
app.use('/api/admin', hrDepartmentAdminRoutes)
app.use('/api/admin', analyticsAdminRoutes)
app.use('/api/admin', cmsAdminRoutes)
app.use('/api/admin', profileAdminRoutes)
app.use('/api/admin', settingsAdminRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/webhooks', webhooksRoutes)
app.use('/api/admin', signaturesAdminRoutes)
app.use('/api/admin', createAdminDocumentRoutes())

app.listen(env.port, () => {
  console.log(`API FG Careers rodando em http://localhost:${env.port}`)
  if (env.sendgridApiKey) {
    console.log(`✓ SendGrid configurado — remetente: ${env.sendgridFromEmail}`)
  } else {
    console.warn('⚠ SENDGRID_API_KEY não configurada — e-mails serão simulados no console.')
  }
  if (isDocuSignConfigured()) {
    console.log('✓ DocuSign configurado — assinaturas eletrônicas habilitadas')
  } else {
    console.warn('⚠ DocuSign não configurado — defina DOCUSIGN_* no .env para habilitar assinaturas.')
  }
})
