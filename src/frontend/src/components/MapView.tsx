import { cn } from "@/lib/utils";
import type { LatLng } from "@/types/farms";
import { Locate, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const TILE_SIZE = 256;
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;

export interface MapMarker extends LatLng {
  id: string;
  label: string;
  /** Optional accent stripe colour class for the summary card. */
  accentClass?: string;
}

export interface MapViewProps {
  markers: MapMarker[];
  center: LatLng;
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  /** Optional callback fired when the user requests their current position. */
  onLocate?: () => void;
  className?: string;
  /** Marker id rendered with the pulsing signal ring. */
  selectedMarkerId?: string | null;
}

interface Tile {
  key: string;
  url: string;
  left: number;
  top: number;
}

function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latToWorldY(lat: number, zoom: number): number {
  const clamped = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const sin = Math.sin((clamped * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) *
    TILE_SIZE *
    2 ** zoom
  );
}

function worldXToLng(x: number, zoom: number): number {
  return (x / (TILE_SIZE * 2 ** zoom)) * 360 - 180;
}

function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Interactive OpenStreetMap raster-tile map with custom pan and zoom.
 * No Google Maps SDK is used; tile math is implemented locally.
 */
export function MapView({
  markers,
  center,
  zoom: initialZoom = 12,
  onMarkerClick,
  onLocate,
  className,
  selectedMarkerId = null,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 520 });
  const [zoom, setZoom] = useState(initialZoom);
  const [viewCenter, setViewCenter] = useState<LatLng>(center);
  const dragState = useRef<{ x: number; y: number; moved: boolean } | null>(
    null,
  );
  const centerLatitude = center.latitude;
  const centerLongitude = center.longitude;

  useEffect(() => {
    setViewCenter({ latitude: centerLatitude, longitude: centerLongitude });
  }, [centerLatitude, centerLongitude]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const centerWorldX = lngToWorldX(viewCenter.longitude, zoom);
  const centerWorldY = latToWorldY(viewCenter.latitude, zoom);

  const tiles = useMemo<Tile[]>(() => {
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const minTileX = Math.floor((centerWorldX - halfWidth) / TILE_SIZE);
    const maxTileX = Math.floor((centerWorldX + halfWidth) / TILE_SIZE);
    const minTileY = Math.floor((centerWorldY - halfHeight) / TILE_SIZE);
    const maxTileY = Math.floor((centerWorldY + halfHeight) / TILE_SIZE);
    const tileCount = 2 ** zoom;
    const result: Tile[] = [];
    for (let x = minTileX; x <= maxTileX; x += 1) {
      for (let y = minTileY; y <= maxTileY; y += 1) {
        if (y < 0 || y >= tileCount) continue;
        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        result.push({
          key: `${zoom}/${x}/${y}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - (centerWorldX - halfWidth),
          top: y * TILE_SIZE - (centerWorldY - halfHeight),
        });
      }
    }
    return result;
  }, [centerWorldX, centerWorldY, size.width, size.height, zoom]);

  const projectMarker = useCallback(
    (marker: LatLng) => ({
      left:
        lngToWorldX(marker.longitude, zoom) - (centerWorldX - size.width / 2),
      top:
        latToWorldY(marker.latitude, zoom) - (centerWorldY - size.height / 2),
    }),
    [centerWorldX, centerWorldY, size.width, size.height, zoom],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    setViewCenter((prev) => {
      const nextX = lngToWorldX(prev.longitude, zoom) - dx;
      const nextY = latToWorldY(prev.latitude, zoom) - dy;
      return {
        latitude: worldYToLat(nextY, zoom),
        longitude: worldXToLng(nextX, zoom),
      };
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current) {
      dragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  // React attaches onWheel as a passive listener, so preventDefault() there is
  // a no-op. Attach a non-passive native listener instead to stop page scroll.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((prev) =>
        Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, prev + (event.deltaY < 0 ? 1 : -1)),
        ),
      );
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  const zoomBy = (delta: number) => {
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      data-ocid="map.canvas"
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-muted",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none", cursor: "grab" }}
    >
      <div className="absolute inset-0 select-none">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute h-64 w-64"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {markers.map((marker) => {
          const position = projectMarker(marker);
          const isSelected = marker.id === selectedMarkerId;
          return (
            <button
              key={marker.id}
              type="button"
              data-ocid="map.marker"
              aria-label={`${marker.label} plot marker`}
              onClick={(event) => {
                event.stopPropagation();
                onMarkerClick?.(marker);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
              style={{ left: position.left, top: position.top }}
            >
              <span className="relative flex size-6 items-center justify-center">
                {isSelected && (
                  <span className="absolute inline-flex size-6 animate-marker-pulse rounded-full bg-accent/60" />
                )}
                <span
                  className={cn(
                    "relative size-3.5 rounded-full border-2 border-background shadow-field transition-smooth",
                    isSelected ? "bg-accent" : "bg-primary",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          type="button"
          data-ocid="map.zoom_in_button"
          aria-label="Zoom in"
          onClick={() => zoomBy(1)}
          className="flex size-9 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-subtle transition-smooth hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          data-ocid="map.zoom_out_button"
          aria-label="Zoom out"
          onClick={() => zoomBy(-1)}
          className="flex size-9 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-subtle transition-smooth hover:bg-accent hover:text-accent-foreground"
        >
          <Minus className="size-4" />
        </button>
        {onLocate && (
          <button
            type="button"
            data-ocid="map.locate_button"
            aria-label="Center on my location"
            onClick={onLocate}
            className="flex size-9 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-subtle transition-smooth hover:bg-accent hover:text-accent-foreground"
          >
            <Locate className="size-4" />
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-card/85 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
