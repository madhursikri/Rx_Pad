"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  detectLocale,
  formatDate,
  formatDateTime,
  formatAgeFromDob,
  formatGenderLabel,
  formatPatientPhone,
  getLocaleRegion,
  LOCALE_STORAGE_KEY,
  toDateInputValue,
  type SupportedLocale
} from "@/lib/locale";

type LocaleContextValue = {
  locale: SupportedLocale;
  region: "US" | "IN";
  ready: boolean;
  setLocale: (locale: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const browserLocales = window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language];
    const detectedLocale = detectLocale(storedLocale, browserLocales, DEFAULT_LOCALE);

    setLocale(detectedLocale);
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !ready) return;

    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, ready]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      region: getLocaleRegion(locale),
      ready,
      setLocale
    }),
    [locale, ready]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider.");
  }

  return context;
}

export {
  DEFAULT_LOCALE,
  detectLocale,
  formatDate,
  formatDateTime,
  formatAgeFromDob,
  formatGenderLabel,
  formatPatientPhone,
  toDateInputValue
};
