import { describe, expect, it } from "vitest";
import {
  createDiagnosis,
  createMedication,
  createPatient,
  createPatientDiagnosis,
  createPatientNote,
  createPrescription,
  deleteDiagnosis,
  deleteMedication,
  getDiagnoses,
  findDuplicatePatientWarnings,
  getMedications,
  getPatientById,
  getPatientDiagnoses,
  getPatientEvents,
  getPatientNotes,
  getPatientPrescriptions,
  getRecentPatients,
  searchPatients,
  updateDiagnosis,
  updateMedication,
  updatePrescriptionStatus
} from "@/lib/cloudflare-repo";
import { ensureDatabaseReady } from "@/lib/cloudflare-db";
import { createTestD1Database } from "@/tests/helpers/sqlite-d1";

describe("cloudflare repository", () => {
  it("supports patient search, create, note, and timeline flows", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const recent = await getRecentPatients(db, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0]?.lastName).toBe("Shah");

    const search = await searchPatients(db, "Emma", 10);
    expect(search.map((patient) => patient.firstName)).toContain("Emma");

    const patient = await getPatientById(db, "patient-emma-carter");
    expect(patient?.notes).toContain("active and inactive prescriptions");

    const warnings = await findDuplicatePatientWarnings(db, {
      firstName: "Emma",
      lastName: "Carter",
      dob: new Date("1988-04-12T00:00:00.000Z"),
      phoneCountryCode: "+1",
      phone: "4155550188",
      phoneE164: "+14155550188"
    });
    expect(warnings).toEqual(
      expect.arrayContaining([
        "A patient with the same name and date of birth already exists.",
        "A patient with the same phone number already exists."
      ])
    );

    const created = await createPatient(db, {
      firstName: "Jada",
      lastName: "Ng",
      dob: new Date("1990-01-02T00:00:00.000Z"),
      gender: "female",
      phoneCountryCode: "+1",
      phone: "4155550100",
      phoneE164: "+14155550100",
      email: "jada@example.test",
      addressLine1: "1 Main St",
      addressLine2: null,
      city: "Oakland",
      state: "CA",
      postalCode: "94607",
      notes: "Created during test"
    });
    expect(created.created.firstName).toBe("Jada");

    const note = await createPatientNote(db, created.created.id, "Follow-up arranged.");
    expect(note?.note).toBe("Follow-up arranged.");

    const notes = await getPatientNotes(db, created.created.id);
    expect(notes).toHaveLength(1);

    const events = await getPatientEvents(db, created.created.id);
    expect(events).toHaveLength(2);
    expect(events?.[0]?.title).toBe("Note added");
  });

  it("supports medication CRUD and in-use protection", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const all = await getMedications(db, "", 50);
    expect(all).toHaveLength(6);

    const created = await createMedication(db, {
      name: "Cetirizine",
      commonStrengths: "10 mg",
      defaultDose: "1 tablet",
      defaultFrequency: "Once daily",
      defaultDuration: "30 days",
      defaultInstructions: "Take in the evening"
    });
    expect(created?.name).toBe("Cetirizine");

    const duplicate = await createMedication(db, {
      name: "Cetirizine",
      commonStrengths: "10 mg",
      defaultDose: "1 tablet",
      defaultFrequency: "Once daily",
      defaultDuration: "30 days",
      defaultInstructions: "Take in the evening"
    });
    expect(duplicate).toBeNull();

    const updated = await updateMedication(db, created!.id, {
      name: "Cetirizine",
      commonStrengths: "10 mg, 20 mg",
      defaultDose: "1 tablet",
      defaultFrequency: "Once daily",
      defaultDuration: "14 days",
      defaultInstructions: "Take in the evening"
    });
    expect(updated.status).toBe("ok");

    const inUse = await deleteMedication(db, "med-amoxicillin");
    expect(inUse.status).toBe("in_use");
  });

  it("supports diagnosis CRUD and patient diagnosis flows", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const all = await getDiagnoses(db, "", 50);
    expect(all).toHaveLength(6);

    const created = await createDiagnosis(db, {
      name: "Gastroesophageal reflux disease",
      description: "Acid reflux without esophagitis."
    });
    expect(created?.name).toBe("Gastroesophageal reflux disease");

    const duplicate = await createDiagnosis(db, {
      name: "Gastroesophageal reflux disease",
      description: "Acid reflux without esophagitis."
    });
    expect(duplicate).toBeNull();

    const updated = await updateDiagnosis(db, created!.id, {
      name: "GERD",
      description: "Updated diagnosis label."
    });
    expect(updated.status).toBe("ok");

    const inUse = await deleteDiagnosis(db, "diag-acute-pharyngitis");
    expect(inUse.status).toBe("in_use");

    const patientDiagnoses = await getPatientDiagnoses(db, "patient-emma-carter");
    expect(patientDiagnoses).toHaveLength(1);

    const createdPatientDiagnosis = await createPatientDiagnosis(db, "patient-emma-carter", {
      diagnosisId: "diag-asthma"
    });
    expect(createdPatientDiagnosis.status).toBe("ok");

    const updatedPatientDiagnoses = await getPatientDiagnoses(db, "patient-emma-carter");
    expect(updatedPatientDiagnoses).toHaveLength(2);
  });

  it("supports prescription duplicate warnings and status updates", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const duplicate = await createPrescription(
      db,
      "patient-emma-carter",
      {
        medicationId: "med-amoxicillin",
        strength: "500 mg",
        dose: "1 capsule",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Finish the full course."
      },
      { allowDuplicate: false }
    );
    expect(duplicate.status).toBe("duplicate");

    const created = await createPrescription(
      db,
      "patient-emma-carter",
      {
        medicationId: "med-amoxicillin",
        strength: "500 mg",
        dose: "1 capsule",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Finish the full course."
      },
      { allowDuplicate: true }
    );
    expect(created.status).toBe("ok");

    const prescriptions = await getPatientPrescriptions(db, "patient-emma-carter");
    expect(prescriptions?.length).toBeGreaterThanOrEqual(3);

    const prescription = prescriptions?.find((item) => item.medicationName === "Amoxicillin");
    expect(prescription?.isActive).toBe(true);

    if (prescription) {
      const updated = await updatePrescriptionStatus(db, "patient-emma-carter", prescription.id, false);
      expect(updated?.isActive).toBe(false);
    }
  });
});
