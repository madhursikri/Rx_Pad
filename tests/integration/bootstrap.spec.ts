import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensureDatabaseReady } from "@/lib/cloudflare-db";
import { createTestD1Database, countRows, seedSql } from "@/tests/helpers/sqlite-d1";

const localSeedSql = readFileSync(path.resolve(process.cwd(), "scripts", "local-test-seed.sql"), "utf8");

describe("database bootstrap", () => {
  it("creates schema only in production mode", async () => {
    const db = await createTestD1Database();

    await ensureDatabaseReady(db, "production");

    expect((await countRows(db, "Patient"))?.count ?? 0).toBe(0);
    expect((await countRows(db, "Medication"))?.count ?? 0).toBe(0);
    expect((await countRows(db, "Prescription"))?.count ?? 0).toBe(0);
  });

  it("seeds preview data once and stays idempotent", async () => {
    const db = await createTestD1Database();

    await ensureDatabaseReady(db, "preview");
    const firstCounts = {
      patients: (await countRows(db, "Patient"))?.count ?? 0,
      medications: (await countRows(db, "Medication"))?.count ?? 0,
      prescriptions: (await countRows(db, "Prescription"))?.count ?? 0,
      notes: (await countRows(db, "PatientNote"))?.count ?? 0,
      events: (await countRows(db, "PatientEvent"))?.count ?? 0
    };

    await ensureDatabaseReady(db, "preview");
    const secondCounts = {
      patients: (await countRows(db, "Patient"))?.count ?? 0,
      medications: (await countRows(db, "Medication"))?.count ?? 0,
      prescriptions: (await countRows(db, "Prescription"))?.count ?? 0,
      notes: (await countRows(db, "PatientNote"))?.count ?? 0,
      events: (await countRows(db, "PatientEvent"))?.count ?? 0
    };

    expect(firstCounts).toEqual({
      patients: 3,
      medications: 6,
      prescriptions: 5,
      notes: 5,
      events: 12
    });
    expect(secondCounts).toEqual(firstCounts);
  });

  it("keeps the local test seed aligned with the local seed script", async () => {
    const db = await createTestD1Database();
    await seedSql(db, localSeedSql);

    expect((await countRows(db, "Patient"))?.count ?? 0).toBe(3);
    expect((await countRows(db, "Medication"))?.count ?? 0).toBe(6);
    expect((await countRows(db, "Prescription"))?.count ?? 0).toBe(5);
  });

  it("migrates legacy diagnosis columns out of existing databases", async () => {
    const db = await createTestD1Database();
    await seedSql(
      db,
      `
        PRAGMA foreign_keys = ON;
        CREATE TABLE Patient (
          id TEXT PRIMARY KEY,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          dob TEXT NOT NULL,
          gender TEXT NOT NULL,
          phoneCountryCode TEXT,
          phone TEXT,
          phoneE164 TEXT,
          email TEXT,
          addressLine1 TEXT,
          addressLine2 TEXT,
          city TEXT,
          state TEXT,
          postalCode TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE Diagnosis (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          icd10Code TEXT,
          description TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        CREATE TABLE PatientDiagnosis (
          id TEXT PRIMARY KEY,
          patientId TEXT NOT NULL,
          diagnosisId TEXT NOT NULL,
          diagnosisName TEXT NOT NULL,
          diagnosisCode TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        INSERT INTO Patient VALUES ('patient-1', 'Test', 'Patient', '1990-01-01', 'female', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');
        INSERT INTO Diagnosis VALUES ('diag-1', 'Legacy diagnosis', 'X99.9', 'Legacy description', '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');
        INSERT INTO PatientDiagnosis VALUES ('pd-1', 'patient-1', 'diag-1', 'Legacy diagnosis', 'X99.9', '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z');
      `
    );

    await ensureDatabaseReady(db, "production");

    const diagnosisColumns = (await db.prepare("PRAGMA table_info(Diagnosis)").all<{ name: string }>()).results;
    const patientDiagnosisColumns = (await db.prepare("PRAGMA table_info(PatientDiagnosis)").all<{ name: string }>()).results;

    expect(diagnosisColumns.map((column) => column.name)).not.toContain("icd10Code");
    expect(patientDiagnosisColumns.map((column) => column.name)).not.toContain("diagnosisCode");
    expect((await countRows(db, "Diagnosis"))?.count ?? 0).toBe(1);
    expect((await countRows(db, "PatientDiagnosis"))?.count ?? 0).toBe(1);
  });
});
