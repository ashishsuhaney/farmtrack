import { type MapMarker, MapView } from "@/components/MapView";
import { PlotFormDialog } from "@/components/PlotFormDialog";
import { PlotSummaryCard } from "@/components/map/PlotSummaryCard";
import { Button } from "@/components/ui/button";
import { useAddPlot, usePlots } from "@/hooks/use-farms";
import { useGeolocation } from "@/hooks/use-geolocation";
import { errorMessage } from "@/lib/format";
import type { FarmPlot, FarmPlotInput, LatLng } from "@/types/farms";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, MapPin, Plus, Sprout } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Fallback view when the farmer has no plots and geolocation is unavailable. */
const FALLBACK_CENTER: LatLng = { latitude: 51.505, longitude: -0.09 };
const FALLBACK_ZOOM = 11;
const PLOT_ZOOM = 13;

function centroidOf(plots: FarmPlot[]): LatLng {
  const total = plots.reduce(
    (acc, plot) => ({
      latitude: acc.latitude + plot.latitude,
      longitude: acc.longitude + plot.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: total.latitude / plots.length,
    longitude: total.longitude / plots.length,
  };
}

/**
 * Full-bleed farm map: every plot as a marker, a summary card on selection,
 * and inline plot registration. Centers on the plots, or on the farmer's
 * current position when they have none yet.
 */
export function MapPage() {
  const plotsQuery = usePlots();
  const addPlot = useAddPlot();
  const geo = useGeolocation();
  const navigate = useNavigate();
  const locate = geo.locate;

  const plots = plotsQuery.data ?? [];
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [center, setCenter] = useState<LatLng>(FALLBACK_CENTER);
  const [zoom, setZoom] = useState(FALLBACK_ZOOM);
  const [hasCentered, setHasCentered] = useState(false);

  const markers = useMemo<MapMarker[]>(
    () =>
      plots.map((plot) => ({
        id: plot.id.toString(),
        label: plot.name,
        latitude: plot.latitude,
        longitude: plot.longitude,
      })),
    [plots],
  );

  const selectedPlot = useMemo(
    () => plots.find((plot) => plot.id.toString() === selectedPlotId) ?? null,
    [plots, selectedPlotId],
  );

  // Center once on the plots, or fall back to the browser position. The
  // effect depends only on the stable `locate` callback, never the whole
  // `geo` object (which is recreated on every render).
  useEffect(() => {
    if (hasCentered || plotsQuery.isLoading) return;
    if (plots.length > 0) {
      setCenter(centroidOf(plots));
      setZoom(PLOT_ZOOM);
      setHasCentered(true);
      return;
    }
    locate();
  }, [hasCentered, plots, plotsQuery.isLoading, locate]);

  useEffect(() => {
    if (hasCentered || plots.length > 0) return;
    if (geo.latitude === null || geo.longitude === null) return;
    setCenter({ latitude: geo.latitude, longitude: geo.longitude });
    setZoom(PLOT_ZOOM);
    setHasCentered(true);
  }, [hasCentered, plots.length, geo.latitude, geo.longitude]);

  const handleLocate = () => {
    if (geo.latitude !== null && geo.longitude !== null) {
      setCenter({ latitude: geo.latitude, longitude: geo.longitude });
      setZoom(PLOT_ZOOM);
      return;
    }
    locate();
  };

  const handleAddPlot = async (input: FarmPlotInput) => {
    await addPlot.mutateAsync(input);
  };

  const handleAddActivity = () => {
    if (!selectedPlot) return;
    void navigate({
      to: "/plots/$plotId",
      params: { plotId: selectedPlot.id.toString() },
    });
  };

  return (
    <div data-ocid="map.page" className="relative h-[calc(100vh-4rem)] w-full">
      <MapView
        markers={markers}
        center={center}
        zoom={zoom}
        selectedMarkerId={selectedPlotId}
        onMarkerClick={(marker) => setSelectedPlotId(marker.id)}
        onLocate={handleLocate}
        className="h-full w-full rounded-none border-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto rounded-lg border border-border bg-card/95 px-4 py-3 shadow-field backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Farm map
          </p>
          <p className="mt-0.5 font-display text-lg leading-tight">
            {plots.length === 0
              ? "No plots mapped yet"
              : `${plots.length} plot${plots.length === 1 ? "" : "s"} mapped`}
          </p>
        </div>
        <Button
          type="button"
          data-ocid="map.add_plot_button"
          className="pointer-events-auto shrink-0"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="size-4" />
          Add plot
        </Button>
      </div>

      {plotsQuery.isLoading && (
        <div
          data-ocid="map.loading_state"
          className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-field">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading your plots…
          </div>
        </div>
      )}

      {plotsQuery.isError && (
        <div
          data-ocid="map.error_state"
          className="absolute inset-x-0 top-24 mx-auto flex w-[min(24rem,calc(100%-2rem))] items-start gap-3 rounded-lg border border-destructive/40 bg-card p-4 shadow-field"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Could not load your plots</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {errorMessage(plotsQuery.error)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-ocid="map.retry_button"
            onClick={() => void plotsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {!plotsQuery.isLoading && !plotsQuery.isError && plots.length === 0 && (
        <div
          data-ocid="map.empty_state"
          className="absolute inset-x-0 bottom-6 mx-auto flex w-[min(26rem,calc(100%-2rem))] flex-col items-center rounded-lg border border-border bg-card/95 p-6 text-center shadow-field backdrop-blur"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Sprout className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-xl">Map your first plot</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Register a field with its crop, area, and location to see it pinned
            here. Your records stay private to your account.
          </p>
          <Button
            type="button"
            data-ocid="map.empty_add_plot_button"
            className="mt-4"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="size-4" />
            Add your first plot
          </Button>
          {geo.error && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {geo.error}
            </p>
          )}
        </div>
      )}

      {selectedPlot && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <PlotSummaryCard
            plot={selectedPlot}
            onClose={() => setSelectedPlotId(null)}
            onAddActivity={handleAddActivity}
          />
        </div>
      )}

      <PlotFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddPlot}
        isSubmitting={addPlot.isPending}
      />
    </div>
  );
}
