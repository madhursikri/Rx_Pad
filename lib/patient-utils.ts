export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCountryCode(value: string): string {
  const digits = normalizePhone(value);
  return digits ? `+${digits}` : "";
}

export function toNullableTrimmed(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toDobRange(dateString: string): { gte: Date; lt: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}
