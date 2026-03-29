import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("shows the key workflows and help topics", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /simple patient intake/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add new patient/i })).toHaveAttribute("href", "/patients/new");
    expect(screen.getByRole("link", { name: /search patients/i })).toHaveAttribute("href", "/patients");
    expect(screen.getByText("Add a patient")).toBeInTheDocument();
    expect(screen.getByText("Manage medication presets")).toBeInTheDocument();
  });
});
