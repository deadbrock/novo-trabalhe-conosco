-- CreateIndex
CREATE INDEX "applications_current_stage_deleted_at_idx" ON "applications"("current_stage", "deleted_at");

-- CreateIndex
CREATE INDEX "applications_status_deleted_at_idx" ON "applications"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "applications_job_id_deleted_at_idx" ON "applications"("job_id", "deleted_at");
