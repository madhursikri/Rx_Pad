import { z } from "zod";
import { normalizeCountryCode, normalizePhone, toNullableTrimmed } from "@/lib/patient-utils";

const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);

const optionalTextField = z.string().optional().or(z.literal(""));

export const createPatientSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
      .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime())) return false;
        return parsed <= new Date();
      }, "Date of birth cannot be in the future"),
    gender: genderSchema,
    phoneCountryCode: optionalTextField,
    phone: optionalTextField,
    email: optionalTextField,
    addressLine1: optionalTextField,
    addressLine2: optionalTextField,
    city: optionalTextField,
    state: optionalTextField,
    postalCode: optionalTextField,
    notes: optionalTextField
  })
  .superRefine((data, ctx) => {
    const hasPhone = !!data.phone && data.phone.trim().length > 0;
    const hasCode = !!data.phoneCountryCode && data.phoneCountryCode.trim().length > 0;

    if (!hasPhone && hasCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Enter a phone number when selecting a country code"
      });
      return;
    }

    if (!hasPhone) return;

    const normalizedPhone = normalizePhone(data.phone ?? "");
    if (normalizedPhone.length < 4 || normalizedPhone.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Phone number must have 4-15 digits"
      });
    }

    if (!hasCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneCountryCode"],
        message: "Select a country code when entering a phone number"
      });
      return;
    }

    const normalizedCode = normalizeCountryCode(data.phoneCountryCode ?? "");
    if (!/^\+\d{1,4}$/.test(normalizedCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneCountryCode"],
        message: "Country code must be in +<digits> format"
      });
    }
  })
  .transform((data) => {
    const normalizedPhone = data.phone ? normalizePhone(data.phone) : "";
    const normalizedCode = data.phoneCountryCode ? normalizeCountryCode(data.phoneCountryCode) : "";
    const hasPhone = normalizedPhone.length > 0;

    return {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dob: new Date(`${data.dob}T00:00:00.000Z`),
      gender: data.gender,
      phoneCountryCode: hasPhone ? normalizedCode : null,
      phone: hasPhone ? normalizedPhone : null,
      phoneE164: hasPhone ? `${normalizePhone(normalizedCode)}${normalizedPhone}` : null,
      email: toNullableTrimmed(data.email),
      addressLine1: toNullableTrimmed(data.addressLine1),
      addressLine2: toNullableTrimmed(data.addressLine2),
      city: toNullableTrimmed(data.city),
      state: toNullableTrimmed(data.state),
      postalCode: toNullableTrimmed(data.postalCode),
      notes: toNullableTrimmed(data.notes)
    };
  });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function parseLimit(rawLimit: string | null): number {
  const fallback = 20;
  if (!rawLimit) return fallback;
  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 50);
}
