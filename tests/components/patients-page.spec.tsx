import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowNavigationProvider } from "@/app/components/workflow-navigation-provider";
import { WorkflowSidebar } from "@/app/components/workflow-sidebar";
import SearchPatientsPage from "@/app/patients/page";

const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/patients",
  useSearchParams: () => searchParams
}));

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

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";

  if (url.includes("/api/patients?query=") && method === "GET") {
    return new Response(
      JSON.stringify([
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
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.endsWith(`/api/patients/${patient.id}`) && method === "GET") {
    return new Response(JSON.stringify(patient), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (url.endsWith(`/api/patients/${patient.id}/prescriptions`) && method === "GET") {
    return new Response(
      JSON.stringify([
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
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.endsWith(`/api/patients/${patient.id}/notes`) && method === "GET") {
    return new Response(
      JSON.stringify([{ id: "note-1", note: "Patient reports sore throat.", createdAt: "2026-03-10T09:00:00.000Z" }]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.endsWith(`/api/patients/${patient.id}/events`) && method === "GET") {
    return new Response(
      JSON.stringify([
        {
          id: "event-1",
          type: "PATIENT_CREATED",
          title: "Patient created",
          details: "Created seeded test patient.",
          createdAt: "2026-03-02T09:00:00.000Z"
        }
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.includes("/api/medications?query=Amoxicillin") && method === "GET") {
    return new Response(
      JSON.stringify([
        {
          id: "med-amoxicillin",
          name: "Amoxicillin",
          commonStrengths: "250 mg, 500 mg",
          defaultDose: "1 capsule",
          defaultFrequency: "Three times daily",
          defaultDuration: "7 days",
          defaultInstructions: "Take after food"
        }
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.endsWith(`/api/patients/${patient.id}/prescriptions`) && method === "POST") {
    const body = JSON.parse(String(init?.body ?? "{}")) as { allowDuplicate?: boolean };
    if (!body.allowDuplicate) {
      return new Response(
        JSON.stringify({
          message: "Duplicate prescription detected",
          warnings: ["This patient already has an active prescription."]
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
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
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.endsWith(`/api/patients/${patient.id}`) && method === "PATCH") {
    const body = JSON.parse(String(init?.body ?? "{}")) as typeof patient;
    return new Response(
      JSON.stringify({
        ...patient,
        ...body,
        updatedAt: new Date().toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ message: `Unexpected request: ${method} ${url}` }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
});

describe("patients page", () => {
  beforeEach(() => {
    searchParams.forEach((_, key) => searchParams.delete(key));
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("loads a patient and completes the duplicate-prescription confirm flow", async () => {
    const user = userEvent.setup();
    render(
      <WorkflowNavigationProvider>
        <SearchPatientsPage />
      </WorkflowNavigationProvider>
    );

    expect(await screen.findByRole("button", { name: /open emma carter/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open emma carter/i }));
    expect(await screen.findByRole("heading", { name: /patient overview/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add new prescription/i }));
    const addSection = document.getElementById("add-prescription");
    expect(addSection).toBeTruthy();
    await user.type(within(addSection!).getByLabelText(/search medication/i), "Amoxicillin");
    const medicationOption = await within(addSection!).findByRole("button", { name: /amoxicillin/i });
    await user.click(medicationOption);
    await user.click(screen.getByRole("button", { name: /add prescription/i }));

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => expect(screen.getByText("Prescription added successfully.")).toBeInTheDocument());
    expect(screen.queryByText(/add prescription/i)).not.toBeInTheDocument();
  });

  it("prompts before leaving a dirty patient chart from the sidebar", async () => {
    const user = userEvent.setup();
    render(
      <WorkflowNavigationProvider>
        <WorkflowSidebar />
        <SearchPatientsPage />
      </WorkflowNavigationProvider>
    );

    expect(await screen.findByRole("button", { name: /open emma carter/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /open emma carter/i }));
    expect(await screen.findByRole("heading", { name: /patient overview/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit patient/i }));
    const firstNameInput = screen.getByLabelText("First Name");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Emmy");

    await user.click(screen.getByRole("link", { name: /search patients/i }));
    expect(await screen.findByRole("dialog", { name: /unsaved changes/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue editing/i }));
    expect(screen.getByLabelText("First Name")).toHaveValue("Emmy");

    await user.click(screen.getByRole("link", { name: /search patients/i }));
    await user.click(screen.getByRole("button", { name: /discard changes/i }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: /patient overview/i })).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: /open emma carter/i })).toBeInTheDocument();
  });
});
