import { z } from "zod";
import { formatZodErrors } from "@/lib/patient-validation";
import { createPatientNote, getPatientNotes } from "@/lib/cloudflare-repo";

type Env = {
  DB: D1Database;
};

const createPatientNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(2000, "Note is too long")
});

export async function onRequestGet(context: { env: Env; params: Record<string, string> }) {
  const id = context.params.id;
  if (!id) {
    return Response.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const notes = await getPatientNotes(context.env.DB, id);
    if (!notes) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(notes);
  } catch (error) {
    console.error("Failed to load patient notes", error);
    return Response.json({ message: "Could not fetch patient notes" }, { status: 500 });
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

  const result = createPatientNoteSchema.safeParse(body);
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
    const created = await createPatientNote(context.env.DB, id, result.data.note);
    if (!created) {
      return Response.json({ message: "Patient not found" }, { status: 404 });
    }

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient note", error);
    return Response.json({ message: "Could not create patient note" }, { status: 500 });
  }
}
