import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createPrescriptionSchema } from "@/lib/prescription-validation";
import { formatZodErrors } from "@/lib/patient-validation";

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

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        medicationName: true,
        strength: true,
        dose: true,
        frequency: true,
        duration: true,
        instructions: true,
        isActive: true,
        inactivatedAt: true,
        createdAt: true
      }
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Failed to fetch prescriptions", error);
    return NextResponse.json({ message: "Could not fetch prescriptions" }, { status: 500 });
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

  try {
    const input = createPrescriptionSchema.parse(body);

    const [patient, medication] = await Promise.all([
      prisma.patient.findUnique({ where: { id }, select: { id: true } }),
      prisma.medication.findUnique({ where: { id: input.medicationId }, select: { id: true, name: true } })
    ]);

    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    if (!medication) {
      return NextResponse.json(
        {
          message: "Medication not found",
          fieldErrors: {
            medicationId: "Select a valid medication from search results"
          }
        },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          patientId: id,
          medicationId: medication.id,
          medicationName: medication.name,
          strength: input.strength,
          dose: input.dose,
          frequency: input.frequency,
          duration: input.duration,
          instructions: input.instructions,
          isActive: true,
          inactivatedAt: null
        }
      });

      await tx.patientEvent.create({
        data: {
          patientId: id,
          type: "PRESCRIPTION_CREATED",
          title: "Prescription added",
          details: `${medication.name} ${input.strength} added.`
        }
      });

      return prescription;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Validation failed",
          fieldErrors: formatZodErrors(error)
        },
        { status: 400 }
      );
    }
    console.error("Failed to create prescription", error);
    return NextResponse.json({ message: "Could not create prescription" }, { status: 500 });
  }
}
