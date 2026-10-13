-- CreateEnum
CREATE TYPE "DocumentSignatureStatus" AS ENUM ('CREATED', 'SENT', 'DELIVERED', 'SIGNED', 'COMPLETED', 'DECLINED', 'VOIDED', 'ERROR');

-- CreateTable
CREATE TABLE "document_signature_requests" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "documentation_item_id" TEXT,
    "document_type" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL DEFAULT '',
    "status" "DocumentSignatureStatus" NOT NULL DEFAULT 'CREATED',
    "signer_email" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "client_user_id" TEXT NOT NULL,
    "signed_document_id" TEXT,
    "error_message" TEXT NOT NULL DEFAULT '',
    "completed_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "document_signature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_signature_requests_documentation_item_id_key" ON "document_signature_requests"("documentation_item_id");
CREATE UNIQUE INDEX "document_signature_requests_signed_document_id_key" ON "document_signature_requests"("signed_document_id");
CREATE INDEX "document_signature_requests_application_id_document_type_idx" ON "document_signature_requests"("application_id", "document_type");
CREATE INDEX "document_signature_requests_envelope_id_idx" ON "document_signature_requests"("envelope_id");
CREATE INDEX "document_signature_requests_status_idx" ON "document_signature_requests"("status");

-- AddForeignKey
ALTER TABLE "document_signature_requests" ADD CONSTRAINT "document_signature_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_signature_requests" ADD CONSTRAINT "document_signature_requests_documentation_item_id_fkey" FOREIGN KEY ("documentation_item_id") REFERENCES "application_documentation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_signature_requests" ADD CONSTRAINT "document_signature_requests_signed_document_id_fkey" FOREIGN KEY ("signed_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_signature_requests" ADD CONSTRAINT "document_signature_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
