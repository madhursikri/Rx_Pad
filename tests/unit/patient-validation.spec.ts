import { describe, expect, it } from "vitest";
import { createPatientSchema, formatZodErrors, parseLimit } from "@/lib/patient-validation";

describe("patient validation", () => {
  it("parses and normalizes a valid patient", () => {
    const parsed = createPatientSchema.parse({
      firstName: "  Emma ",
      lastName: " Carter ",
      dob: "1988-04-12",
      gender: "female",
      phoneCountryCode: " +1 ",
      phone: "(415) 555-0188",
      email: " emma@example.test ",
      addressLine1: " 145 Lakeview Ave ",
      addressLine2: "",
      city: " San Francisco ",
      state: " CA ",
      postalCode: " 94107 ",
      notes: "  Seed patient  "
    });

    expect(parsed.firstName).toBe("Emma");
    expect(parsed.phone).toBe("4155550188");
    expect(parsed.phoneCountryCode).toBe("+1");
    expect(parsed.phoneE164).toBe("14155550188");
    expect(parsed.email).toBe("emma@example.test");
    expect(parsed.addressLine2).toBeNull();
  });

  it("rejects invalid phone shapes with field-specific errors", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Emma",
      lastName: "Carter",
      dob: "1988-04-12",
      gender: "female",
      phoneCountryCode: "",
      phone: "12",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      notes: ""
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodErrors(result.error)).toMatchObject({
        phone: "Phone number must have 4-15 digits",
        phoneCountryCode: "Select a country code when entering a phone number"
      });
    }
  });

  it("caps list limits and falls back on invalid values", () => {
    expect(parseLimit(null)).toBe(20);
    expect(parseLimit("5")).toBe(5);
    expect(parseLimit("500")).toBe(50);
    expect(parseLimit("-1")).toBe(20);
    expect(parseLimit("abc")).toBe(20);
  });
});
