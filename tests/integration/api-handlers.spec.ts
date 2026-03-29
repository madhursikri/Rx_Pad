import { describe, expect, it } from "vitest";
import * as patientsApi from "@/functions/api/patients";
import * as patientApi from "@/functions/api/patients/[id]";
import * as notesApi from "@/functions/api/patients/[id]/notes";
import * as eventsApi from "@/functions/api/patients/[id]/events";
import * as prescriptionsApi from "@/functions/api/patients/[id]/prescriptions";
import * as prescriptionStatusApi from "@/functions/api/patients/[id]/prescriptions/[prescriptionId]";
import * as medicationsApi from "@/functions/api/medications";
import * as medicationApi from "@/functions/api/medications/[id]";
import { ensureDatabaseReady } from "@/lib/cloudflare-db";
import { createTestD1Database } from "@/tests/helpers/sqlite-d1";

function jsonRequest(url: string, body?: unknown, init?: RequestInit) {
  const method = init?.method ?? (body === undefined ? "GET" : "POST");
  return new Request(url, {
    method,
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    body: body === undefined || method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body)
  });
}

describe("API handlers", () => {
  it("handles patients collection requests", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const listResponse = await patientsApi.onRequestGet({
      request: new Request("http://local/api/patients"),
      env: { DB: db }
    });
    expect(listResponse.status).toBe(200);
    expect((await listResponse.json()) as Array<{ firstName: string }>).toHaveLength(3);

    const searchResponse = await patientsApi.onRequestGet({
      request: new Request("http://local/api/patients?query=Emma"),
      env: { DB: db }
    });
    expect(searchResponse.status).toBe(200);

    const invalidJson = await patientsApi.onRequestPost({
      request: new Request("http://local/api/patients", { method: "POST", body: "not-json" }),
      env: { DB: db }
    });
    expect(invalidJson.status).toBe(400);

    const createResponse = await patientsApi.onRequestPost({
      request: jsonRequest("http://local/api/patients", {
        firstName: "Sana",
        lastName: "Iyer",
        dob: "1991-04-02",
        gender: "female",
        phoneCountryCode: "+1",
        phone: "4155550123",
        email: "sana@example.test",
        addressLine1: "10 Main St",
        addressLine2: "",
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        notes: ""
      }),
      env: { DB: db }
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string };
    expect(created.id).toBeTruthy();
  });

  it("handles patient detail and update responses", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const missing = await patientApi.onRequestGet({
      env: { DB: db },
      params: {}
    });
    expect(missing.status).toBe(400);

    const notFound = await patientApi.onRequestGet({
      env: { DB: db },
      params: { id: "missing" }
    });
    expect(notFound.status).toBe(404);

    const updateResponse = await patientApi.onRequestPatch({
      request: jsonRequest("http://local/api/patients/patient-emma-carter", {
        firstName: "Emma",
        lastName: "Carter",
        dob: "1988-04-12",
        gender: "female",
        phoneCountryCode: "+1",
        phone: "4155550188",
        email: "emma.updated@example.test",
        addressLine1: "145 Lakeview Ave",
        addressLine2: "",
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        notes: "Updated during test"
      }),
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as { email: string };
    expect(updated.email).toBe("emma.updated@example.test");
  });

  it("handles notes and events routes", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const noteGet = await notesApi.onRequestGet({
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(noteGet.status).toBe(200);

    const notePost = await notesApi.onRequestPost({
      request: jsonRequest("http://local/api/patients/patient-emma-carter/notes", { note: "Follow-up next week." }),
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(notePost.status).toBe(201);

    const eventGet = await eventsApi.onRequestGet({
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(eventGet.status).toBe(200);

    const missing = await notesApi.onRequestGet({
      env: { DB: db },
      params: { id: "missing" }
    });
    expect(missing.status).toBe(404);
  });

  it("handles prescription add and duplicate confirmation responses", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const getResponse = await prescriptionsApi.onRequestGet({
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(getResponse.status).toBe(200);

    const duplicate = await prescriptionsApi.onRequestPost({
      request: jsonRequest("http://local/api/patients/patient-emma-carter/prescriptions", {
        medicationId: "med-amoxicillin",
        strength: "500 mg",
        dose: "1 capsule",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Finish the full course."
      }),
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(duplicate.status).toBe(409);

    const created = await prescriptionsApi.onRequestPost({
      request: jsonRequest("http://local/api/patients/patient-emma-carter/prescriptions", {
        medicationId: "med-amoxicillin",
        strength: "500 mg",
        dose: "1 capsule",
        frequency: "Three times daily",
        duration: "7 days",
        instructions: "Finish the full course.",
        allowDuplicate: true
      }),
      env: { DB: db },
      params: { id: "patient-emma-carter" }
    });
    expect(created.status).toBe(201);
  });

  it("handles prescription status and medication CRUD error branches", async () => {
    const db = await createTestD1Database();
    await ensureDatabaseReady(db, "preview");

    const missingStatus = await prescriptionStatusApi.onRequestPatch({
      request: jsonRequest("http://local/api/patients/patient-emma-carter/prescriptions/prescription-x", {
        isActive: true
      }),
      env: { DB: db },
      params: { id: "patient-emma-carter", prescriptionId: "missing" }
    });
    expect(missingStatus.status).toBe(404);

    const medicationGet = await medicationsApi.onRequestGet({
      request: new Request("http://local/api/medications?query=Amoxicillin"),
      env: { DB: db }
    });
    expect(medicationGet.status).toBe(200);

    const medicationPost = await medicationsApi.onRequestPost({
      request: jsonRequest("http://local/api/medications", {
        name: "Hydroxyzine",
        commonStrengths: "25 mg",
        defaultDose: "1 tablet",
        defaultFrequency: "Once nightly",
        defaultDuration: "30 days",
        defaultInstructions: ""
      }),
      env: { DB: db }
    });
    expect(medicationPost.status).toBe(201);

    const medicationPatch = await medicationApi.onRequestPatch({
      request: jsonRequest("http://local/api/medications/med-amoxicillin", {
        name: "Amoxicillin",
        commonStrengths: "250 mg, 500 mg",
        defaultDose: "1 capsule",
        defaultFrequency: "Three times daily",
        defaultDuration: "7 days",
        defaultInstructions: "Take after food"
      }),
      env: { DB: db },
      params: { id: "med-amoxicillin" }
    });
    expect(medicationPatch.status).toBe(200);

    const medicationDelete = await medicationApi.onRequestDelete({
      env: { DB: db },
      params: { id: "med-amoxicillin" }
    });
    expect([409, 200]).toContain(medicationDelete.status);
  });
});
