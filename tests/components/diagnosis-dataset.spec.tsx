import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiagnosisDatasetPage from "@/app/diagnosis-dataset/page";

const diagnoses = [
  {
    id: "diag-acute-pharyngitis",
    name: "Acute pharyngitis",
    description: "Sore throat with or without fever."
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const number = index + 2;
    return {
      id: `diag-${number}`,
      name: `Diagnosis ${number}`,
      description: "Example diagnosis"
    };
  })
];

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";

  if (url.includes("/api/diagnoses") && method === "GET") {
    return new Response(JSON.stringify(diagnoses), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.includes("/api/diagnoses") && method === "POST") {
    return new Response(
      JSON.stringify({
        id: "diag-hypertension",
        name: "Essential hypertension",
        description: "Primary high blood pressure."
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.includes("/api/diagnoses/diag-acute-pharyngitis") && method === "PATCH") {
    return new Response(
      JSON.stringify({
        id: "diag-acute-pharyngitis",
        name: "Acute pharyngitis",
        description: "Sore throat with or without fever."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (url.includes("/api/diagnoses/diag-acute-pharyngitis") && method === "DELETE") {
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

describe("diagnosis dataset page", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("adds a dataset entry and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<DiagnosisDatasetPage />);

    expect(await screen.findByText("Acute pharyngitis")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Type diagnosis name"), "Essential hypertension");
    await user.click(screen.getByRole("button", { name: /add diagnosis entry/i }));

    await waitFor(() => expect(screen.getByText("Diagnosis dataset entry added.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/diagnoses",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("allows deleting an existing dataset entry", async () => {
    const user = userEvent.setup();
    render(<DiagnosisDatasetPage />);

    expect(await screen.findByText("Acute pharyngitis")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /acute pharyngitis/i }));
    await user.click(screen.getByRole("button", { name: /delete entry/i }));

    await waitFor(() => expect(screen.getByText("Diagnosis dataset entry deleted.")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/diagnoses/diag-acute-pharyngitis", expect.objectContaining({ method: "DELETE" }));
  });

  it("paginates dataset entries and stores the page size in session", async () => {
    const user = userEvent.setup();
    render(<DiagnosisDatasetPage />);

    const pageSizeSelect = await screen.findByLabelText(/diagnosis dataset page size/i);
    expect(pageSizeSelect).toHaveValue("10");

    await user.selectOptions(pageSizeSelect, "5");
    expect(await screen.findByText(/showing 1-5 of 12/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /diagnosis 6/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText(/showing 6-10 of 12/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /diagnosis 6/i })).toBeInTheDocument();
  });
});
