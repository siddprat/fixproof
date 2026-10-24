/** YYYY-MM-DD in America/New_York, as the email rules in AGENTS.md require. */
export function formatDateNY(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

/** Human date and time in America/New_York, for screens and the report. */
export function formatDateTimeNY(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(iso));
}

/** UUID v4. crypto.randomUUID only exists in secure contexts, so fall back. */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
