import { Button } from "@/components/ui/button";
import { formatCoordinates, formatHectares } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FarmPlot } from "@/types/farms";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Plus, Sprout, X } from "lucide-react";

export interface PlotSummaryCardProps {
  plot: FarmPlot;
  onClose: () => void;
  onAddActivity: () => void;
  className?: string;
}

/**
 * Compact summary of a single plot, shown when its map marker is selected.
 * Surfaces the plot name, crop, area, and location label with links onward.
 */
export function PlotSummaryCard({
  plot,
  onClose,
  onAddActivity,
  className,
}: PlotSummaryCardProps) {
  return (
    <div
      data-ocid="plot.summary_card"
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-field",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border p-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Sprout className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg leading-tight">
            {plot.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {plot.cropType}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="plot.summary_close_button"
          aria-label="Close plot summary"
          onClick={onClose}
          className="-mr-1 -mt-1 size-8 shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-card p-3">
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Area
          </dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">
            {formatHectares(plot.areaHectares)}
          </dd>
        </div>
        <div className="bg-card p-3">
          <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Coordinates
          </dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
            {formatCoordinates(plot.latitude, plot.longitude)}
          </dd>
        </div>
      </dl>

      <div className="flex items-start gap-2 border-t border-border px-4 py-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="min-w-0 text-sm text-muted-foreground">
          {plot.locationLabel || "Location label unavailable"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-ocid="plot.add_activity_button"
          onClick={onAddActivity}
        >
          <Plus className="size-4" />
          Add activity
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link
            to="/plots/$plotId"
            params={{ plotId: plot.id.toString() }}
            data-ocid="plot.detail_link"
          >
            View plot
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
