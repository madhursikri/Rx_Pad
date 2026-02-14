import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createMedicationSchema } from "@/lib/medication-validation";
import { formatZodErrors } from "@/lib/patient-validation";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = query ? 20 : 200;

  try {
    const meds = await prisma.medication.findMany({
      where: query
        ? {
            name: {
              contains: query
            }
          }
        : undefined,
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        commonStrengths: true,
        defaultDose: true,
        defaultFrequency: true,
        defaultDuration: true,
        defaultInstructions: true
      }
    });
    return NextResponse.json(meds);
  } catch (error) {
    console.error("Failed to fetch medications", error);
    return NextResponse.json({ message: "Could not fetch medications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const input = createMedicationSchema.parse(body);

    const existing = await prisma.medication.findUnique({
      where: { name: input.name },
      select: { id: true }
    });
    if (existing) {
      return NextResponse.json(
        {
          message: "Medication already exists",
          fieldErrors: { name: "Medication with this name already exists" }
        },
        { status: 400 }
      );
    }

    const created = await prisma.medication.create({
      data: input
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
    console.error("Failed to create medication", error);
    return NextResponse.json({ message: "Could not create medication" }, { status: 500 });
  }
}
