import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'candidate_documents'
    ORDER BY column_name
  `
  console.log('columns:', cols.map((c) => c.column_name).join(', '))

  const hasEvents = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'document_events'
  `
  console.log('document_events:', hasEvents.length ? 'YES' : 'NO')
} finally {
  await prisma.$disconnect()
}
