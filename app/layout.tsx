import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Rx Pad",
  description: "Local-first patient intake, search, prescriptions, and notes for a small practice."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable}`}>
        <div className="app-shell">
          <aside className="app-sidebar" aria-label="Primary">
            <div className="sidebar-brand">
              <span>Rx Pad</span>
              <small>Clinical Workspace</small>
            </div>
            <nav className="sidebar-nav">
              <Link href="/">Dashboard</Link>
              <Link href="/patients/new">Add Patient</Link>
              <Link href="/patients">Search Patients</Link>
              <Link href="/prescription-dataset">Prescription Dataset</Link>
            </nav>
          </aside>
          <main className="app-main">
            <div className="page-content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
