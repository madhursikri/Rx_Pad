import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatZodErrors } from "@/lib/patient-validation";

const createPatientNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(2000, "Note is too long")
});

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    const notes = await prisma.patientNote.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        note: true,
        createdAt: true
      }
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Failed to load patient notes", error);
    return NextResponse.json({ message: "Could not fetch patient notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Patient id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const result = createPatientNoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        fieldErrors: formatZodErrors(result.error)
      },
      { status: 400 }
    );
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    const created = await prisma.patientNote.create({
      data: {
        patientId: id,
        note: result.data.note
      },
      select: {
        id: true,
        note: true,
        createdAt: true
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient note", error);
    return NextResponse.json({ message: "Could not create patient note" }, { status: 500 });
  }
}
