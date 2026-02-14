import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createMedicationSchema } from "@/lib/medication-validation";
import { formatZodErrors } from "@/lib/patient-validation";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Medication id is required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const input = createMedicationSchema.parse(body);

    const existing = await prisma.medication.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: "Medication not found" }, { status: 404 });
    }

    const duplicate = await prisma.medication.findFirst({
      where: {
        name: input.name,
        id: { not: id }
      },
      select: { id: true }
    });
    if (duplicate) {
      return NextResponse.json(
        {
          message: "Medication already exists",
          fieldErrors: { name: "Medication with this name already exists" }
        },
        { status: 400 }
      );
    }

    const updated = await prisma.medication.update({
      where: { id },
      data: input
    });

    return NextResponse.json(updated);
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
    console.error("Failed to update medication", error);
    return NextResponse.json({ message: "Could not update medication" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Medication id is required" }, { status: 400 });
  }

  try {
    const existing = await prisma.medication.findUnique({
      where: { id },
      select: { id: true, name: true }
    });
    if (!existing) {
      return NextResponse.json({ message: "Medication not found" }, { status: 404 });
    }

    await prisma.medication.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        {
          message: "Cannot delete medication because it is already used in patient prescriptions."
        },
        { status: 409 }
      );
    }

    console.error("Failed to delete medication", error);
    return NextResponse.json({ message: "Could not delete medication" }, { status: 500 });
  }
}
