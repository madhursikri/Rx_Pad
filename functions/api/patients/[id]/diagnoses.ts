import { createPatientDiagnosisSchema } from "@/lib/diagnosis-validation";
import { formatZodErrors } from "@/lib/patient-validation";
import { createPatientDiagnosis, getPatientDiagnoses } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const diagnoses = await getPatientDiagnoses(context.env.DB, id);
    if (!diagnoses) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(diagnoses);
  } catch (error) {
    console.error("Failed to load patient diagnoses", error);
    return Response.json({ message: "Could not fetch patient diagnoses" }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const result = createPatientDiagnosisSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      {
        message: "Validation failed",
        fieldErrors: formatZodErrors(result.error)
      },
      { status: 400 }
    );
  }

  try {
    const created = await createPatientDiagnosis(context.env.DB, id, result.data);
    if (created.status === "patient_not_found") {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }
    if (created.status === "diagnosis_not_found") {
      return Response.json(
        {
          message: "Diagnosis not found",
          fieldErrors: { diagnosisId: "Select a valid diagnosis from search results" }
        },
        { status: 400 }
      );
    }

    return Response.json(created.diagnosis, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient diagnosis", error);
    return Response.json({ message: "Could not create patient diagnosis" }, { status: 500 });
  }
}
