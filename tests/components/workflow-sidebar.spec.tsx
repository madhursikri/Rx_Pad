import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowSidebar } from "@/app/components/workflow-sidebar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname()
}));

describe("workflow sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("marks the landing brand active on the home page", () => {
    render(<WorkflowSidebar />);

    expect(screen.getByRole("link", { name: /rx pad clinical workspace/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /rx pad clinical workspace/i })).toHaveAttribute("aria-current", "page");
  });

  it("highlights only the most specific matching workflow", () => {
    mockUsePathname.mockReturnValue("/patients/abc");
    render(<WorkflowSidebar />);

    const searchPatients = screen.getByRole("link", { name: /search patients/i });
    const addPatient = screen.getByRole("link", { name: /add patient/i });

    expect(searchPatients).toHaveAttribute("aria-current", "page");
    expect(addPatient).not.toHaveAttribute("aria-current");
  });
});
