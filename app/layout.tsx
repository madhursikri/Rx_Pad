import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Rx_Pad",
  description: "Local clinic patient intake and search"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <header className="site-header">
          <div className="shell header-row">
            <Link href="/" className="brand">
              <span>Rx_Pad</span>
              <small>Clinical Workspace</small>
            </Link>
            <nav className="top-nav" aria-label="Primary">
              <Link href="/patients/new">Add Patient</Link>
              <Link href="/patients">Search Patients</Link>
            </nav>
          </div>
        </header>
        <main className="shell page-content">{children}</main>
      </body>
    </html>
  );
}
