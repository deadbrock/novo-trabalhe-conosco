import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
dotenv.config({ path: path.join(root, '.env'), override: true })

const prisma = new PrismaClient()

try {
  const doc = await prisma.candidateDocument.findFirst({
    select: { id: true, provider: true, providerEnvelopeId: true },
  })
  console.log('Query OK:', doc ?? '(nenhum registro)')
} finally {
  await prisma.$disconnect()
}
