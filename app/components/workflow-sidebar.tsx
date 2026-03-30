"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkflowNavigation } from "@/app/components/workflow-navigation-provider";

const workflowLinks = [
  {
    href: "/patients/new",
    label: "Add Patient",
    description: "Register a new patient"
  },
  {
    href: "/patients",
    label: "Search Patients",
    description: "Open an existing chart"
  },
  {
    href: "/prescription-dataset",
    label: "Prescription Dataset",
    description: "Manage medication presets"
  }
];

function isLinkMatch(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkflowSidebar() {
  const pathname = usePathname();
  const { getSearchPatientsAction } = useWorkflowNavigation();
  const activeHref =
    workflowLinks
      .filter((link) => isLinkMatch(pathname, link.href))
      .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? null;

  return (
    <aside className="app-sidebar" aria-label="Workflow navigation">
      <Link
        href="/"
        className={pathname === "/" ? "sidebar-brand sidebar-brand-link active" : "sidebar-brand sidebar-brand-link"}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        <span>Rx Pad</span>
        <small>Clinical Workspace</small>
      </Link>

      <div className="sidebar-section">
        <p className="sidebar-heading">Workflows</p>
        <nav className="sidebar-nav">
          {workflowLinks.map((link) => {
            const active = activeHref === link.href;
            const isSearchPatients = link.href === "/patients";

            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "sidebar-link active" : "sidebar-link"}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (!isSearchPatients) return;
                  const searchPatientsAction = getSearchPatientsAction();
                  if (!searchPatientsAction) return;
                  event.preventDefault();
                  searchPatientsAction();
                }}
              >
                <span>{link.label}</span>
                <small>{link.description}</small>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
