import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeolocation } from "@/hooks/use-geolocation";
import { errorMessage, formatCoordinates } from "@/lib/format";
import { reverseGeocode, searchPlaces } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import type { FarmPlot, FarmPlotInput, PlaceResult } from "@/types/farms";
import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";

export interface PlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits this plot; otherwise it creates a new one. */
  plot?: FarmPlot | null;
  onSubmit: (input: FarmPlotInput) => Promise<unknown>;
  isSubmitting: boolean;
}

interface FormState {
  name: string;
  cropType: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  cropType: "",
  area: "",
  latitude: null,
  longitude: null,
  locationLabel: "",
};

/**
 * Add/edit farm plot form. Location is captured from the browser's current
 * position or by searching a place name and picking a result.
 */
export function PlotFormDialog({
  open,
  onOpenChange,
  plot,
  onSubmit,
  isSubmitting,
}: PlotFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitError(null);
    setQuery("");
    setResults([]);
    setSearchTouched(false);
    if (plot) {
      setForm({
        name: plot.name,
        cropType: plot.cropType,
        area: `${plot.areaHectares}`,
        latitude: plot.latitude,
        longitude: plot.longitude,
        locationLabel: plot.locationLabel,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, plot]);

  useEffect(() => {
    if (!geo.latitude || !geo.longitude) return;
    let cancelled = false;
    setIsResolving(true);
    void reverseGeocode(geo.latitude, geo.longitude).then((label) => {
      if (cancelled) return;
      setForm((prev) => ({
        ...prev,
        latitude: geo.latitude,
        longitude: geo.longitude,
        locationLabel:
          label ??
          formatCoordinates(geo.latitude as number, geo.longitude as number),
      }));
      setIsResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [geo.latitude, geo.longitude]);

  const handleSearch = async () => {
    if (query.trim().length < 3) return;
    setIsSearching(true);
    setSearchTouched(true);
    const found = await searchPlaces(query);
    setResults(found);
    setIsSearching(false);
  };

  const handlePickPlace = async (place: PlaceResult) => {
    setResults([]);
    setQuery(place.displayName);
    setIsResolving(true);
    const label = await reverseGeocode(place.latitude, place.longitude);
    setForm((prev) => ({
      ...prev,
      latitude: place.latitude,
      longitude: place.longitude,
      locationLabel: label ?? place.displayName,
    }));
    setIsResolving(false);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.name.trim().length === 0) next.name = "Enter a plot name.";
    if (form.cropType.trim().length === 0) next.cropType = "Enter a crop type.";
    const area = Number(form.area);
    if (!form.area.trim() || Number.isNaN(area) || area <= 0) {
      next.area = "Enter an area greater than zero.";
    }
    if (form.latitude === null || form.longitude === null) {
      next.location = "Capture a location before saving.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    try {
      await onSubmit({
        name: form.name.trim(),
        cropType: form.cropType.trim(),
        areaHectares: Number(form.area),
        latitude: form.latitude as number,
        longitude: form.longitude as number,
        locationLabel: form.locationLabel,
      });
      onOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  };

  const hasLocation = form.latitude !== null && form.longitude !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="plot.dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {plot ? "Edit plot" : "Register a plot"}
          </DialogTitle>
          <DialogDescription>
            Record the plot's crop, area, and location so it appears on your
            map.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plot-name">Plot name</Label>
              <Input
                id="plot-name"
                data-ocid="plot.name_input"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="North field"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p
                  data-ocid="plot.name_error"
                  className="text-xs text-destructive"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plot-crop">Crop type</Label>
              <Input
                id="plot-crop"
                data-ocid="plot.crop_input"
                value={form.cropType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cropType: event.target.value }))
                }
                placeholder="Winter wheat"
                aria-invalid={!!errors.cropType}
              />
              {errors.cropType && (
                <p
                  data-ocid="plot.crop_error"
                  className="text-xs text-destructive"
                >
                  {errors.cropType}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plot-area">Area (hectares)</Label>
            <Input
              id="plot-area"
              data-ocid="plot.area_input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.area}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, area: event.target.value }))
              }
              placeholder="1.25"
              aria-invalid={!!errors.area}
            />
            {errors.area && (
              <p
                data-ocid="plot.area_error"
                className="text-xs text-destructive"
              >
                {errors.area}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Location
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-ocid="plot.use_location_button"
                onClick={geo.locate}
                disabled={geo.isLocating}
              >
                {geo.isLocating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MapPin className="size-4" />
                )}
                Use my location
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                data-ocid="plot.place_search_input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder="Search a place name"
                aria-label="Search a place name"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-ocid="plot.search_button"
                aria-label="Search places"
                onClick={() => void handleSearch()}
                disabled={isSearching || query.trim().length < 3}
              >
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </div>

            {searchTouched && !isSearching && results.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No places found. Try a nearby town or landmark.
              </p>
            )}

            {results.length > 0 && (
              <ul
                data-ocid="plot.search_results"
                className="max-h-40 space-y-1 overflow-y-auto"
              >
                {results.map((place, index) => (
                  <li key={`${place.latitude}-${place.longitude}-${index}`}>
                    <button
                      type="button"
                      data-ocid={`plot.search_result.${index + 1}`}
                      onClick={() => void handlePickPlace(place)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm transition-smooth hover:bg-accent hover:text-accent-foreground"
                    >
                      {place.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {geo.error && (
              <p
                data-ocid="plot.location_error"
                className="text-xs text-destructive"
              >
                {geo.error}
              </p>
            )}

            <div
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                hasLocation
                  ? "border-border bg-card"
                  : "border-dashed border-border text-muted-foreground",
              )}
            >
              <MapPin className="size-4 shrink-0 text-accent" />
              {isResolving ? (
                <span className="text-muted-foreground">
                  Resolving location…
                </span>
              ) : hasLocation ? (
                <span className="min-w-0">
                  <span className="block truncate">{form.locationLabel}</span>
                  <span className="block font-mono text-xs text-muted-foreground tabular-nums">
                    {formatCoordinates(
                      form.latitude as number,
                      form.longitude as number,
                    )}
                  </span>
                </span>
              ) : (
                <span>No location captured yet</span>
              )}
            </div>
            {errors.location && (
              <p
                data-ocid="plot.location_required_error"
                className="text-xs text-destructive"
              >
                {errors.location}
              </p>
            )}
          </div>

          {submitError && (
            <p
              data-ocid="plot.submit_error"
              className="text-sm text-destructive"
            >
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="plot.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="plot.submit_button"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {plot ? "Save changes" : "Add plot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
