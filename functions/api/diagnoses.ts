import { ZodError } from "zod";
import { createDiagnosisSchema } from "@/lib/diagnosis-validation";
import { formatZodErrors, parseLimit } from "@/lib/patient-validation";
import { createDiagnosis, getDiagnoses } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = query ? 20 : parseLimit(url.searchParams.get("limit"));

  try {
    const diagnoses = await getDiagnoses(context.env.DB, query, limit);
    return Response.json(diagnoses);
  } catch (error) {
    console.error("Failed to fetch diagnoses", error);
    return Response.json({ message: "Could not fetch diagnoses" }, { status: 500 });
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
    const input = createDiagnosisSchema.parse(body);
    const created = await createDiagnosis(context.env.DB, input);

    if (!created) {
      return Response.json(
        {
          message: "Diagnosis already exists",
          fieldErrors: { name: "Diagnosis with this name already exists" }
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
    console.error("Failed to create diagnosis", error);
    return Response.json({ message: "Could not create diagnosis" }, { status: 500 });
  }
}
