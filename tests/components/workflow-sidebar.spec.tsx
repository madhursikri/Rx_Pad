import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowNavigationProvider } from "@/app/components/workflow-navigation-provider";
import {
  confirmAndLogout,
  cloudflareAccessLogoutPath,
  cloudflareAccessTeamDomainEnvVar,
  getCloudflareAccessLogoutUrl,
  WorkflowSidebar
} from "@/app/components/workflow-sidebar";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname()
}));

describe("workflow sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("marks the landing brand active on the home page", () => {
    render(
      <WorkflowNavigationProvider>
        <WorkflowSidebar />
      </WorkflowNavigationProvider>
    );

    expect(screen.getByRole("link", { name: /rx pad clinical workspace/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /rx pad clinical workspace/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /diagnosis dataset/i })).toHaveAttribute("href", "/diagnosis-dataset");
  });

  it("renders the logout action in the sidebar footer", () => {
    render(
      <WorkflowNavigationProvider>
        <WorkflowSidebar />
      </WorkflowNavigationProvider>
    );

    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("highlights only the most specific matching workflow", () => {
    mockUsePathname.mockReturnValue("/patients/abc");
    render(
      <WorkflowNavigationProvider>
        <WorkflowSidebar />
      </WorkflowNavigationProvider>
    );

    const searchPatients = screen.getByRole("link", { name: /search patients/i });
    const addPatient = screen.getByRole("link", { name: /add patient/i });

    expect(searchPatients).toHaveAttribute("aria-current", "page");
    expect(addPatient).not.toHaveAttribute("aria-current");
  });

  it("confirms before logging out and redirects through Cloudflare Access", () => {
    const confirmMock = vi.fn(() => true);
    const navigateMock = vi.fn();

    const result = confirmAndLogout(confirmMock, navigateMock, "https://example.test/cdn-cgi/access/logout");

    expect(confirmMock).toHaveBeenCalledWith("Log out of Rx Pad?");
    expect(navigateMock).toHaveBeenCalledWith("https://example.test/cdn-cgi/access/logout");
    expect(result).toBe(true);
  });

  it("does not redirect when logout is cancelled", () => {
    const confirmMock = vi.fn(() => false);
    const navigateMock = vi.fn();

    const result = confirmAndLogout(confirmMock, navigateMock, cloudflareAccessLogoutPath);

    expect(confirmMock).toHaveBeenCalledWith("Log out of Rx Pad?");
    expect(navigateMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it("uses an explicit Cloudflare Access logout URL when configured", () => {
    const configuredTeamDomain = "team.cloudflareaccess.com";
    const previousTeamDomain = process.env[cloudflareAccessTeamDomainEnvVar];

    process.env[cloudflareAccessTeamDomainEnvVar] = configuredTeamDomain;

    try {
      expect(getCloudflareAccessLogoutUrl("https://app.example.test")).toBe(
        "https://team.cloudflareaccess.com/cdn-cgi/access/logout"
      );
    } finally {
      if (previousTeamDomain === undefined) {
        delete process.env[cloudflareAccessTeamDomainEnvVar];
      } else {
        process.env[cloudflareAccessTeamDomainEnvVar] = previousTeamDomain;
      }
    }
  });

  it("accepts a team domain with a protocol and trailing slash", () => {
    const previousTeamDomain = process.env[cloudflareAccessTeamDomainEnvVar];

    process.env[cloudflareAccessTeamDomainEnvVar] = "https://team.cloudflareaccess.com/";

    try {
      expect(getCloudflareAccessLogoutUrl("https://app.example.test")).toBe(
        "https://team.cloudflareaccess.com/cdn-cgi/access/logout"
      );
    } finally {
      if (previousTeamDomain === undefined) {
        delete process.env[cloudflareAccessTeamDomainEnvVar];
      } else {
        process.env[cloudflareAccessTeamDomainEnvVar] = previousTeamDomain;
      }
    }
  });
});
