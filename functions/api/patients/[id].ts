import { createPatientSchema, formatZodErrors } from "@/lib/patient-validation";
import { getPatientById, updatePatient } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const patient = await getPatientById(context.env.DB, id);
    if (!patient) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(patient);
  } catch (error) {
    console.error("Failed to load patient", error);
    return Response.json({ message: "Could not fetch patient" }, { status: 500 });
  }
}

export async function onRequestPatch(context: { request: Request; env: Env; params: Record<string, string> }) {
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

  try {
    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          message: "Validation failed",
          fieldErrors: formatZodErrors(result.error)
        },
        { status: 400 }
      );
    }

    const updated = await updatePatient(context.env.DB, id, result.data);
    if (!updated) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json({ ...updated.updated, warnings: updated.warnings });
  } catch (error) {
    console.error("Failed to update patient", error);
    return Response.json({ message: "Could not update patient" }, { status: 500 });
  }
}
