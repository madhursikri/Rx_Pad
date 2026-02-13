-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "phoneCountryCode" TEXT;
ALTER TABLE "Patient" ADD COLUMN "phoneE164" TEXT;

-- Backfill current phone values so old records remain searchable by phone
UPDATE "Patient"
SET "phoneE164" = "phone"
WHERE "phone" IS NOT NULL AND "phone" != '';

-- CreateIndex
CREATE INDEX "Patient_phoneE164_idx" ON "Patient"("phoneE164");
