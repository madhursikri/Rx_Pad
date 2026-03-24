import { ZodError } from "zod";
import { createPrescriptionSchema } from "@/lib/prescription-validation";
import { formatZodErrors } from "@/lib/patient-validation";
import { createPrescription, getPatientPrescriptions } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestGet(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const prescriptions = await getPatientPrescriptions(context.env.DB, id);
    if (!prescriptions) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(prescriptions);
  } catch (error) {
    console.error("Failed to fetch prescriptions", error);
    return Response.json({ message: "Could not fetch prescriptions" }, { status: 500 });
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

  try {
    const allowDuplicate = typeof body === "object" && body !== null && "allowDuplicate" in body ? body.allowDuplicate === true : false;
    const input = createPrescriptionSchema.parse(body);
    const result = await createPrescription(context.env.DB, id, input, { allowDuplicate });

    if (result.status === "patient_not_found") {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }
    if (result.status === "medication_not_found") {
      return Response.json(
        {
          message: "Medication not found",
          fieldErrors: {
            medicationId: "Select a valid medication from search results"
          }
        },
        { status: 400 }
      );
    }
    if (result.status === "duplicate") {
      return Response.json(
        {
          message: "Duplicate prescription detected",
          warnings: result.warnings
        },
        { status: 409 }
      );
    }

    return Response.json(result.prescription, { status: 201 });
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
    console.error("Failed to create prescription", error);
    return Response.json({ message: "Could not create prescription" }, { status: 500 });
  }
}
