import { describe, expect, it } from "vitest";
import { createDiagnosisSchema, createPatientDiagnosisSchema } from "@/lib/diagnosis-validation";

describe("diagnosis validation", () => {
  it("normalizes diagnosis dataset fields", () => {
    const parsed = createDiagnosisSchema.parse({
      name: "  Acute pharyngitis  ",
      description: "  Sore throat with or without fever.  "
    });

    expect(parsed).toEqual({
      name: "Acute pharyngitis",
      description: "Sore throat with or without fever."
    });
  });

  it("requires a diagnosis id when linking a diagnosis to a patient", () => {
    expect(() => createPatientDiagnosisSchema.parse({ diagnosisId: "" })).toThrow();
  });
});
