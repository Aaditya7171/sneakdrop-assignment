-- DropIndex
DROP INDEX "Hold_status_createdAt_idx";

-- CreateIndex
CREATE INDEX "Hold_status_expiresAt_idx" ON "Hold"("status", "expiresAt");
