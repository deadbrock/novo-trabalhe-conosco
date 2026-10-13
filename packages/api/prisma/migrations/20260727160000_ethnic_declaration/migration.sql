-- CreateEnum
CREATE TYPE "RaceCategory" AS ENUM ('BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA');
CREATE TYPE "CandidateDocumentStatus" AS ENUM ('PENDING', 'SIGNED', 'REJECTED');
CREATE TYPE "CandidateDocumentType" AS ENUM ('ETHNIC_DECLARATION');

-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN "race_category" "RaceCategory";
ALTER TABLE "candidate_profiles" ADD COLUMN "race_description" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "candidate_documents" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "application_id" TEXT,
    "document_type" "CandidateDocumentType" NOT NULL,
    "status" "CandidateDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "document_path" TEXT NOT NULL DEFAULT '',
    "signature_provider" TEXT NOT NULL DEFAULT '',
    "signature_id" TEXT NOT NULL DEFAULT '',
    "signed_at" TIMESTAMP(3),
    "race_category" "RaceCategory",
    "race_description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidate_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "candidate_documents_candidate_id_document_type_idx" ON "candidate_documents"("candidate_id", "document_type");
CREATE INDEX "candidate_documents_status_idx" ON "candidate_documents"("status");

ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "candidate_documents" ADD CONSTRAINT "candidate_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
