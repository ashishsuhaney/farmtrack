import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

/**
 * A single dashboard metric: label, hero value, and an optional supporting hint.
 * Renders layout-matched skeletons while loading and a muted fallback on error.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  isLoading = false,
  isError = false,
  className,
}: StatCardProps) {
  return (
    <div
      data-ocid="dashboard.stat_card"
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-accent"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-accent">
          <Icon className="size-4" />
        </span>
      </div>

      {isLoading ? (
        <div data-ocid="dashboard.stat_loading_state" className="mt-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ) : (
        <>
          <p className="mt-3 font-display text-3xl leading-none tracking-tight tabular-nums md:text-4xl">
            {isError ? "—" : value}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {isError ? "Unavailable right now" : (hint ?? "\u00a0")}
          </p>
        </>
      )}
    </div>
  );
}
