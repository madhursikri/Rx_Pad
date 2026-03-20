import type { PrismaClient } from "@prisma/client";
import type { CreatePatientInput } from "@/lib/patient-validation";

type PatientLookup = {
  patient: {
    findMany: (args: {
      where?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) => Promise<
      Array<{
        id: string;
        firstName: string;
        lastName: string;
        dob: Date;
        phone: string | null;
        phoneE164: string | null;
      }>
    >;
  };
};

type PatientSnapshot = {
  firstName: string;
  lastName: string;
  dob: Date;
  gender: CreatePatientInput["gender"];
  phoneCountryCode: string | null;
  phone: string | null;
  phoneE164: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
};

export function describePatientChanges(before: PatientSnapshot, after: PatientSnapshot): string[] {
  const changes: string[] = [];

  if (before.firstName !== after.firstName || before.lastName !== after.lastName) {
    changes.push("name");
  }
  if (before.dob.toISOString() !== after.dob.toISOString()) {
    changes.push("date of birth");
  }
  if (before.gender !== after.gender) {
    changes.push("gender");
  }
  if (before.phoneCountryCode !== after.phoneCountryCode || before.phone !== after.phone) {
    changes.push("phone");
  }
  if (before.email !== after.email) {
    changes.push("email");
  }
  if (before.addressLine1 !== after.addressLine1 || before.addressLine2 !== after.addressLine2) {
    changes.push("address");
  }
  if (before.city !== after.city || before.state !== after.state || before.postalCode !== after.postalCode) {
    changes.push("location");
  }
  if (before.notes !== after.notes) {
    changes.push("notes");
  }

  return changes;
}

export async function findDuplicatePatientWarnings(
  prisma: PatientLookup,
  input: Pick<CreatePatientInput, "firstName" | "lastName" | "dob" | "phoneCountryCode" | "phone" | "phoneE164">,
  excludePatientId?: string
): Promise<string[]> {
  const where: Record<string, unknown> = {
    id: excludePatientId ? { not: excludePatientId } : undefined,
    OR: [
      {
        AND: [
          { firstName: input.firstName },
          { lastName: input.lastName },
          { dob: input.dob }
        ]
      }
    ]
  };

  if (input.phone) {
    (where.OR as Array<Record<string, unknown>>).push({
      phone: input.phone
    });
  }

  if (input.phoneE164) {
    (where.OR as Array<Record<string, unknown>>).push({
      phoneE164: input.phoneE164
    });
  }

  const matches = await prisma.patient.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dob: true,
      phone: true,
      phoneE164: true
    }
  });

  const warnings: string[] = [];
  const sameNameDob = matches.some(
    (match) =>
      match.firstName === input.firstName &&
      match.lastName === input.lastName &&
      match.dob.toISOString() === input.dob.toISOString()
  );
  const samePhone = Boolean(
    input.phoneE164 &&
      matches.some((match) => match.phoneE164 === input.phoneE164 || match.phone === input.phone)
  );

  if (sameNameDob) {
    warnings.push("A patient with the same name and date of birth already exists.");
  }
  if (samePhone) {
    warnings.push("A patient with the same phone number already exists.");
  }

  return warnings;
}

export async function findPatientById(prisma: PrismaClient, id: string) {
  return prisma.patient.findUnique({
    where: { id }
  });
}
