import {
  PREVIEW_BOOTSTRAP_KEY,
  PREVIEW_EVENTS,
  PREVIEW_MEDICATIONS,
  PREVIEW_NOTES,
  PREVIEW_PATIENTS,
  PREVIEW_PRESCRIPTIONS
} from "@/lib/preview-seed-data";

type D1Runner = D1Database;
type BootstrapMode = "production" | "preview";

const bootstrapPromises = new WeakMap<D1Runner, Promise<void>>();

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
    `CREATE INDEX IF NOT EXISTS idx_prescription_medication ON Prescription(medicationId)`,
    `CREATE TABLE IF NOT EXISTS BootstrapState (
      name TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      branch TEXT,
      appliedAt TEXT NOT NULL
    )`
  ]);
}

async function insertRows<T>(db: D1Runner, statement: string, rows: readonly T[], bindRow: (row: T) => unknown[]) {
  for (const row of rows) {
    await db.prepare(statement).bind(...bindRow(row)).run();
  }
}

async function seedPreviewData(db: D1Runner) {
  const existing = await db
    .prepare("SELECT name FROM BootstrapState WHERE name = ?")
    .bind(PREVIEW_BOOTSTRAP_KEY)
    .first<{ name: string }>();

  if (existing) {
    return;
  }

  await insertRows(
    db,
    `INSERT OR IGNORE INTO Medication (
      id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    PREVIEW_MEDICATIONS,
    (medication) => [
      medication.id,
      medication.name,
      medication.commonStrengths,
      medication.defaultDose,
      medication.defaultFrequency,
      medication.defaultDuration,
      medication.defaultInstructions,
      medication.createdAt,
      medication.updatedAt
    ]
  );

  await insertRows(
    db,
    `INSERT OR IGNORE INTO Patient (
      id, firstName, lastName, dob, gender, phoneCountryCode, phone, phoneE164,
      email, addressLine1, addressLine2, city, state, postalCode, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    PREVIEW_PATIENTS,
    (patient) => [
      patient.id,
      patient.firstName,
      patient.lastName,
      patient.dob,
      patient.gender,
      patient.phoneCountryCode,
      patient.phone,
      patient.phoneE164,
      patient.email,
      patient.addressLine1,
      patient.addressLine2,
      patient.city,
      patient.state,
      patient.postalCode,
      patient.notes,
      patient.createdAt,
      patient.updatedAt
    ]
  );

  await insertRows(
    db,
    `INSERT OR IGNORE INTO Prescription (
      id, patientId, medicationId, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    PREVIEW_PRESCRIPTIONS,
    (prescription) => [
      prescription.id,
      prescription.patientId,
      prescription.medicationId,
      prescription.medicationName,
      prescription.strength,
      prescription.dose,
      prescription.frequency,
      prescription.duration,
      prescription.instructions,
      prescription.isActive,
      prescription.inactivatedAt,
      prescription.createdAt,
      prescription.updatedAt
    ]
  );

  await insertRows(
    db,
    `INSERT OR IGNORE INTO PatientNote (
      id, patientId, note, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?)`,
    PREVIEW_NOTES,
    (note) => [note.id, note.patientId, note.note, note.createdAt, note.updatedAt]
  );

  await insertRows(
    db,
    `INSERT OR IGNORE INTO PatientEvent (
      id, patientId, type, title, details, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    PREVIEW_EVENTS,
    (event) => [event.id, event.patientId, event.type, event.title, event.details, event.createdAt]
  );

  await db
    .prepare(
      `INSERT OR IGNORE INTO BootstrapState (name, mode, branch, appliedAt)
       VALUES (?, ?, ?, ?)`
    )
    .bind(PREVIEW_BOOTSTRAP_KEY, "preview", null, new Date().toISOString())
    .run();
}

async function initializeDatabase(db: D1Runner, mode: BootstrapMode) {
  await createSchema(db);

  if (mode === "preview") {
    await seedPreviewData(db);
  }
}

export async function ensureDatabaseReady(db: D1Runner, mode: BootstrapMode = "production") {
  let bootstrapPromise = bootstrapPromises.get(db);
  if (!bootstrapPromise) {
    bootstrapPromise = initializeDatabase(db, mode).catch((error) => {
      bootstrapPromises.delete(db);
      throw error;
    });
    bootstrapPromises.set(db, bootstrapPromise);
  }

  await bootstrapPromise;
}
