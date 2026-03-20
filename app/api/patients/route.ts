import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPatientSchema, formatZodErrors, parseLimit } from "@/lib/patient-validation";
import { normalizePhone, toDobRange } from "@/lib/patient-utils";
import { findDuplicatePatientWarnings } from "@/lib/patient-records";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

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

  try {
    const warnings = await findDuplicatePatientWarnings(prisma, result.data);
    const created = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: result.data
      });

      await tx.patientEvent.create({
        data: {
          patientId: patient.id,
          type: "PATIENT_CREATED",
          title: "Patient created",
          details: "Created a new patient record."
        }
      });

      return patient;
    });
    return NextResponse.json({ ...created, warnings }, { status: 201 });
  } catch (error) {
    console.error("Failed to create patient", error);
    return NextResponse.json({ message: "Could not create patient" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("query")?.trim() ?? "";
  const limit = parseLimit(url.searchParams.get("limit"));

  try {
    if (!query) {
      const recent = await prisma.patient.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          phoneCountryCode: true,
          phone: true,
          updatedAt: true
        }
      });
      return NextResponse.json(recent);
    }

    const where: Prisma.PatientWhereInput = {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } }
      ]
    };

    const parts = query.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts.slice(1).join(" ");
      where.OR?.push({
        AND: [{ firstName: { contains: first } }, { lastName: { contains: last } }]
      });
      where.OR?.push({
        AND: [{ firstName: { contains: last } }, { lastName: { contains: first } }]
      });
    }

    const phoneDigits = normalizePhone(query);
    if (phoneDigits.length >= 3) {
      where.OR?.push({ phone: { contains: phoneDigits } });
      where.OR?.push({ phoneE164: { contains: phoneDigits } });
    }

    const dobRange = toDobRange(query);
    if (dobRange) {
      where.OR?.push({ dob: { gte: dobRange.gte, lt: dobRange.lt } });
    }

    const found = await prisma.patient.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true,
        phoneCountryCode: true,
        phone: true,
        updatedAt: true
      }
    });

    return NextResponse.json(found);
  } catch (error) {
    console.error("Failed to search patients", error);
    return NextResponse.json({ message: "Could not fetch patients" }, { status: 500 });
  }
}
