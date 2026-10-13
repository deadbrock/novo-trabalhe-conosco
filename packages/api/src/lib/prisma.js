import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const REQUIRED_DELEGATES = [
  'pipelineStageConfig',
  'candidateNote',
  'interview',
  'messageTemplate',
  'communicationLog',
  'preAdmissionCase',
  'documentChecklistTemplate',
  'applicationDocumentation',
  'cmsSection',
]

/** Campos que indicam client desatualizado após db push sem regenerate/restart */
const REQUIRED_MODEL_FIELDS = {
  interview: ['sentToDocumentation'],
  application: ['rejectionReason'],
}

function delegateHasRequiredFields(client, delegate, fieldNames) {
  const fields = client[delegate]?.fields
  if (!fields) return false
  return fieldNames.every((field) => field in fields)
}

function isClientUpToDate(client) {
  if (!client) return false
  if (!REQUIRED_DELEGATES.every((delegate) => typeof client[delegate]?.findMany === 'function')) {
    return false
  }

  return Object.entries(REQUIRED_MODEL_FIELDS).every(([delegate, fieldNames]) =>
    delegateHasRequiredFields(client, delegate, fieldNames),
  )
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma
  if (isClientUpToDate(cached)) {
    return cached
  }

  if (cached?.$disconnect) {
    cached.$disconnect().catch(() => {})
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrismaClient()

/** Filtro padrão para soft delete */
export function notDeleted() {
  return { deletedAt: null }
}

/** Helper para soft delete */
export function softDeleteData() {
  return { deletedAt: new Date() }
}
