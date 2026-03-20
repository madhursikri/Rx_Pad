import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const events = await prisma.patientEvent.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        details: true,
        createdAt: true
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to load patient events", error);
    return NextResponse.json({ message: "Could not fetch patient events" }, { status: 500 });
  }
}
