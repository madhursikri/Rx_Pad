import { ZodError } from "zod";
import { createDiagnosisSchema } from "@/lib/diagnosis-validation";
import { formatZodErrors } from "@/lib/patient-validation";
import { deleteDiagnosis, updateDiagnosis } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestPatch(context: { request: Request; env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Diagnosis id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const input = createDiagnosisSchema.parse(body);
    const result = await updateDiagnosis(context.env.DB, id, input);

    if (result.status === "not_found") {
      return Response.json({ message: "Diagnosis not found" }, { status: 404 });
    }
    if (result.status === "duplicate") {
      return Response.json(
        {
          message: "Diagnosis already exists",
          fieldErrors: { name: "Diagnosis with this name already exists" }
        },
        { status: 400 }
      );
    }

    return Response.json(result.diagnosis);
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
    console.error("Failed to update diagnosis", error);
    return Response.json({ message: "Could not update diagnosis" }, { status: 500 });
  }
}

export async function onRequestDelete(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Diagnosis id is required" }, { status: 400 });
  }

  try {
    const result = await deleteDiagnosis(context.env.DB, id);
    if (result.status === "not_found") {
      return Response.json({ message: "Diagnosis not found" }, { status: 404 });
    }
    if (result.status === "in_use") {
      return Response.json(
        {
          message: "Cannot delete diagnosis because it is already used in patient charts."
        },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete diagnosis", error);
    return Response.json({ message: "Could not delete diagnosis" }, { status: 500 });
  }
}
