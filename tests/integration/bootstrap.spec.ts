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
});
