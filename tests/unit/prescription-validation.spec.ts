import { describe, expect, it } from "vitest";
import { createPrescriptionSchema } from "@/lib/prescription-validation";

describe("prescription validation", () => {
  it("trims prescription fields and converts empty instructions to null", () => {
    const parsed = createPrescriptionSchema.parse({
      medicationId: " med-amoxicillin ",
      strength: " 500 mg ",
      dose: " 1 capsule ",
      frequency: " Three times daily ",
      duration: " 7 days ",
      instructions: " "
    });

    expect(parsed).toEqual({
      medicationId: "med-amoxicillin",
      strength: "500 mg",
      dose: "1 capsule",
      frequency: "Three times daily",
      duration: "7 days",
      instructions: null
    });
  });
});
