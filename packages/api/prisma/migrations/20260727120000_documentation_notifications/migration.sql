-- AlterTable
ALTER TABLE "application_documentations" ADD COLUMN "candidate_notified_at" TIMESTAMP(3);
ALTER TABLE "application_documentations" ADD COLUMN "submitted_for_review_at" TIMESTAMP(3);
ALTER TABLE "application_documentations" ADD COLUMN "hr_notified_at" TIMESTAMP(3);
