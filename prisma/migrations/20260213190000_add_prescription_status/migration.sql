-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Prescription" ADD COLUMN "inactivatedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Prescription_patientId_isActive_idx" ON "Prescription"("patientId", "isActive");
