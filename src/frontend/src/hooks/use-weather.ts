import type { ForecastDay, WeatherSnapshot } from "@/types/farms";
import { useQuery } from "@tanstack/react-query";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
}

function buildUrl(latitude: number, longitude: number): string {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", `${latitude}`);
  url.searchParams.set("longitude", `${longitude}`);
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");
  return url.toString();
}

function parseForecast(payload: OpenMeteoResponse): ForecastDay[] {
  const daily = payload.daily;
  if (!daily?.time) return [];
  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code?.[index] ?? 0,
    temperatureMax: daily.temperature_2m_max?.[index] ?? 0,
    temperatureMin: daily.temperature_2m_min?.[index] ?? 0,
    precipitationProbability: daily.precipitation_probability_max?.[index] ?? 0,
  }));
}

async function fetchWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<WeatherSnapshot> {
  const response = await fetch(buildUrl(latitude, longitude), { signal });
  if (!response.ok) {
    throw new Error("Weather is unavailable right now.");
  }
  const payload = (await response.json()) as OpenMeteoResponse;
  const current = payload.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("Weather is unavailable right now.");
  }
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    weatherCode: current.weather_code ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    humidity: current.relative_humidity_2m ?? 0,
    isDay: current.is_day !== 0,
    forecast: parseForecast(payload),
  };
}

/**
 * Current conditions plus a short forecast for a coordinate pair.
 * Pass `null` coordinates to keep the query idle.
 */
export function useWeather(latitude: number | null, longitude: number | null) {
  const enabled = latitude !== null && longitude !== null;
  return useQuery({
    queryKey: ["weather", latitude, longitude],
    queryFn: ({ signal }) =>
      fetchWeather(latitude as number, longitude as number, signal),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
