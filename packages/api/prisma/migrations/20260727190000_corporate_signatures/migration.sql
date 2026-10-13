-- Expand candidate document status enum
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'SENT';
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'VIEWED';
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'VOIDED';
ALTER TYPE "CandidateDocumentStatus" ADD VALUE IF NOT EXISTS 'ERROR';

-- Expand document types
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'LGPD';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'WORK_CONTRACT';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'TRANSPORT_VOUCHER';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'CODE_OF_CONDUCT';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'CONFIDENTIALITY';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'REGISTRATION_FORM';
ALTER TYPE "CandidateDocumentType" ADD VALUE IF NOT EXISTS 'TERMS_OF_USE';

-- Rename / add columns on candidate_documents
ALTER TABLE "candidate_documents" RENAME COLUMN "document_path" TO "signed_pdf_path";
ALTER TABLE "candidate_documents" RENAME COLUMN "signature_provider" TO "provider";
ALTER TABLE "candidate_documents" RENAME COLUMN "signature_id" TO "provider_envelope_id";

ALTER TABLE "candidate_documents" ADD COLUMN IF NOT EXISTS "provider_document_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "candidate_documents" ADD COLUMN IF NOT EXISTS "certificate_pdf_path" TEXT NOT NULL DEFAULT '';

UPDATE "candidate_documents" SET "provider" = 'internal' WHERE "provider" = 'INTERNAL';
UPDATE "candidate_documents" SET "provider" = 'docusign' WHERE "provider" = '' AND "provider_envelope_id" <> '';
UPDATE "candidate_documents" SET "status" = 'DECLINED' WHERE "status" = 'REJECTED';

CREATE INDEX IF NOT EXISTS "candidate_documents_provider_envelope_id_idx" ON "candidate_documents"("provider_envelope_id");

-- Document events timeline
CREATE TABLE IF NOT EXISTS "document_events" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_events_document_id_created_at_idx" ON "document_events"("document_id", "created_at");

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
END $$;
