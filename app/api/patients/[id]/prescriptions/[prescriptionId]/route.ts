import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; prescriptionId: string }> }
) {
  const { id, prescriptionId } = await context.params;
  if (!id || !prescriptionId) {
    return NextResponse.json({ message: "Patient id and prescription id are required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const isActive = typeof (body as { isActive?: unknown }).isActive === "boolean" ? (body as { isActive: boolean }).isActive : null;
  if (isActive === null) {
    return NextResponse.json(
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
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: id },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ message: "Prescription not found" }, { status: 404 });
    }

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        isActive,
        inactivatedAt: isActive ? null : new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update prescription status", error);
    return NextResponse.json({ message: "Could not update prescription status" }, { status: 500 });
  }
}
