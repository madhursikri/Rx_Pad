import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPatientSchema, formatZodErrors } from "@/lib/patient-validation";
import { describePatientChanges, findDuplicatePatientWarnings } from "@/lib/patient-records";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Patient id is required" }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Failed to load patient", error);
    return NextResponse.json({ message: "Could not fetch patient" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
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

  try {
    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          fieldErrors: formatZodErrors(result.error)
        },
        { status: 400 }
      );
    }

    const existing = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    const warnings = await findDuplicatePatientWarnings(prisma, result.data, id);
    const changes = describePatientChanges(
      {
        firstName: existing.firstName,
        lastName: existing.lastName,
        dob: existing.dob,
        gender: existing.gender,
        phoneCountryCode: existing.phoneCountryCode,
        phone: existing.phone,
        phoneE164: existing.phoneE164,
        email: existing.email,
        addressLine1: existing.addressLine1,
        addressLine2: existing.addressLine2,
        city: existing.city,
        state: existing.state,
        postalCode: existing.postalCode,
        notes: existing.notes
      },
      result.data
    );

    const updated = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.update({
        where: { id },
        data: result.data
      });

      await tx.patientEvent.create({
        data: {
          patientId: id,
          type: "PATIENT_UPDATED",
          title: "Patient updated",
          details: changes.length > 0 ? `Changed fields: ${changes.join(", ")}.` : "Saved patient record."
        }
      });

      return patient;
    });

    return NextResponse.json({ ...updated, warnings });
  } catch (error) {
    console.error("Failed to update patient", error);
    return NextResponse.json({ message: "Could not update patient" }, { status: 500 });
  }
}
