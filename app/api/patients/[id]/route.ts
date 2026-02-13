import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
