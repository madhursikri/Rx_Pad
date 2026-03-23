import { MEDICATIONS, TEST_PATIENTS } from "@/lib/bootstrap-data";
import { normalizeCountryCode, normalizePhone } from "@/lib/patient-utils";

type D1Runner = D1Database;

let bootstrapPromise: Promise<void> | null = null;

function toUtcIso(dateString: string): string {
  return new Date(`${dateString}T00:00:00.000Z`).toISOString();
}

function toDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function buildE164Digits(countryCode: string | null, phone: string | null): string | null {
  if (!countryCode || !phone) return null;
  return `${toDigits(countryCode)}${toDigits(phone)}`;
}

async function runStatements(db: D1Runner, statements: string[]) {
  if (db.batch) {
    await db.batch(statements.map((statement) => db.prepare(statement)));
    return;
  }

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function createSchema(db: D1Runner) {
  await runStatements(db, [
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS Patient (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
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
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_patient_name ON Patient(lastName, firstName)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_dob ON Patient(dob)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_phone ON Patient(phone)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_phone_e164 ON Patient(phoneE164)`,
    `CREATE TABLE IF NOT EXISTS PatientNote (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_patient_note_patient_created ON PatientNote(patientId, createdAt)`,
    `CREATE TABLE IF NOT EXISTS PatientEvent (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_patient_event_patient_created ON PatientEvent(patientId, createdAt)`,
    `CREATE INDEX IF NOT EXISTS idx_patient_event_patient_type ON PatientEvent(patientId, type)`,
    `CREATE TABLE IF NOT EXISTS Medication (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      commonStrengths TEXT,
      defaultDose TEXT,
      defaultFrequency TEXT,
      defaultDuration TEXT,
      defaultInstructions TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_medication_name ON Medication(name)`,
    `CREATE TABLE IF NOT EXISTS Prescription (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      medicationId TEXT NOT NULL,
      medicationName TEXT NOT NULL,
      strength TEXT NOT NULL,
      dose TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      inactivatedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id) ON DELETE CASCADE,
      FOREIGN KEY (medicationId) REFERENCES Medication(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_prescription_patient_created ON Prescription(patientId, createdAt)`,
    `CREATE INDEX IF NOT EXISTS idx_prescription_patient_active ON Prescription(patientId, isActive)`,
    `CREATE INDEX IF NOT EXISTS idx_prescription_medication ON Prescription(medicationId)`
  ]);
}

async function seedMedications(db: D1Runner) {
  for (const medication of MEDICATIONS) {
    await db
      .prepare(
        `INSERT INTO Medication (
          id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(name) DO UPDATE SET
          commonStrengths = excluded.commonStrengths,
          defaultDose = excluded.defaultDose,
          defaultFrequency = excluded.defaultFrequency,
          defaultDuration = excluded.defaultDuration,
          defaultInstructions = excluded.defaultInstructions,
          updatedAt = CURRENT_TIMESTAMP`
      )
      .bind(
        crypto.randomUUID(),
        medication.name,
        medication.commonStrengths,
        medication.defaultDose,
        medication.defaultFrequency,
        medication.defaultDuration,
        medication.defaultInstructions
      )
      .run();
  }
}

async function seedPatients(db: D1Runner) {
  for (const patient of TEST_PATIENTS) {
    const dob = toUtcIso(patient.dob);
    const phone = patient.phone ? normalizePhone(patient.phone) : null;
    const phoneCountryCode = patient.phoneCountryCode ? normalizeCountryCode(patient.phoneCountryCode) : null;
    const phoneE164 = buildE164Digits(phoneCountryCode, phone);
    const addressLine2 = "addressLine2" in patient ? patient.addressLine2 ?? null : null;

    const existing = await db
      .prepare(
        `SELECT id FROM Patient
         WHERE firstName = ? AND lastName = ? AND dob = ?
         LIMIT 1`
      )
      .bind(patient.firstName, patient.lastName, dob)
      .first<{ id: string }>();

    if (existing) continue;

    await db
      .prepare(
        `INSERT INTO Patient (
          id, firstName, lastName, dob, gender, phoneCountryCode, phone, phoneE164,
          email, addressLine1, addressLine2, city, state, postalCode, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(
        crypto.randomUUID(),
        patient.firstName,
        patient.lastName,
        dob,
        patient.gender,
        phoneCountryCode,
        phone,
        phoneE164,
        patient.email ?? null,
        patient.addressLine1 ?? null,
        addressLine2,
        patient.city ?? null,
        patient.state ?? null,
        patient.postalCode ?? null,
        patient.notes ?? null
      )
      .run();
  }
}

async function initializeDatabase(db: D1Runner) {
  await createSchema(db);

  const medicationCount = await db.prepare("SELECT COUNT(*) as count FROM Medication").first<{ count: number }>();
  const patientCount = await db.prepare("SELECT COUNT(*) as count FROM Patient").first<{ count: number }>();

  if ((medicationCount?.count ?? 0) === 0) {
    await seedMedications(db);
  }

  if ((patientCount?.count ?? 0) === 0) {
    await seedPatients(db);
  }
}

export async function ensureDatabaseReady(db: D1Runner) {
  if (!bootstrapPromise) {
    bootstrapPromise = initializeDatabase(db).catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}
