import { ActivityTimeline } from "@/components/ActivityTimeline";
import { PlotFormDialog } from "@/components/PlotFormDialog";
import { WeatherPanel } from "@/components/WeatherPanel";
import { PlotCard } from "@/components/dashboard/PlotCard";
import { StatCard } from "@/components/dashboard/StatCard";
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
  useAddPlot,
  useDashboardSummary,
  useDeletePlot,
  usePlots,
  useUpdatePlot,
} from "@/hooks/use-farms";
import { errorMessage, formatDate, formatHectares } from "@/lib/format";
import type { FarmPlot, FarmPlotInput } from "@/types/farms";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  Layers,
  Loader2,
  MapPinned,
  Plus,
  RefreshCw,
  Sprout,
} from "lucide-react";
import { useMemo, useState } from "react";

const PLOT_SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `plot-skeleton-${index}`,
);

/**
 * Farm operations dashboard: summary metrics, weather for the most recently
 * updated plot, the plot list with inline edit/delete, and recent activity.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const summary = useDashboardSummary();
  const plots = usePlots();
  const addPlot = useAddPlot();
  const updatePlot = useUpdatePlot();
  const deletePlot = useDeletePlot();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<FarmPlot | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FarmPlot | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const plotList = useMemo(() => plots.data ?? [], [plots.data]);

  const mostRecentPlot = useMemo(() => {
    if (plotList.length === 0) return null;
    return plotList.reduce((latest, plot) =>
      plot.updatedAt > latest.updatedAt ? plot : latest,
    );
  }, [plotList]);

  const openAdd = () => {
    setEditingPlot(null);
    setFormOpen(true);
  };

  const openEdit = (plot: FarmPlot) => {
    setEditingPlot(plot);
    setFormOpen(true);
  };

  const handleSubmit = async (input: FarmPlotInput) => {
    if (editingPlot) {
      await updatePlot.mutateAsync({ plotId: editingPlot.id, input });
    } else {
      await addPlot.mutateAsync(input);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await deletePlot.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  };

  const summaryError = summary.isError;
  const summaryLoading = summary.isLoading;

  return (
    <div
      data-ocid="dashboard.page"
      className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Field ledger
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your plots, hectares, and latest field activity at a glance.
          </p>
        </div>
        <Button
          type="button"
          data-ocid="dashboard.add_plot_button"
          onClick={openAdd}
          className="transition-smooth hover:shadow-elevated"
        >
          <Plus className="size-4" />
          Add plot
        </Button>
      </header>

      <section
        data-ocid="dashboard.summary_section"
        aria-label="Farm summary"
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          label="Total farms"
          value={summary.data ? summary.data.totalFarms.toString() : "0"}
          hint="Plots registered to your account"
          icon={Layers}
          isLoading={summaryLoading}
          isError={summaryError}
        />
        <StatCard
          label="Total area"
          value={
            summary.data
              ? formatHectares(summary.data.totalAreaHectares)
              : "0.00 ha"
          }
          hint="Combined across every plot"
          icon={Sprout}
          isLoading={summaryLoading}
          isError={summaryError}
        />
        <StatCard
          label="Latest activity"
          value={
            summary.data?.mostRecentActivity
              ? formatDate(summary.data.mostRecentActivity.date)
              : "No activity"
          }
          hint={
            summary.data?.mostRecentActivity
              ? "Most recent field entry"
              : "Log activity from a plot"
          }
          icon={CalendarClock}
          isLoading={summaryLoading}
          isError={summaryError}
          className="sm:col-span-2 lg:col-span-1"
        />
      </section>

      {summaryError && (
        <div
          data-ocid="dashboard.summary_error_state"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"
        >
          <span>Could not load your farm summary.</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="dashboard.summary_retry_button"
            onClick={() => void summary.refetch()}
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      )}

      <section
        data-ocid="dashboard.weather_section"
        aria-label="Weather at your latest plot"
        className="mt-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl tracking-tight md:text-2xl">
            Weather at the farm
          </h2>
          {mostRecentPlot && (
            <p className="text-xs text-muted-foreground">
              {mostRecentPlot.name} · {mostRecentPlot.locationLabel}
            </p>
          )}
        </div>
        <div className="mt-3">
          {plots.isLoading ? (
            <Skeleton
              data-ocid="dashboard.weather_loading_state"
              className="h-[68px] w-full rounded-lg"
            />
          ) : mostRecentPlot ? (
            <WeatherPanel
              latitude={mostRecentPlot.latitude}
              longitude={mostRecentPlot.longitude}
              variant="compact"
            />
          ) : (
            <div
              data-ocid="dashboard.weather_empty_state"
              className="rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            >
              Add a plot with a location to see local conditions here.
            </div>
          )}
        </div>
      </section>

      <section
        data-ocid="dashboard.plots_section"
        aria-label="Your farm plots"
        className="mt-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl tracking-tight md:text-2xl">
            Your plots
          </h2>
          {!plots.isLoading && !plots.isError && plotList.length > 0 && (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {plotList.length} {plotList.length === 1 ? "plot" : "plots"}
            </p>
          )}
        </div>

        {plots.isLoading && (
          <div
            data-ocid="dashboard.plots_loading_state"
            className="mt-3 grid gap-4 md:grid-cols-2"
          >
            {PLOT_SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        )}

        {plots.isError && (
          <div
            data-ocid="dashboard.plots_error_state"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"
          >
            <span>Could not load your plots.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="dashboard.plots_retry_button"
              onClick={() => void plots.refetch()}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        )}

        {!plots.isLoading && !plots.isError && plotList.length === 0 && (
          <div
            data-ocid="dashboard.plots_empty_state"
            className="mt-3 flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-accent">
              <MapPinned className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-xl tracking-tight">
              No plots yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Register your first field to start tracking hectares, weather, and
              field activity in one place.
            </p>
            <Button
              type="button"
              data-ocid="dashboard.empty_add_plot_button"
              onClick={openAdd}
              className="mt-5 transition-smooth hover:shadow-elevated"
            >
              <Plus className="size-4" />
              Add your first plot
            </Button>
          </div>
        )}

        {!plots.isLoading && !plots.isError && plotList.length > 0 && (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {plotList.map((plot, index) => (
              <PlotCard
                key={plot.id.toString()}
                plot={plot}
                index={index + 1}
                onOpen={(target) =>
                  void navigate({
                    to: "/plots/$plotId",
                    params: { plotId: target.id.toString() },
                  })
                }
                onEdit={openEdit}
                onDelete={(target) => {
                  setDeleteError(null);
                  setPendingDelete(target);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {mostRecentPlot && (
        <section
          data-ocid="dashboard.activity_section"
          aria-label="Recent field activity"
          className="mt-8"
        >
          <h2 className="font-display text-xl tracking-tight md:text-2xl">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest entries for {mostRecentPlot.name}.
          </p>
          <div className="mt-3">
            <ActivityTimeline plotId={mostRecentPlot.id} />
          </div>
        </section>
      )}

      <PlotFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        plot={editingPlot}
        onSubmit={handleSubmit}
        isSubmitting={addPlot.isPending || updatePlot.isPending}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent data-ocid="dashboard.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the plot and its logged activity. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p
              data-ocid="dashboard.delete_error"
              className="text-sm text-destructive"
            >
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="dashboard.delete_cancel_button"
              disabled={deletePlot.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="dashboard.delete_confirm_button"
              disabled={deletePlot.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
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
