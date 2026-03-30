export const SUPPORTED_LOCALES = ["en-US", "en-IN"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleRegion = "US" | "IN";

export const DEFAULT_LOCALE: SupportedLocale = "en-US";
export const LOCALE_STORAGE_KEY = "rxpad.locale";

function canonicalizeLocale(value: string): string {
  return value.trim().replace(/_/g, "-");
}

function toUpperRegion(value: string): string {
  const region = value.split("-").pop();
  return region ? region.toUpperCase() : "";
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function normalizeLocale(value?: string | null): SupportedLocale | null {
  if (!value) return null;

  const canonical = canonicalizeLocale(value);
  const lower = canonical.toLowerCase();

  if (lower.startsWith("en-in") || toUpperRegion(canonical) === "IN") {
    return "en-IN";
  }

  if (lower.startsWith("en-us") || toUpperRegion(canonical) === "US" || toUpperRegion(canonical) === "CA") {
    return "en-US";
  }

  return null;
}

export function detectLocale(
  preferred: string | null | undefined,
  browserLocales: readonly string[] = [],
  fallback: SupportedLocale = DEFAULT_LOCALE
): SupportedLocale {
  const stored = normalizeLocale(preferred);
  if (stored) return stored;

  for (const locale of browserLocales) {
    const detected = normalizeLocale(locale);
    if (detected) return detected;
  }

  return fallback;
}

export function getLocaleRegion(locale: string): LocaleRegion {
  return normalizeLocale(locale) === "en-IN" ? "IN" : "US";
}

export function getLocaleDisplayLabel(locale: SupportedLocale): string {
  return locale === "en-IN" ? "English (India)" : "English (United States)";
}

export function formatDate(value: string | Date, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(date);
}

export function formatDateTime(value: string | Date, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function readDateParts(value: string | Date): { year: number; month: number; day: number } | null {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3])
      };
    }
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

export function formatAgeFromDob(dob: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const birthDate = readDateParts(dob);
  if (!birthDate) return "Unknown";

  const today = new Date();
  let age = today.getFullYear() - birthDate.year;
  const hasHadBirthday =
    today.getMonth() + 1 > birthDate.month ||
    (today.getMonth() + 1 === birthDate.month && today.getDate() >= birthDate.day);

  if (!hasHadBirthday) age -= 1;

  return age >= 0 ? new Intl.NumberFormat(locale).format(age) : "Unknown";
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

export function getTodayDateInputValue(): string {
  const today = new Date();
  return [
    String(today.getFullYear()).padStart(4, "0"),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

export function getDobInputPlaceholder(locale: SupportedLocale = DEFAULT_LOCALE): string {
  return locale === "en-IN" ? "DD/MM/YYYY" : "MM/DD/YYYY";
}

export function formatDobInputValue(dob: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const parts = readDateParts(dob);
  if (!parts) return dob;

  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  const year = String(parts.year).padStart(4, "0");
  return locale === "en-IN" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

export function normalizeDobInput(value: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return trimmed;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);

  const day = locale === "en-IN" ? first : second;
  const month = locale === "en-IN" ? second : first;

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return trimmed;
  if (month < 1 || month > 12 || day < 1 || day > 31) return trimmed;

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

export function formatPatientPhone(phoneCountryCode: string | null, phone: string | null): string {
  if (!phone) return "Not provided";

  const digits = phone.replace(/\D/g, "");
  const countryCode = phoneCountryCode?.trim() ?? "";

  if (countryCode === "+1" && digits.length === 10) {
    return `${countryCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (countryCode === "+91" && digits.length === 10) {
    return `${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (countryCode) {
    return `${countryCode} ${digits}`;
  }

  return digits;
}

export function formatGenderLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
