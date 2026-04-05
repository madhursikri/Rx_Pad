import { z } from "zod";
import { toNullableTrimmed } from "@/lib/patient-utils";

export const createDiagnosisSchema = z
  .object({
    name: z.string().trim().min(1, "Diagnosis name is required").max(160),
    description: z.string().optional().or(z.literal(""))
  })
  .transform((data) => ({
    name: data.name.trim(),
    description: toNullableTrimmed(data.description)
  }));

export const createPatientDiagnosisSchema = z.object({
  diagnosisId: z.string().trim().min(1, "Diagnosis is required")
});

export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;
export type CreatePatientDiagnosisInput = z.infer<typeof createPatientDiagnosisSchema>;
