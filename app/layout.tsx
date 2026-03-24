import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { WorkflowSidebar } from "@/app/components/workflow-sidebar";
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
          <WorkflowSidebar />
          <main className="app-main">
            <div className="page-content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
