import type {
  ActivityType,
  DashboardSummary,
  FarmPlot,
  FarmPlotInput,
  FarmerProfile,
  FieldActivity,
  FieldActivityInput,
} from "@/backend";

export type {
  ActivityType,
  DashboardSummary,
  FarmPlot,
  FarmPlotInput,
  FarmerProfile,
  FieldActivity,
  FieldActivityInput,
};

export { ActivityType as ActivityTypeEnum } from "@/backend";

/** A coordinate pair used by the map, weather, and geocoding helpers. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** A place returned by the Nominatim search endpoint. */
export interface PlaceResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

/** A single day in the Open-Meteo forecast. */
export interface ForecastDay {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
}

/** Current conditions plus a short forecast for one coordinate pair. */
export interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  isDay: boolean;
  forecast: ForecastDay[];
}

/** Human-readable metadata for each activity type. */
export interface ActivityTypeMeta {
  value: ActivityType;
  label: string;
  /** Tailwind classes for the tinted icon chip. */
  chipClass: string;
}

export const ACTIVITY_TYPES: ActivityTypeMeta[] = [
  {
    value: "planting" as ActivityType,
    label: "Planting",
    chipClass: "bg-chart-1/15 text-chart-1",
  },
  {
    value: "irrigation" as ActivityType,
    label: "Irrigation",
    chipClass: "bg-chart-4/15 text-chart-4",
  },
  {
    value: "fertilizing" as ActivityType,
    label: "Fertilizing",
    chipClass: "bg-chart-3/15 text-chart-3",
  },
  {
    value: "pestControl" as ActivityType,
    label: "Pest control",
    chipClass: "bg-chart-5/15 text-chart-5",
  },
  {
    value: "harvest" as ActivityType,
    label: "Harvest",
    chipClass: "bg-chart-2/15 text-chart-2",
  },
];

export function activityTypeLabel(type: ActivityType): string {
  return (
    ACTIVITY_TYPES.find((entry) => entry.value === type)?.label ?? "Activity"
  );
}

export function activityTypeChipClass(type: ActivityType): string {
  return (
    ACTIVITY_TYPES.find((entry) => entry.value === type)?.chipClass ??
    "bg-muted text-muted-foreground"
  );
}
