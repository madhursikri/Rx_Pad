import { updatePrescriptionStatus } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

export async function onRequestPatch(context: { request: Request; env: Env; params: Record<string, string> }) {
  const { id, prescriptionId } = context.params;
  if (!id || !prescriptionId) {
    return Response.json({ message: "Patient id and prescription id are required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const isActive =
    typeof (body as { isActive?: unknown }).isActive === "boolean" ? (body as { isActive: boolean }).isActive : null;
  if (isActive === null) {
    return Response.json(
      {
        message: "Validation failed",
        fieldErrors: {
          isActive: "isActive must be boolean"
        }
      },
      { status: 400 }
    );
  }

  try {
    const updated = await updatePrescriptionStatus(context.env.DB, id, prescriptionId, isActive);
    if (!updated) {
      return Response.json({ message: "Prescription not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("Failed to update prescription status", error);
    return Response.json({ message: "Could not update prescription status" }, { status: 500 });
  }
}
