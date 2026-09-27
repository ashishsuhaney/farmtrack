import type { Timestamp } from "@/backend";

/** Convert a Motoko nanosecond timestamp into a JavaScript Date, or null when invalid. */
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp as a readable date, e.g. "12 Mar 2026". */
export function formatDate(timestamp: Timestamp): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a backend timestamp as a relative phrase, e.g. "3 days ago". */
export function formatRelative(timestamp: Timestamp): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Unknown";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

/** Format a Date as the yyyy-mm-dd value an <input type="date"> expects. */
export function dateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Convert a yyyy-mm-dd input value into a nanosecond backend timestamp. */
export function inputValueToTimestamp(value: string): Timestamp {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  return BigInt(date.getTime()) * 1_000_000n;
}

/** Format an area in hectares with a fixed precision, e.g. "1.09 ha". */
export function formatHectares(area: number): string {
  return `${area.toFixed(2)} ha`;
}

/** Format a coordinate pair as a compact monospace label. */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat} ${lng}`;
}

/** Format a temperature in degrees Celsius. */
export function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

/** Map an Open-Meteo WMO weather code to a short human label. */
export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
}

/** Short weekday label for a forecast date string (yyyy-mm-dd). */
export function forecastDayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, { weekday: "short" });
}

/** Extract a friendly message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    const cleaned = error.message.replace(/^Error:\s*/i, "").trim();
    if (cleaned.length > 0 && cleaned.length < 200) return cleaned;
  }
  return "Something went wrong. Please try again.";
}
