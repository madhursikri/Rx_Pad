import { describe, expect, it } from "vitest";
import { createMedicationSchema } from "@/lib/medication-validation";

describe("medication validation", () => {
  it("trims and normalizes medication fields", () => {
    const parsed = createMedicationSchema.parse({
      name: "  Amoxicillin ",
      commonStrengths: " 250 mg, 500 mg ",
      defaultDose: " 1 capsule ",
      defaultFrequency: " Three times daily ",
      defaultDuration: " 7 days ",
      defaultInstructions: " Take after food "
    });

    expect(parsed).toEqual({
      name: "Amoxicillin",
      commonStrengths: "250 mg, 500 mg",
      defaultDose: "1 capsule",
      defaultFrequency: "Three times daily",
      defaultDuration: "7 days",
      defaultInstructions: "Take after food"
    });
  });

  it("rejects missing required defaults", () => {
    const result = createMedicationSchema.safeParse({
      name: "Amoxicillin",
      commonStrengths: "",
      defaultDose: "",
      defaultFrequency: "",
      defaultDuration: "",
      defaultInstructions: ""
    });

    expect(result.success).toBe(false);
  });
});
