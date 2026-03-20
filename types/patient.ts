export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type PatientSummary = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  phoneCountryCode: string | null;
  phone: string | null;
  updatedAt: string;
};

export type PatientDetail = PatientSummary & {
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  notes: string | null;
  createdAt: string;
};

export type MedicationOption = {
  id: string;
  name: string;
  commonStrengths: string | null;
  defaultDose: string | null;
  defaultFrequency: string | null;
  defaultDuration: string | null;
  defaultInstructions: string | null;
};

export type PrescriptionRecord = {
  id: string;
  medicationName: string;
  strength: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  isActive: boolean;
  inactivatedAt: string | null;
  createdAt: string;
};

export type PatientNoteRecord = {
  id: string;
  note: string;
  createdAt: string;
};

export type PatientEventRecord = {
  id: string;
  type: string;
  title: string;
  details: string | null;
  createdAt: string;
};
