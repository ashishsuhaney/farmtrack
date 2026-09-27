import { Button } from "@/components/ui/button";
import { formatCoordinates, formatHectares } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FarmPlot } from "@/types/farms";
import { MapPin, Pencil, Trash2 } from "lucide-react";

export interface PlotCardProps {
  plot: FarmPlot;
  /** 1-based position, used for stable deterministic markers. */
  index: number;
  onOpen: (plot: FarmPlot) => void;
  onEdit: (plot: FarmPlot) => void;
  onDelete: (plot: FarmPlot) => void;
  className?: string;
}

/**
 * A farm plot summary card with a lime accent stripe, crop/area metadata,
 * and edit/delete actions. The card body navigates to the plot detail view.
 */
export function PlotCard({
  plot,
  index,
  onOpen,
  onEdit,
  onDelete,
  className,
}: PlotCardProps) {
  return (
    <article
      data-ocid={`dashboard.plot_card.${index}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-subtle transition-smooth hover:border-accent/60 hover:shadow-elevated",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-accent"
      />

      <button
        type="button"
        data-ocid={`dashboard.plot_open_button.${index}`}
        onClick={() => onOpen(plot)}
        className="flex flex-1 flex-col items-start gap-3 p-4 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-5 md:pl-6"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-xl tracking-tight">
            {plot.name}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {plot.cropType}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-mono tabular-nums text-foreground">
            {formatHectares(plot.areaHectares)}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-accent" />
            <span className="truncate">{plot.locationLabel}</span>
          </span>
        </div>

        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatCoordinates(plot.latitude, plot.longitude)}
        </span>
      </button>

      <div className="flex items-center justify-end gap-1 border-t border-border px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-ocid={`dashboard.plot_edit_button.${index}`}
          onClick={() => onEdit(plot)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-ocid={`dashboard.plot_delete_button.${index}`}
          onClick={() => onDelete(plot)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </article>
  );
}
