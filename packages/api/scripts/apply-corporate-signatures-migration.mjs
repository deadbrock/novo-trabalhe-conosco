import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
dotenv.config({ path: path.join(root, '.env'), override: true })

const prisma = new PrismaClient()

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
  `
  return rows.length > 0
}

async function run() {
  console.log('Aplicando migration corporate_signatures...')

  const enumStatements = [
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'SENT'`,
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'DELIVERED'`,
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'VIEWED'`,
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'DECLINED'`,
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'VOIDED'`,
    `ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'ERROR'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'LGPD'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'WORK_CONTRACT'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'TRANSPORT_VOUCHER'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'CODE_OF_CONDUCT'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'CONFIDENTIALITY'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'REGISTRATION_FORM'`,
    `ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'TERMS_OF_USE'`,
  ]

  for (const sql of enumStatements) {
    await prisma.$executeRawUnsafe(sql)
  }

  if (await columnExists('candidate_documents', 'document_path')) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "candidate_documents" RENAME COLUMN "document_path" TO "signed_pdf_path"`,
    )
    console.log('Renomeado document_path -> signed_pdf_path')
  }

  if (await columnExists('candidate_documents', 'signature_provider')) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "candidate_documents" RENAME COLUMN "signature_provider" TO "provider"`,
    )
    console.log('Renomeado signature_provider -> provider')
  }

  if (await columnExists('candidate_documents', 'signature_id')) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "candidate_documents" RENAME COLUMN "signature_id" TO "provider_envelope_id"`,
    )
    console.log('Renomeado signature_id -> provider_envelope_id')
  }

  if (!(await columnExists('candidate_documents', 'provider_document_id'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "candidate_documents" ADD COLUMN "provider_document_id" TEXT NOT NULL DEFAULT ''`,
    )
  }

  if (!(await columnExists('candidate_documents', 'certificate_pdf_path'))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "candidate_documents" ADD COLUMN "certificate_pdf_path" TEXT NOT NULL DEFAULT ''`,
    )
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "candidate_documents" SET "provider" = 'internal' WHERE "provider" = 'INTERNAL'`,
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "candidate_documents" SET "provider" = 'docusign' WHERE "provider" = '' AND "provider_envelope_id" <> ''`,
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "candidate_documents" SET "status" = 'DECLINED' WHERE "status"::text = 'REJECTED'`,
  )

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "candidate_documents_provider_envelope_id_idx" ON "candidate_documents"("provider_envelope_id")`,
  )

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "document_events" (
      "id" TEXT NOT NULL,
      "document_id" TEXT NOT NULL,
      "event" TEXT NOT NULL,
      "payload" JSONB NOT NULL DEFAULT '{}',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "document_events_pkey" PRIMARY KEY ("id")
    )
  `)

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "document_events_document_id_created_at_idx" ON "document_events"("document_id", "created_at")`,
  )

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'document_events_document_id_fkey'
      ) THEN
        ALTER TABLE "document_events"
          ADD CONSTRAINT "document_events_document_id_fkey"
          FOREIGN KEY ("document_id") REFERENCES "candidate_documents"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'candidate_documents'
    ORDER BY column_name
  `
  console.log('Colunas finais:', cols.map((c) => c.column_name).join(', '))
  console.log('Migration aplicada com sucesso.')
}

run()
  .catch((error) => {
    console.error('Falha:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
