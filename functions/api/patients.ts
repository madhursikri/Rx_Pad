import { createPatientSchema, formatZodErrors, parseLimit } from "@/lib/patient-validation";
import { createPatient, getRecentPatients, searchPatients } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = parseLimit(url.searchParams.get("limit"));

  try {
    if (!query) {
      const recent = await getRecentPatients(context.env.DB, limit);
      return Response.json(recent);
    }

    const found = await searchPatients(context.env.DB, query, limit);
    return Response.json(found);
  } catch (error) {
    console.error("Failed to search patients", error);
    return Response.json({ message: "Could not fetch patients" }, { status: 500 });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

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

  try {
    const created = await createPatient(context.env.DB, result.data);
    return Response.json({ ...created.created, warnings: created.warnings }, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient", error);
    return Response.json({ message: "Could not create patient" }, { status: 500 });
  }
}
