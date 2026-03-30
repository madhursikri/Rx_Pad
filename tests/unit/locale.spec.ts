import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  detectLocale,
  formatAgeFromDob,
  formatDate,
  formatDateTime,
  formatGenderLabel,
  formatPatientPhone,
  getLocaleRegion,
  getDobInputPlaceholder,
  formatDobInputValue,
  normalizeDobInput,
  getTodayDateInputValue,
  toDateInputValue
} from "@/lib/locale";

describe("locale helpers", () => {
  it("detects supported locales from browser region hints", () => {
    expect(detectLocale(null, ["hi-IN"])).toBe("en-IN");
    expect(detectLocale(null, ["en-US"])).toBe("en-US");
    expect(detectLocale("en-IN", ["en-US"])).toBe("en-IN");
  });

  it("formats dates and timestamps with the requested locale", () => {
    expect(formatDate("1988-04-12T00:00:00.000Z", "en-US")).toBe("Apr 12, 1988");
    expect(formatDate("1988-04-12T00:00:00.000Z", "en-IN")).toBe("12 Apr 1988");
    expect(formatDateTime("2026-03-18T10:45:00.000Z", "en-US")).toContain("Mar");
    expect(formatDateTime("2026-03-18T10:45:00.000Z", "en-IN")).toContain("Mar");
  });

  it("formats age and phone numbers for the clinic regions", () => {
    expect(formatAgeFromDob("1988-04-12", "en-US")).toMatch(/^\d+$/);
    expect(formatPatientPhone("+1", "4155550188")).toBe("+1 (415) 555-0188");
    expect(formatPatientPhone("+91", "9876543210")).toBe("+91 98765 43210");
  });

  it("normalizes date input values and labels", () => {
    expect(toDateInputValue("1988-04-12T00:00:00.000Z")).toBe("1988-04-12");
    expect(getTodayDateInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getDobInputPlaceholder("en-US")).toBe("MM/DD/YYYY");
    expect(getDobInputPlaceholder("en-IN")).toBe("DD/MM/YYYY");
    expect(formatDobInputValue("1988-04-12T00:00:00.000Z", "en-IN")).toBe("12/04/1988");
    expect(normalizeDobInput("12/04/1988", "en-IN")).toBe("1988-04-12");
    expect(formatGenderLabel("prefer_not_to_say")).toBe("Prefer Not To Say");
    expect(getLocaleRegion(DEFAULT_LOCALE)).toBe("US");
    expect(getLocaleRegion("en-IN")).toBe("IN");
  });
});
