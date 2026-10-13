-- CreateEnum
CREATE TYPE "OperationalUnitType" AS ENUM ('HEADQUARTERS', 'REGIONAL');
CREATE TYPE "ApplicationOwner" AS ENUM ('LOCAL', 'HQ_HR', 'DP');
CREATE TYPE "SlaClockType" AS ENUM ('RH_DOCUMENTATION', 'DP_ADMISSION');
CREATE TYPE "SlaClockStatus" AS ENUM ('RUNNING', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "operational_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "OperationalUnitType" NOT NULL DEFAULT 'REGIONAL',
    "state_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_headquarters" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "operational_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operational_units_slug_key" ON "operational_units"("slug");

CREATE TABLE "application_sla_clocks" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "SlaClockType" NOT NULL,
    "status" "SlaClockStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL,
    "running_since" TIMESTAMP(3) NOT NULL,
    "paused_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "accumulated_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_sla_clocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_sla_clocks_application_id_type_key" ON "application_sla_clocks"("application_id", "type");
CREATE INDEX "application_sla_clocks_type_status_idx" ON "application_sla_clocks"("type", "status");

ALTER TABLE "staff_profiles" ADD COLUMN "unit_id" TEXT;
ALTER TABLE "jobs" ADD COLUMN "unit_id" TEXT;
ALTER TABLE "applications" ADD COLUMN "unit_id" TEXT;
ALTER TABLE "applications" ADD COLUMN "current_owner" "ApplicationOwner" NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "applications" ADD COLUMN "returned_reason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "applications" ADD COLUMN "returned_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN "interview_approved_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN "forwarded_to_dp_at" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN "dp_completed_at" TIMESTAMP(3);

CREATE INDEX "jobs_unit_id_idx" ON "jobs"("unit_id");
CREATE INDEX "applications_unit_id_current_owner_idx" ON "applications"("unit_id", "current_owner");

ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "operational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "application_sla_clocks" ADD CONSTRAINT "application_sla_clocks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "operational_units" ("id", "name", "slug", "type", "state_codes", "is_headquarters", "created_at", "updated_at")
VALUES
  ('unit-sede-pe', 'Sede administrativa — Pernambuco', 'sede-pe', 'HEADQUARTERS', ARRAY['PE']::TEXT[], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit-admin-outros', 'Administrativo — outros estados', 'admin-outros-estados', 'REGIONAL', ARRAY['BA','CE','SP','RJ']::TEXT[], false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "jobs" SET "unit_id" = CASE WHEN "state_code" = 'PE' OR "state_code" = '' THEN 'unit-sede-pe' ELSE 'unit-admin-outros' END
WHERE "unit_id" IS NULL;

UPDATE "applications" AS a
SET "unit_id" = j."unit_id"
FROM "jobs" AS j
WHERE a."job_id" = j."id" AND a."unit_id" IS NULL;
