import { test, expect } from "@playwright/test";

const patient = {
  id: "patient-emma-carter",
  firstName: "Emma",
  lastName: "Carter",
  dob: "1988-04-12T00:00:00.000Z",
  gender: "female",
  phoneCountryCode: "+1",
  phone: "4155550188",
  updatedAt: "2026-03-18T10:45:00.000Z",
  email: "emma.carter@example.test",
  addressLine1: "145 Lakeview Ave",
  addressLine2: null,
  city: "San Francisco",
  state: "CA",
  postalCode: "94107",
  notes: "Test patient with active and inactive prescriptions.",
  createdAt: "2026-03-02T09:00:00.000Z"
};

test("home page exposes workflows and links into search", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /simple patient intake/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search Patients", exact: true })).toHaveAttribute("href", "/patients");
  await page.getByRole("link", { name: "Search Patients", exact: true }).click();
  await expect(page).toHaveURL(/\/patients$/);
});

test("patient workflow can load a patient and add a duplicate prescription", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname === "/api/patients" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dob: patient.dob,
            gender: patient.gender,
            phoneCountryCode: patient.phoneCountryCode,
            phone: patient.phone,
            updatedAt: patient.updatedAt
          }
        ])
      });
      return;
    }

    if (url.pathname === `/api/patients/${patient.id}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(patient)
      });
      return;
    }

    if (url.pathname === `/api/patients/${patient.id}/prescriptions` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "rx-emma-amoxicillin",
            medicationName: "Amoxicillin",
            strength: "500 mg",
            dose: "1 capsule",
            frequency: "Three times daily",
            duration: "7 days",
            instructions: "Finish the full course.",
            isActive: true,
            inactivatedAt: null,
            createdAt: "2026-03-10T09:30:00.000Z"
          }
        ])
      });
      return;
    }

    if (url.pathname === `/api/patients/${patient.id}/notes` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "note-1", note: "Patient reports sore throat.", createdAt: "2026-03-10T09:00:00.000Z" }])
      });
      return;
    }

    if (url.pathname === `/api/patients/${patient.id}/events` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "event-1", type: "PATIENT_CREATED", title: "Patient created", details: "Created seeded test patient.", createdAt: "2026-03-02T09:00:00.000Z" }
        ])
      });
      return;
    }

    if (url.pathname === "/api/medications" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "med-amoxicillin",
            name: "Amoxicillin",
            commonStrengths: "250 mg, 500 mg",
            defaultDose: "1 capsule",
            defaultFrequency: "Three times daily",
            defaultDuration: "7 days",
            defaultInstructions: "Take after food"
          }
        ])
      });
      return;
    }

    if (url.pathname === `/api/patients/${patient.id}/prescriptions` && method === "POST") {
      const body = JSON.parse(request.postData() ?? "{}") as { allowDuplicate?: boolean };
      if (!body.allowDuplicate) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Duplicate prescription detected",
            warnings: ["This patient already has an active prescription."]
          })
        });
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rx-new",
          medicationName: "Amoxicillin",
          strength: "500 mg",
          dose: "1 capsule",
          frequency: "Three times daily",
          duration: "7 days",
          instructions: "Finish the full course.",
          isActive: true,
          inactivatedAt: null,
          createdAt: new Date().toISOString()
        })
      });
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: `Unexpected request: ${method} ${url.pathname}` })
    });
  });

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("/patients");
  await expect(page.getByRole("button", { name: /open emma carter/i })).toBeVisible();
  await page.getByRole("button", { name: /open emma carter/i }).click();
  await expect(page.getByRole("heading", { name: /patient overview/i })).toBeVisible();

  await page.getByRole("button", { name: /add new prescription/i }).click();
  await page.getByLabel("Search Medication").fill("Amoxicillin");
  await page.getByRole("button", { name: /amoxicillin/i }).click();
  await page.getByRole("button", { name: /^add prescription$/i }).click();

  await expect(page.getByText(/prescription added successfully/i)).toBeVisible();
});
