import type { PlaceResult } from "@/types/farms";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT =
  "FarmTrack/1.0 (field plot manager; contact: support@farmtrack.app)";

interface NominatimSearchRow {
  display_name?: string;
  lat?: string;
  lon?: string;
}

interface NominatimReverseRow {
  display_name?: string;
  address?: Record<string, string>;
}

function buildHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
}

/**
 * Search for places by name against the OpenStreetMap Nominatim API.
 * Returns an empty array on any failure so callers can show a graceful message.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  try {
    const response = await fetch(url.toString(), {
      headers: buildHeaders(),
      signal,
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as NominatimSearchRow[];
    if (!Array.isArray(rows)) return [];
    return rows
      .map((row) => {
        const latitude = Number(row.lat);
        const longitude = Number(row.lon);
        if (
          !row.display_name ||
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          return null;
        }
        return {
          displayName: row.display_name,
          latitude,
          longitude,
        } satisfies PlaceResult;
      })
      .filter((place): place is PlaceResult => place !== null);
  } catch {
    return [];
  }
}

/**
 * Reverse-lookup the nearest readable place name for a coordinate pair.
 * Returns null on failure so callers can fall back to raw coordinates.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set("lat", `${latitude}`);
  url.searchParams.set("lon", `${longitude}`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "14");

  try {
    const response = await fetch(url.toString(), {
      headers: buildHeaders(),
      signal,
    });
    if (!response.ok) return null;
    const row = (await response.json()) as NominatimReverseRow;
    if (row.address) {
      const address = row.address;
      const locality =
        address.village ??
        address.town ??
        address.city ??
        address.hamlet ??
        address.county ??
        address.state;
      if (locality) {
        const region = address.state ?? address.country;
        return region && region !== locality
          ? `${locality}, ${region}`
          : locality;
      }
    }
    return row.display_name ?? null;
  } catch {
    return null;
  }
}
