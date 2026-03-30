import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrescriptionDatasetPage from "@/app/prescription-dataset/page";

const medications = [
  {
    id: "med-amoxicillin",
    name: "Amoxicillin",
    commonStrengths: "250 mg, 500 mg",
    defaultDose: "1 capsule",
    defaultFrequency: "Three times daily",
    defaultDuration: "7 days",
    defaultInstructions: "Take after food"
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const number = index + 2;
    return {
      id: `med-${number}`,
      name: `Medication ${number}`,
      commonStrengths: `${number * 10} mg`,
      defaultDose: "1 tablet",
      defaultFrequency: "Once daily",
      defaultDuration: "14 days",
      defaultInstructions: "Take with water"
    };
  })
];

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";

  if (url.includes("/api/medications") && method === "GET") {
    return new Response(JSON.stringify(medications), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.includes("/api/medications") && method === "POST") {
    return new Response(
      JSON.stringify({
        id: "med-hydroxyzine",
        name: "Hydroxyzine",
        commonStrengths: "25 mg",
        defaultDose: "1 tablet",
        defaultFrequency: "Once nightly",
        defaultDuration: "30 days",
        defaultInstructions: "Take at bedtime"
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.includes("/api/medications/med-amoxicillin") && method === "PATCH") {
    return new Response(
      JSON.stringify({
        id: "med-amoxicillin",
        name: "Amoxicillin",
        commonStrengths: "250 mg, 500 mg",
        defaultDose: "1 capsule",
        defaultFrequency: "Three times daily",
        defaultDuration: "7 days",
        defaultInstructions: "Take after food"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.includes("/api/medications/med-amoxicillin") && method === "DELETE") {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ message: "Unexpected request" }), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
});

describe("prescription dataset page", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("adds a dataset entry and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<PrescriptionDatasetPage />);

    expect(await screen.findByText("Amoxicillin")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Amoxicillin"), "Hydroxyzine");
    await user.type(screen.getByLabelText(/common strengths/i), "25 mg");
    await user.click(screen.getByRole("button", { name: /add prescription entry/i }));

    await waitFor(() => expect(screen.getByText("Prescription dataset entry added.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/medications",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("allows deleting an existing dataset entry", async () => {
    const user = userEvent.setup();
    render(<PrescriptionDatasetPage />);

    expect(await screen.findByText("Amoxicillin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /amoxicillin/i }));
    await user.click(screen.getByRole("button", { name: /delete entry/i }));

    await waitFor(() => expect(screen.getByText("Prescription dataset entry deleted.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/medications/med-amoxicillin", expect.objectContaining({ method: "DELETE" }));
  });

  it("paginates dataset entries and stores the page size in session", async () => {
    const user = userEvent.setup();
    render(<PrescriptionDatasetPage />);

    const pageSizeSelect = await screen.findByLabelText(/prescription dataset page size/i);
    expect(pageSizeSelect).toHaveValue("10");

    await user.selectOptions(pageSizeSelect, "5");
    expect(await screen.findByText(/showing 1-5 of 12/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /medication 6/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/showing 6-10 of 12/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /medication 6/i })).toBeInTheDocument();
  });
});
