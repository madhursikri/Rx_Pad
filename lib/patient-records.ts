import type { CreatePatientInput } from "@/lib/patient-validation";

type PatientSnapshot = {
  firstName: string;
  lastName: string;
  dob: Date | string;
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
  if (new Date(before.dob).toISOString() !== new Date(after.dob).toISOString()) {
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
