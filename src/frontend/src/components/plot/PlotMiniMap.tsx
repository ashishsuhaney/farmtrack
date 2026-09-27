import { type MapMarker, MapView } from "@/components/MapView";
import { cn } from "@/lib/utils";
import type { FarmPlot } from "@/types/farms";

export interface PlotMiniMapProps {
  plot: FarmPlot;
  className?: string;
}

/**
 * A compact map centred on a single plot. Built on the shared MapView so tile
 * rendering and marker styling stay consistent with the map page; pan and zoom
 * remain available within the small frame.
 */
export function PlotMiniMap({ plot, className }: PlotMiniMapProps) {
  const markers: MapMarker[] = [
    {
      id: plot.id.toString(),
      label: plot.name,
      latitude: plot.latitude,
      longitude: plot.longitude,
      accentClass: "bg-accent",
    },
  ];

  return (
    <MapView
      markers={markers}
      center={{ latitude: plot.latitude, longitude: plot.longitude }}
      zoom={14}
      selectedMarkerId={plot.id.toString()}
      className={cn("h-56 w-full", className)}
    />
  );
}
