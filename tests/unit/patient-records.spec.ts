import { describe, expect, it } from "vitest";
import { describePatientChanges } from "@/lib/patient-records";

describe("patient records", () => {
  it("describes changed fields in a stable order", () => {
    const changes = describePatientChanges(
      {
        firstName: "Emma",
        lastName: "Carter",
        dob: "1988-04-12",
        gender: "female",
        phoneCountryCode: "+1",
        phone: "4155550188",
        phoneE164: "+14155550188",
        email: "emma@example.test",
        addressLine1: "145 Lakeview Ave",
        addressLine2: null,
        city: "San Francisco",
        state: "CA",
        postalCode: "94107",
        notes: "Old note"
      },
      {
        firstName: "Emma",
        lastName: "Carter",
        dob: "1988-04-13",
        gender: "other",
        phoneCountryCode: "+44",
        phone: "7700900123",
        phoneE164: "+447700900123",
        email: "new@example.test",
        addressLine1: "145 Lakeview Ave",
        addressLine2: "Apt 2",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        notes: "New note"
      }
    );

    expect(changes).toEqual(["date of birth", "gender", "phone", "email", "address", "location", "notes"]);
  });
});
