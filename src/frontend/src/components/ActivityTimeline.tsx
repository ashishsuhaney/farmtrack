import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/use-farms";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_TYPES,
  type ActivityType,
  activityTypeChipClass,
  activityTypeLabel,
} from "@/types/farms";
import {
  Bug,
  Droplets,
  Leaf,
  type LucideIcon,
  Sprout,
  Tractor,
} from "lucide-react";
import { useState } from "react";

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  planting: Sprout,
  irrigation: Droplets,
  fertilizing: Leaf,
  pestControl: Bug,
  harvest: Tractor,
};

export interface ActivityTimelineProps {
  plotId: bigint | null;
  className?: string;
}

/**
 * Activity list for a plot, newest first, with a type icon, date, and a
 * filter control across the five activity types.
 */
export function ActivityTimeline({ plotId, className }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityType | null>(null);
  const { data, isLoading, isError } = useActivities(plotId, filter);

  return (
    <div data-ocid="activity.section" className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-ocid="activity.filter.all_tab"
          onClick={() => setFilter(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
            filter === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {ACTIVITY_TYPES.map((entry) => (
          <button
            key={entry.value}
            type="button"
            data-ocid="activity.filter.tab"
            onClick={() => setFilter(entry.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
              filter === entry.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div data-ocid="activity.loading_state" className="space-y-3">
          {Array.from(
            { length: 3 },
            (_, index) => `activity-skeleton-${index}`,
          ).map((id) => (
            <Skeleton key={id} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <p
          data-ocid="activity.error_state"
          className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"
        >
          Could not load activity for this plot.
        </p>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div
          data-ocid="activity.empty_state"
          className="rounded-lg border border-dashed border-border bg-card p-6 text-center"
        >
          <p className="font-display text-lg">No activity logged yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter
              ? "No entries match this filter. Try another activity type."
              : "Record planting, irrigation, or harvest to build this plot's field history."}
          </p>
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <ol className="relative space-y-3 border-l border-border pl-5">
          {data?.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.activityType] ?? Sprout;
            return (
              <li
                key={activity.id.toString()}
                data-ocid={`activity.item.${index + 1}`}
                className="relative animate-fade-in-up rounded-lg border border-border bg-card p-3"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span
                  className={cn(
                    "absolute -left-[30px] top-3 flex size-6 items-center justify-center rounded-full",
                    activityTypeChipClass(activity.activityType),
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {activityTypeLabel(activity.activityType)}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatDate(activity.date)}
                  </span>
                </div>
                {activity.notes && (
                  <p className="mt-2 text-sm text-foreground/90">
                    {activity.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
