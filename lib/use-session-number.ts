"use client";

import { useEffect, useState } from "react";

export function useSessionNumber(key: string, defaultValue: number) {
  const [value, setValue] = useState(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValue = window.sessionStorage.getItem(key);
    if (storedValue !== null) {
      const parsedValue = Number(storedValue);
      if (Number.isFinite(parsedValue) && parsedValue > 0) {
        setValue(parsedValue);
      }
    }

    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem(key, String(value));
  }, [hydrated, key, value]);

  return [value, setValue] as const;
}
