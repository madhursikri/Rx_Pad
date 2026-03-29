import { describe, expect, it } from "vitest";
import { normalizeCountryCode, normalizePhone, toDobRange, toNullableTrimmed } from "@/lib/patient-utils";

describe("patient utils", () => {
  it("normalizes phone numbers by stripping punctuation", () => {
    expect(normalizePhone("(415) 555-0188")).toBe("4155550188");
  });

  it("normalizes country codes to a plus-prefixed digit string", () => {
    expect(normalizeCountryCode(" + 971 ")).toBe("+971");
  });

  it("trims nullable text values and converts blanks to null", () => {
    expect(toNullableTrimmed("  hello  ")).toBe("hello");
    expect(toNullableTrimmed("   ")).toBeNull();
    expect(toNullableTrimmed(undefined)).toBeNull();
  });

  it("returns a dob range for valid dates and null for invalid strings", () => {
    const range = toDobRange("1988-04-12");
    expect(range?.gte.toISOString()).toBe("1988-04-12T00:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("1988-04-13T00:00:00.000Z");
    expect(toDobRange("12/31/1988")).toBeNull();
  });
});
