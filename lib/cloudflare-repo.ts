import type { CreateMedicationInput } from "@/lib/medication-validation";
import type { CreatePatientInput } from "@/lib/patient-validation";
import type { CreatePrescriptionInput } from "@/lib/prescription-validation";
import { ensureDatabaseReady } from "@/lib/cloudflare-db";
import { describePatientChanges } from "@/lib/patient-records";
import type {
  MedicationOption,
  PatientDetail,
  PatientEventRecord,
  PatientNoteRecord,
  PatientSummary,
  PrescriptionRecord
} from "@/types/patient";

type D1Runner = Parameters<typeof ensureDatabaseReady>[0];

type PatientRow = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: PatientDetail["gender"];
  phoneCountryCode: string | null;
  phone: string | null;
  phoneE164: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type MedicationRow = {
  id: string;
  name: string;
  commonStrengths: string | null;
  defaultDose: string | null;
  defaultFrequency: string | null;
  defaultDuration: string | null;
  defaultInstructions: string | null;
  createdAt: string;
  updatedAt: string;
};

type PrescriptionRow = {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  isActive: number | boolean;
  inactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  note: string;
  createdAt: string;
};

type EventRow = {
  id: string;
  type: string;
  title: string;
  details: string | null;
  createdAt: string;
};

function toPatientSummary(row: PatientRow): PatientSummary {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dob: row.dob,
    gender: row.gender,
    phoneCountryCode: row.phoneCountryCode,
    phone: row.phone,
    updatedAt: row.updatedAt
  };
}

function toPatientDetail(row: PatientRow): PatientDetail {
  return {
    ...toPatientSummary(row),
    email: row.email,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    notes: row.notes,
    createdAt: row.createdAt
  };
}

function toMedicationOption(row: MedicationRow): MedicationOption {
  return {
    id: row.id,
    name: row.name,
    commonStrengths: row.commonStrengths,
    defaultDose: row.defaultDose,
    defaultFrequency: row.defaultFrequency,
    defaultDuration: row.defaultDuration,
    defaultInstructions: row.defaultInstructions
  };
}

function toPrescriptionRecord(row: PrescriptionRow): PrescriptionRecord {
  return {
    id: row.id,
    medicationName: row.medicationName,
    strength: row.strength,
    dose: row.dose,
    frequency: row.frequency,
    duration: row.duration,
    instructions: row.instructions,
    isActive: Boolean(row.isActive),
    inactivatedAt: row.inactivatedAt,
    createdAt: row.createdAt
  };
}

function toNoteRecord(row: NoteRow): PatientNoteRecord {
  return {
    id: row.id,
    note: row.note,
    createdAt: row.createdAt
  };
}

function toEventRecord(row: EventRow): PatientEventRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    details: row.details,
    createdAt: row.createdAt
  };
}

function toUtcIso(date: Date | string): string {
  return (typeof date === "string" ? new Date(date) : date).toISOString();
}

function normalizeDateInput(dateValue: Date | string): string {
  return toUtcIso(dateValue);
}

async function getPatientRow(db: D1Runner, id: string): Promise<PatientRow | null> {
  return db
    .prepare(
      `SELECT id, firstName, lastName, dob, gender, phoneCountryCode, phone, phoneE164,
              email, addressLine1, addressLine2, city, state, postalCode, notes,
              createdAt, updatedAt
       FROM Patient
       WHERE id = ?`
    )
    .bind(id)
    .first<PatientRow>();
}

async function getMedicationRow(db: D1Runner, id: string): Promise<MedicationRow | null> {
  return db
    .prepare(
      `SELECT id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions,
              createdAt, updatedAt
       FROM Medication
       WHERE id = ?`
    )
    .bind(id)
    .first<MedicationRow>();
}

async function patientExists(db: D1Runner, id: string): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM Patient WHERE id = ?").bind(id).first<{ id: string }>();
  return Boolean(row);
}

export async function findDuplicatePatientWarnings(
  db: D1Runner,
  input: Pick<CreatePatientInput, "firstName" | "lastName" | "dob" | "phoneCountryCode" | "phone" | "phoneE164">,
  excludePatientId?: string
): Promise<string[]> {
  await ensureDatabaseReady(db);

  const sameNameRows = await db
    .prepare(
      `SELECT id, firstName, lastName, dob
       FROM Patient
       WHERE firstName = ? AND lastName = ? AND dob = ?${excludePatientId ? " AND id != ?" : ""}`
    )
    .bind(input.firstName, input.lastName, normalizeDateInput(input.dob), ...(excludePatientId ? [excludePatientId] : []))
    .all<{ id: string; firstName: string; lastName: string; dob: string }>();

  const samePhoneRows =
    input.phone || input.phoneE164
      ? await db
          .prepare(
            `SELECT id, phone, phoneE164
             FROM Patient
             WHERE (${input.phone ? "phone = ?" : "phone IS NOT NULL"}
               OR ${input.phoneE164 ? "phoneE164 = ?" : "phoneE164 IS NOT NULL"})
               ${excludePatientId ? "AND id != ?" : ""}`
          )
          .bind(
            ...(input.phone ? [input.phone] : []),
            ...(input.phoneE164 ? [input.phoneE164] : []),
            ...(excludePatientId ? [excludePatientId] : [])
          )
          .all<{ id: string; phone: string | null; phoneE164: string | null }>()
      : { results: [] as Array<{ id: string; phone: string | null; phoneE164: string | null }> };

  const warnings: string[] = [];
  if (sameNameRows.results.length > 0) {
    warnings.push("A patient with the same name and date of birth already exists.");
  }
  if (samePhoneRows.results.length > 0) {
    warnings.push("A patient with the same phone number already exists.");
  }

  return warnings;
}

export async function getRecentPatients(db: D1Runner, limit: number): Promise<PatientSummary[]> {
  await ensureDatabaseReady(db);
  const rows = await db
    .prepare(
      `SELECT id, firstName, lastName, dob, gender, phoneCountryCode, phone, updatedAt
       FROM Patient
       ORDER BY updatedAt DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<PatientSummary>();
  return rows.results;
}

export async function searchPatients(db: D1Runner, query: string, limit: number): Promise<PatientSummary[]> {
  await ensureDatabaseReady(db);
  const parts = query.split(/\s+/).filter(Boolean);
  const clauses: string[] = [];
  const params: unknown[] = [];

  clauses.push("LOWER(firstName) LIKE LOWER(?)");
  params.push(`%${query}%`);

  clauses.push("LOWER(lastName) LIKE LOWER(?)");
  params.push(`%${query}%`);

  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts.slice(1).join(" ");
    clauses.push("(LOWER(firstName) LIKE LOWER(?) AND LOWER(lastName) LIKE LOWER(?))");
    params.push(`%${first}%`, `%${last}%`);
    clauses.push("(LOWER(firstName) LIKE LOWER(?) AND LOWER(lastName) LIKE LOWER(?))");
    params.push(`%${last}%`, `%${first}%`);
  }

  const phoneDigits = query.replace(/\D/g, "");
  if (phoneDigits.length >= 3) {
    clauses.push("phone LIKE ?");
    params.push(`%${phoneDigits}%`);
    clauses.push("phoneE164 LIKE ?");
    params.push(`%${phoneDigits}%`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(query)) {
    clauses.push("dob LIKE ?");
    params.push(`${query}%`);
  }

  const rows = await db
    .prepare(
      `SELECT id, firstName, lastName, dob, gender, phoneCountryCode, phone, updatedAt
       FROM Patient
       WHERE ${clauses.map((clause) => `(${clause})`).join(" OR ")}
       ORDER BY updatedAt DESC
       LIMIT ?`
    )
    .bind(...params, limit)
    .all<PatientSummary>();

  return rows.results;
}

export async function getPatientById(db: D1Runner, id: string): Promise<PatientDetail | null> {
  await ensureDatabaseReady(db);
  const row = await getPatientRow(db, id);
  return row ? toPatientDetail(row) : null;
}

export async function createPatient(db: D1Runner, input: CreatePatientInput) {
  await ensureDatabaseReady(db);
  const duplicateWarnings = await findDuplicatePatientWarnings(db, input);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO Patient (
        id, firstName, lastName, dob, gender, phoneCountryCode, phone, phoneE164,
        email, addressLine1, addressLine2, city, state, postalCode, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.firstName,
      input.lastName,
      normalizeDateInput(input.dob),
      input.gender,
      input.phoneCountryCode,
      input.phone,
      input.phoneE164,
      input.email,
      input.addressLine1,
      input.addressLine2,
      input.city,
      input.state,
      input.postalCode,
      input.notes,
      now,
      now
    )
    .run();

  await db
    .prepare(
      `INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), id, "PATIENT_CREATED", "Patient created", "Created a new patient record.", now)
    .run();

  const created = await getPatientById(db, id);
  if (!created) {
    throw new Error("Patient insert succeeded but record could not be loaded.");
  }

  return { created, warnings: duplicateWarnings };
}

export async function updatePatient(db: D1Runner, id: string, input: CreatePatientInput) {
  await ensureDatabaseReady(db);
  const existing = await getPatientRow(db, id);
  if (!existing) return null;

  const warnings = await findDuplicatePatientWarnings(db, input, id);
  const changes = describePatientChanges(
    {
      firstName: existing.firstName,
      lastName: existing.lastName,
      dob: new Date(existing.dob),
      gender: existing.gender,
      phoneCountryCode: existing.phoneCountryCode,
      phone: existing.phone,
      phoneE164: existing.phoneE164,
      email: existing.email,
      addressLine1: existing.addressLine1,
      addressLine2: existing.addressLine2,
      city: existing.city,
      state: existing.state,
      postalCode: existing.postalCode,
      notes: existing.notes
    },
    input
  );
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE Patient
       SET firstName = ?, lastName = ?, dob = ?, gender = ?, phoneCountryCode = ?, phone = ?, phoneE164 = ?,
           email = ?, addressLine1 = ?, addressLine2 = ?, city = ?, state = ?, postalCode = ?, notes = ?, updatedAt = ?
       WHERE id = ?`
    )
    .bind(
      input.firstName,
      input.lastName,
      normalizeDateInput(input.dob),
      input.gender,
      input.phoneCountryCode,
      input.phone,
      input.phoneE164,
      input.email,
      input.addressLine1,
      input.addressLine2,
      input.city,
      input.state,
      input.postalCode,
      input.notes,
      now,
      id
    )
    .run();

  await db
    .prepare(
      `INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      id,
      "PATIENT_UPDATED",
      "Patient updated",
      changes.length > 0 ? `Changed fields: ${changes.join(", ")}.` : "Saved patient record.",
      now
    )
    .run();

  const updated = await getPatientById(db, id);
  if (!updated) {
    throw new Error("Patient update succeeded but record could not be loaded.");
  }

  return { updated, warnings };
}

export async function getMedications(db: D1Runner, query: string, limit: number): Promise<MedicationOption[]> {
  await ensureDatabaseReady(db);
  const statement = query
    ? db
        .prepare(
          `SELECT id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions
           FROM Medication
           WHERE LOWER(name) LIKE LOWER(?)
           ORDER BY name ASC
           LIMIT ?`
        )
        .bind(`%${query}%`, limit)
    : db
        .prepare(
          `SELECT id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions
           FROM Medication
           ORDER BY name ASC
           LIMIT ?`
        )
        .bind(limit);
  const rows = await statement.all<MedicationRow>();
  return rows.results.map(toMedicationOption);
}

export async function createMedication(db: D1Runner, input: CreateMedicationInput) {
  await ensureDatabaseReady(db);
  const existing = await db.prepare("SELECT id FROM Medication WHERE name = ?").bind(input.name).first<{ id: string }>();
  if (existing) {
    return null;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO Medication (
        id, name, commonStrengths, defaultDose, defaultFrequency, defaultDuration, defaultInstructions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.name, input.commonStrengths, input.defaultDose, input.defaultFrequency, input.defaultDuration, input.defaultInstructions, now, now)
    .run();

  const created = await getMedicationRow(db, id);
  return created ? toMedicationOption(created) : null;
}

export async function updateMedication(db: D1Runner, id: string, input: CreateMedicationInput) {
  await ensureDatabaseReady(db);
  const existing = await getMedicationRow(db, id);
  if (!existing) return { status: "not_found" as const };

  const duplicate = await db
    .prepare("SELECT id FROM Medication WHERE name = ? AND id != ?")
    .bind(input.name, id)
    .first<{ id: string }>();
  if (duplicate) return { status: "duplicate" as const };

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE Medication
       SET name = ?, commonStrengths = ?, defaultDose = ?, defaultFrequency = ?, defaultDuration = ?, defaultInstructions = ?, updatedAt = ?
       WHERE id = ?`
    )
    .bind(input.name, input.commonStrengths, input.defaultDose, input.defaultFrequency, input.defaultDuration, input.defaultInstructions, now, id)
    .run();

  const updated = await getMedicationRow(db, id);
  return updated ? { status: "ok" as const, medication: toMedicationOption(updated) } : { status: "not_found" as const };
}

export async function deleteMedication(db: D1Runner, id: string) {
  await ensureDatabaseReady(db);
  const existing = await getMedicationRow(db, id);
  if (!existing) return { status: "not_found" as const };

  const usage = await db
    .prepare("SELECT COUNT(*) as count FROM Prescription WHERE medicationId = ?")
    .bind(id)
    .first<{ count: number }>();
  if ((usage?.count ?? 0) > 0) return { status: "in_use" as const };

  await db.prepare("DELETE FROM Medication WHERE id = ?").bind(id).run();
  return { status: "deleted" as const };
}

export async function getPatientNotes(db: D1Runner, id: string): Promise<PatientNoteRecord[] | null> {
  await ensureDatabaseReady(db);
  const exists = await patientExists(db, id);
  if (!exists) return null;

  const rows = await db
    .prepare(
      `SELECT id, note, createdAt
       FROM PatientNote
       WHERE patientId = ?
       ORDER BY createdAt DESC`
    )
    .bind(id)
    .all<NoteRow>();
  return rows.results.map(toNoteRecord);
}

export async function createPatientNote(db: D1Runner, id: string, note: string) {
  await ensureDatabaseReady(db);
  const exists = await patientExists(db, id);
  if (!exists) return null;

  const now = new Date().toISOString();
  const noteId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO PatientNote (id, patientId, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)")
    .bind(noteId, id, note, now, now)
    .run();

  const details = note.length > 120 ? `${note.slice(0, 117)}...` : note;
  await db
    .prepare("INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), id, "NOTE_CREATED", "Note added", details, now)
    .run();

  const row = await db
    .prepare("SELECT id, note, createdAt FROM PatientNote WHERE id = ?")
    .bind(noteId)
    .first<NoteRow>();
  return row ? toNoteRecord(row) : null;
}

export async function getPatientEvents(db: D1Runner, id: string): Promise<PatientEventRecord[] | null> {
  await ensureDatabaseReady(db);
  const exists = await patientExists(db, id);
  if (!exists) return null;

  const rows = await db
    .prepare(
      `SELECT id, type, title, details, createdAt
       FROM PatientEvent
       WHERE patientId = ?
       ORDER BY createdAt DESC`
    )
    .bind(id)
    .all<EventRow>();
  return rows.results.map(toEventRecord);
}

export async function getPatientPrescriptions(db: D1Runner, id: string): Promise<PrescriptionRecord[] | null> {
  await ensureDatabaseReady(db);
  const exists = await patientExists(db, id);
  if (!exists) return null;

  const rows = await db
    .prepare(
      `SELECT id, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt
       FROM Prescription
       WHERE patientId = ?
       ORDER BY createdAt DESC`
    )
    .bind(id)
    .all<PrescriptionRow>();
  return rows.results.map(toPrescriptionRecord);
}

export async function createPrescription(
  db: D1Runner,
  id: string,
  input: CreatePrescriptionInput,
  options?: { allowDuplicate?: boolean }
) {
  await ensureDatabaseReady(db);
  const [patient, medication] = await Promise.all([getPatientRow(db, id), getMedicationRow(db, input.medicationId)]);
  if (!patient) return { status: "patient_not_found" as const };
  if (!medication) return { status: "medication_not_found" as const };

  if (!options?.allowDuplicate) {
    const duplicate = await db
      .prepare(
        `SELECT id
         FROM Prescription
         WHERE patientId = ?
           AND medicationId = ?
           AND strength = ?
           AND dose = ?
           AND frequency = ?
           AND duration = ?
           AND COALESCE(instructions, '') = COALESCE(?, '')
           AND isActive = 1
         LIMIT 1`
      )
      .bind(
        id,
        medication.id,
        input.strength,
        input.dose,
        input.frequency,
        input.duration,
        input.instructions
      )
      .first<{ id: string }>();

    if (duplicate) {
      return {
        status: "duplicate" as const,
        warnings: [
          `This patient already has an active prescription for ${medication.name} ${input.strength} with the same dose, frequency, and duration.`
        ]
      };
    }
  }

  const now = new Date().toISOString();
  const prescriptionId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO Prescription (
        id, patientId, medicationId, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)`
    )
    .bind(
      prescriptionId,
      id,
      medication.id,
      medication.name,
      input.strength,
      input.dose,
      input.frequency,
      input.duration,
      input.instructions,
      now,
      now
    )
    .run();

  await db
    .prepare("INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), id, "PRESCRIPTION_CREATED", "Prescription added", `${medication.name} ${input.strength} added.`, now)
    .run();

  const row = await db
    .prepare(
      `SELECT id, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt
       FROM Prescription
       WHERE id = ?`
    )
    .bind(prescriptionId)
    .first<PrescriptionRow>();
  return row ? { status: "ok" as const, prescription: toPrescriptionRecord(row) } : { status: "not_found" as const };
}

export async function updatePrescriptionStatus(db: D1Runner, id: string, prescriptionId: string, isActive: boolean) {
  await ensureDatabaseReady(db);
  const existing = await db
    .prepare("SELECT id, medicationName FROM Prescription WHERE id = ? AND patientId = ?")
    .bind(prescriptionId, id)
    .first<{ id: string; medicationName: string }>();
  if (!existing) return null;

  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE Prescription
       SET isActive = ?, inactivatedAt = ?, updatedAt = ?
       WHERE id = ?`
    )
    .bind(isActive ? 1 : 0, isActive ? null : now, now, prescriptionId)
    .run();

  await db
    .prepare("INSERT INTO PatientEvent (id, patientId, type, title, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(
      crypto.randomUUID(),
      id,
      isActive ? "PRESCRIPTION_ACTIVATED" : "PRESCRIPTION_INACTIVATED",
      isActive ? "Prescription activated" : "Prescription inactivated",
      `${existing.medicationName} ${isActive ? "marked active" : "marked inactive"}.`,
      now
    )
    .run();

  const row = await db
    .prepare(
      `SELECT id, medicationName, strength, dose, frequency, duration, instructions, isActive, inactivatedAt, createdAt, updatedAt
       FROM Prescription
       WHERE id = ?`
    )
    .bind(prescriptionId)
    .first<PrescriptionRow>();
  return row ? toPrescriptionRecord(row) : null;
}
