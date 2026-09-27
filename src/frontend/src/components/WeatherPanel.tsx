import { Skeleton } from "@/components/ui/skeleton";
import { useWeather } from "@/hooks/use-weather";
import {
  forecastDayLabel,
  formatTemperature,
  weatherCodeLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { CloudSun, Droplets, Wind } from "lucide-react";

export interface WeatherPanelProps {
  latitude: number | null;
  longitude: number | null;
  /** "full" shows current conditions + forecast; "compact" shows a single strip. */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Current conditions plus a short forecast for a coordinate pair.
 * Used by both the dashboard (compact) and the plot detail view (full).
 */
export function WeatherPanel({
  latitude,
  longitude,
  variant = "full",
  className,
}: WeatherPanelProps) {
  const { data, isLoading, isError } = useWeather(latitude, longitude);

  if (latitude === null || longitude === null) {
    return (
      <div
        data-ocid="weather.empty_state"
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        Weather appears once a plot has coordinates.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        data-ocid="weather.loading_state"
        className={cn("rounded-lg border border-border bg-card p-4", className)}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-3 h-12 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        data-ocid="weather.error_state"
        className={cn(
          "rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        Weather is unavailable right now.
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        data-ocid="weather.panel"
        className={cn(
          "flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3",
          className,
        )}
      >
        <CloudSun className="size-6 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="font-mono text-2xl leading-none tabular-nums">
            {formatTemperature(data.temperature)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {weatherCodeLabel(data.weatherCode)}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          {data.forecast.slice(0, 3).map((day) => (
            <div key={day.date} className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {forecastDayLabel(day.date)}
              </p>
              <p className="font-mono text-xs tabular-nums">
                {formatTemperature(day.temperatureMax)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="weather.panel"
      className={cn(
        "rounded-lg border border-border bg-card p-4 md:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Current conditions
          </p>
          <p className="mt-1 font-display text-4xl leading-none tabular-nums">
            {formatTemperature(data.temperature)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {weatherCodeLabel(data.weatherCode)} · feels like{" "}
            {formatTemperature(data.apparentTemperature)}
          </p>
        </div>
        <CloudSun className="size-10 shrink-0 text-accent" />
      </div>

      <div className="mt-4 flex gap-4 border-t border-border pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Wind className="size-4" />
          <span className="font-mono tabular-nums">
            {Math.round(data.windSpeed)} km/h
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Droplets className="size-4" />
          <span className="font-mono tabular-nums">
            {Math.round(data.humidity)}%
          </span>
        </span>
      </div>

      {data.forecast.length > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-2 border-t border-border pt-4">
          {data.forecast.map((day) => (
            <div key={day.date} className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {forecastDayLabel(day.date)}
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums">
                {formatTemperature(day.temperatureMax)}
              </p>
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatTemperature(day.temperatureMin)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
