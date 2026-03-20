-- CreateTable
CREATE TABLE "PatientEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatientEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PatientEvent_patientId_createdAt_idx" ON "PatientEvent"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "PatientEvent_patientId_type_idx" ON "PatientEvent"("patientId", "type");
