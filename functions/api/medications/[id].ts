import { ZodError } from "zod";
import { createMedicationSchema } from "@/lib/medication-validation";
import { formatZodErrors } from "@/lib/patient-validation";
import { deleteMedication, updateMedication } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestPatch(context: { request: Request; env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Medication id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const input = createMedicationSchema.parse(body);
    const result = await updateMedication(context.env.DB, id, input);

    if (result.status === "not_found") {
      return Response.json({ message: "Medication not found" }, { status: 404 });
    }
    if (result.status === "duplicate") {
      return Response.json(
        {
          message: "Medication already exists",
          fieldErrors: { name: "Medication with this name already exists" }
        },
        { status: 400 }
      );
    }

    return Response.json(result.medication);
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
    console.error("Failed to update medication", error);
    return Response.json({ message: "Could not update medication" }, { status: 500 });
  }
}

export async function onRequestDelete(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Medication id is required" }, { status: 400 });
  }

  try {
    const result = await deleteMedication(context.env.DB, id);
    if (result.status === "not_found") {
      return Response.json({ message: "Medication not found" }, { status: 404 });
    }
    if (result.status === "in_use") {
      return Response.json(
        {
          message: "Cannot delete medication because it is already used in patient prescriptions."
        },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete medication", error);
    return Response.json({ message: "Could not delete medication" }, { status: 500 });
  }
}
