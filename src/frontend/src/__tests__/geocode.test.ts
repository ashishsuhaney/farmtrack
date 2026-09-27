import { reverseGeocode, searchPlaces } from "@/lib/geocode";
import { afterEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchPlaces", () => {
  it("maps Nominatim rows to place results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse([
          {
            display_name: "Nairobi, Kenya",
            lat: "-1.286389",
            lon: "36.817223",
          },
        ]),
      ),
    );

    const results = await searchPlaces("Nairobi");

    expect(results).toEqual([
      {
        displayName: "Nairobi, Kenya",
        latitude: -1.286389,
        longitude: 36.817223,
      },
    ]);
  });

  it("returns an empty list for queries shorter than three characters", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await searchPlaces("Na")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an empty list when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, false)),
    );

    expect(await searchPlaces("Nairobi")).toEqual([]);
  });
});

describe("reverseGeocode", () => {
  it("builds a readable label from the nearest locality", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          display_name: "Nairobi, Kenya",
          address: { city: "Nairobi", state: "Nairobi County" },
        }),
      ),
    );

    const label = await reverseGeocode(-0.3031, 36.08);

    expect(label).toBe("Nairobi, Nairobi County");
  });

  it("falls back to the display name when no address is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ display_name: "Somewhere" })),
    );

    expect(await reverseGeocode(-0.3031, 36.08)).toBe("Somewhere");
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, false)),
    );

    expect(await reverseGeocode(-0.3031, 36.08)).toBeNull();
  });
});
