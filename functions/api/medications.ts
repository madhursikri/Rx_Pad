import { ZodError } from "zod";
import { createMedicationSchema } from "@/lib/medication-validation";
import { formatZodErrors } from "@/lib/patient-validation";
import { createMedication, getMedications } from "@/lib/cloudflare-repo";
import type { CreateMedicationInput } from "@/lib/medication-validation";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = query ? 20 : 200;

  try {
    const meds = await getMedications(context.env.DB, query, limit);
    return Response.json(meds);
  } catch (error) {
    console.error("Failed to fetch medications", error);
    return Response.json({ message: "Could not fetch medications" }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const input = createMedicationSchema.parse(body) as CreateMedicationInput;
    const created = await createMedication(context.env.DB, input);

    if (!created) {
      return Response.json(
        {
          message: "Medication already exists",
          fieldErrors: { name: "Medication with this name already exists" }
        },
        { status: 400 }
      );
    }

    return Response.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          message: "Validation failed",
          fieldErrors: formatZodErrors(error)
        },
        { status: 400 }
      );
    }
    console.error("Failed to create medication", error);
    return Response.json({ message: "Could not create medication" }, { status: 500 });
  }
}
