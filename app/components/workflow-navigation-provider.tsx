"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

type WorkflowNavigationContextValue = {
  getSearchPatientsAction: () => (() => void) | null;
  registerSearchPatientsAction: (action: (() => void) | null) => void;
};

const WorkflowNavigationContext = createContext<WorkflowNavigationContextValue | null>(null);

export function WorkflowNavigationProvider({ children }: { children: ReactNode }) {
  const searchPatientsActionRef = useRef<(() => void) | null>(null);

  const value = useMemo<WorkflowNavigationContextValue>(
    () => ({
      getSearchPatientsAction: () => searchPatientsActionRef.current,
      registerSearchPatientsAction: (action) => {
        searchPatientsActionRef.current = action;
      }
    }),
    []
  );

  return <WorkflowNavigationContext.Provider value={value}>{children}</WorkflowNavigationContext.Provider>;
}

export function useWorkflowNavigation() {
  const context = useContext(WorkflowNavigationContext);

  if (!context) {
    throw new Error("useWorkflowNavigation must be used within a WorkflowNavigationProvider.");
  }

  return context;
}
