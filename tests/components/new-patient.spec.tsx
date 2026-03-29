import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import NewPatientPage from "@/app/patients/new/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

describe("new patient page", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("submits a patient and redirects to search with the created id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ id: "patient-jada", warnings: ["Check insurance"] }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    const user = userEvent.setup();
    render(<NewPatientPage />);

    await user.type(screen.getByLabelText(/first name/i), "Jada");
    await user.type(screen.getByLabelText(/last name/i), "Ng");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-02");
    await user.type(screen.getByLabelText(/phone/i), "4155550100");
    await user.type(screen.getByLabelText(/email/i), "jada@example.test");
    await user.type(screen.getByLabelText(/^notes$/i), "Created in test");

    await user.click(screen.getByRole("button", { name: /save patient/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/patients?created=patient-jada&warning=Check%20insurance"));
  });

  it("shows server field errors on validation failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "Validation failed", fieldErrors: { firstName: "First name is required" } }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    const user = userEvent.setup();
    render(<NewPatientPage />);

    await user.click(screen.getByRole("button", { name: /save patient/i }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Validation failed")).toBeInTheDocument();
  });
});
