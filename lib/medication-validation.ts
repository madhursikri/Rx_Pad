import { z } from "zod";
import { toNullableTrimmed } from "@/lib/patient-utils";

export const createMedicationSchema = z
  .object({
    name: z.string().trim().min(1, "Medication name is required").max(120),
    commonStrengths: z.string().optional().or(z.literal("")),
    defaultDose: z.string().trim().min(1, "Default dose is required").max(120),
    defaultFrequency: z.string().trim().min(1, "Default frequency is required").max(120),
    defaultDuration: z.string().trim().min(1, "Default duration is required").max(120),
    defaultInstructions: z.string().optional().or(z.literal(""))
  })
  .transform((data) => ({
    name: data.name.trim(),
    commonStrengths: toNullableTrimmed(data.commonStrengths),
    defaultDose: data.defaultDose.trim(),
    defaultFrequency: data.defaultFrequency.trim(),
    defaultDuration: data.defaultDuration.trim(),
    defaultInstructions: toNullableTrimmed(data.defaultInstructions)
  }));

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
