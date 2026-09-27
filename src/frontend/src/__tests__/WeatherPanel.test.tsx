import { WeatherPanel } from "@/components/WeatherPanel";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "./helpers";

const openMeteoPayload = {
  current: {
    temperature_2m: 24.4,
    apparent_temperature: 23.1,
    relative_humidity_2m: 61,
    wind_speed_10m: 12.6,
    weather_code: 1,
    is_day: 1,
  },
  daily: {
    time: ["2026-03-20", "2026-03-21", "2026-03-22"],
    weather_code: [1, 2, 3],
    temperature_2m_max: [26, 27, 25],
    temperature_2m_min: [15, 16, 14],
    precipitation_probability_max: [10, 20, 30],
  },
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse(openMeteoPayload)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WeatherPanel", () => {
  it("renders current conditions and the forecast for a coordinate pair", async () => {
    renderWithQueryClient(
      <WeatherPanel latitude={-0.3031} longitude={36.08} variant="full" />,
    );

    expect(await screen.findByText("24°")).toBeInTheDocument();
    expect(screen.getByText(/partly cloudy/i)).toBeInTheDocument();
    expect(screen.getByText(/feels like 23°/i)).toBeInTheDocument();
    expect(screen.getByText("13 km/h")).toBeInTheDocument();
    expect(screen.getByText("61%")).toBeInTheDocument();

    // The forecast renders one column per returned day.
    expect(screen.getByText("26°")).toBeInTheDocument();
    expect(screen.getByText("15°")).toBeInTheDocument();
  });

  it("requests the coordinates from the weather API", async () => {
    renderWithQueryClient(
      <WeatherPanel latitude={-0.3031} longitude={36.08} variant="compact" />,
    );

    await screen.findByText("24°");
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const requestedUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestedUrl).toContain("latitude=-0.3031");
    expect(requestedUrl).toContain("longitude=36.08");
  });

  it("shows the empty state when no coordinates are available", () => {
    renderWithQueryClient(<WeatherPanel latitude={null} longitude={null} />);

    expect(
      screen.getByText(/weather appears once a plot has coordinates/i),
    ).toBeInTheDocument();
  });

  it("shows an error state when the weather request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, false)),
    );

    renderWithQueryClient(
      <WeatherPanel latitude={-0.3031} longitude={36.08} variant="full" />,
    );

    expect(
      await screen.findByText(
        /weather is unavailable right now/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it("shows a loading state before the request resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderWithQueryClient(
      <WeatherPanel latitude={-0.3031} longitude={36.08} variant="full" />,
    );

    expect(screen.getByTestId("weather.loading_state")).toBeInTheDocument();
  });
});
