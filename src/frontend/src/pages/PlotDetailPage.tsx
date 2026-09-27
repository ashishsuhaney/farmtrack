import { ActivityTimeline } from "@/components/ActivityTimeline";
import { PlotFormDialog } from "@/components/PlotFormDialog";
import { WeatherPanel } from "@/components/WeatherPanel";
import { ActivityFormDialog } from "@/components/plot/ActivityFormDialog";
import { PlotMiniMap } from "@/components/plot/PlotMiniMap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddActivity,
  useDeletePlot,
  usePlot,
  useUpdatePlot,
} from "@/hooks/use-farms";
import {
  errorMessage,
  formatCoordinates,
  formatHectares,
  formatRelative,
} from "@/lib/format";
import type {
  FarmPlot,
  FarmPlotInput,
  FieldActivityInput,
} from "@/types/farms";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  Loader2,
  MapPin,
  Pencil,
  Sprout,
  Trash2,
} from "lucide-react";
import { useState } from "react";

function parsePlotId(raw: string | undefined): bigint | null {
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

function PlotNotFound() {
  return (
    <div
      data-ocid="plot_detail.not_found_state"
      className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Sprout className="size-6" />
      </span>
      <h1 className="mt-5 font-display text-2xl tracking-tight">
        Plot not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This plot does not exist, or it belongs to another account. It may have
        been deleted.
      </p>
      <Button asChild type="button" className="mt-6">
        <Link to="/" data-ocid="plot_detail.back_to_dashboard_link">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}

function PlotDetailSkeleton() {
  return (
    <div
      data-ocid="plot_detail.loading_state"
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6"
    >
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

/**
 * Plot detail view: header metadata, a mini map, full weather, and the
 * activity timeline, plus edit/delete and log-activity actions.
 */
export function PlotDetailPage() {
  const params = useParams({ strict: false }) as { plotId?: string };
  const plotId = parsePlotId(params.plotId);
  const navigate = useNavigate();

  const { data: plot, isLoading, isError } = usePlot(plotId);
  const updatePlot = useUpdatePlot();
  const deletePlot = useDeletePlot();
  const addActivity = useAddActivity();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (plotId === null) {
    return <PlotNotFound />;
  }

  if (isLoading) {
    return <PlotDetailSkeleton />;
  }

  if (isError || !plot) {
    return <PlotNotFound />;
  }

  const handleUpdate = async (input: FarmPlotInput) => {
    setActionError(null);
    await updatePlot.mutateAsync({ plotId: plot.id, input });
  };

  const handleAddActivity = async (input: FieldActivityInput) => {
    setActionError(null);
    await addActivity.mutateAsync(input);
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deletePlot.mutateAsync(plot.id);
      setIsDeleteOpen(false);
      await navigate({ to: "/" });
    } catch (error) {
      setActionError(errorMessage(error));
    }
  };

  return (
    <div
      data-ocid="plot_detail.page"
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild type="button" variant="ghost" size="sm">
          <Link to="/" data-ocid="plot_detail.back_link">
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="plot_detail.edit_button"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="size-4" />
            Edit plot
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="plot_detail.delete_button"
            onClick={() => setIsDeleteOpen(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <header
        data-ocid="plot_detail.header"
        className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-subtle md:p-6"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[3px] bg-accent"
        />
        <div className="flex flex-wrap items-start justify-between gap-4 pl-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Farm plot
            </p>
            <h1 className="mt-1 truncate font-display text-3xl tracking-tight">
              {plot.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {plot.cropType}
              </span>
              <span className="font-mono tabular-nums text-foreground">
                {formatHectares(plot.areaHectares)}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0 text-accent" />
                <span className="truncate">{plot.locationLabel}</span>
              </span>
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground tabular-nums">
              {formatCoordinates(plot.latitude, plot.longitude)}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Updated {formatRelative(plot.updatedAt)}</p>
          </div>
        </div>
      </header>

      {actionError && (
        <p
          data-ocid="plot_detail.error_state"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section
            data-ocid="plot_detail.map_section"
            className="rounded-lg border border-border bg-card p-4 shadow-subtle"
          >
            <h2 className="mb-3 font-display text-lg tracking-tight">
              Location
            </h2>
            <PlotMiniMap plot={plot} />
          </section>

          <section
            data-ocid="plot_detail.activity_section"
            className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg tracking-tight">
                Field activity
              </h2>
              <Button
                type="button"
                size="sm"
                data-ocid="plot_detail.log_activity_button"
                onClick={() => setIsActivityOpen(true)}
              >
                <CalendarPlus className="size-4" />
                Log activity
              </Button>
            </div>
            <ActivityTimeline plotId={plot.id} />
          </section>
        </div>

        <aside className="space-y-6">
          <section data-ocid="plot_detail.weather_section">
            <h2 className="mb-3 font-display text-lg tracking-tight">
              Weather at the farm
            </h2>
            <WeatherPanel
              latitude={plot.latitude}
              longitude={plot.longitude}
              variant="full"
            />
          </section>
        </aside>
      </div>

      <PlotFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        plot={plot}
        onSubmit={handleUpdate}
        isSubmitting={updatePlot.isPending}
      />

      <ActivityFormDialog
        open={isActivityOpen}
        onOpenChange={setIsActivityOpen}
        plotId={plot.id}
        onSubmit={handleAddActivity}
        isSubmitting={addActivity.isPending}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent data-ocid="plot_detail.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete {plot.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the plot and its logged field activity.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              type="button"
              data-ocid="plot_detail.delete_cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              data-ocid="plot_detail.delete_confirm_button"
              disabled={deletePlot.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlot.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete plot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
