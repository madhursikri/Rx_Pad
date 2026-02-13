import { z } from "zod";
import { toNullableTrimmed } from "@/lib/patient-utils";

export const createPrescriptionSchema = z
  .object({
    medicationId: z.string().trim().min(1, "Medication is required"),
    strength: z.string().trim().min(1, "Strength is required").max(80),
    dose: z.string().trim().min(1, "Dose is required").max(120),
    frequency: z.string().trim().min(1, "Frequency is required").max(120),
    duration: z.string().trim().min(1, "Duration is required").max(120),
    instructions: z.string().optional().or(z.literal(""))
  })
  .transform((data) => ({
    medicationId: data.medicationId.trim(),
    strength: data.strength.trim(),
    dose: data.dose.trim(),
    frequency: data.frequency.trim(),
    duration: data.duration.trim(),
    instructions: toNullableTrimmed(data.instructions)
  }));

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
