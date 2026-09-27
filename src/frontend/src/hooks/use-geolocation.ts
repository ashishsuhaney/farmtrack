import { useCallback, useEffect, useRef, useState } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLocating: boolean;
  error: string | null;
}

export interface UseGeolocationResult extends GeolocationState {
  /** Request the browser's current position once. */
  locate: () => void;
}

const INITIAL_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  isLocating: false,
  error: null,
};

/**
 * Thin wrapper over the browser Geolocation API that exposes a one-shot
 * `locate()` call plus loading and error state for form flows.
 */
export function useGeolocation(): UseGeolocationResult {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: "Location is not available in this browser.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLocating: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLocating: false,
          error: null,
        });
      },
      (error) => {
        if (!mountedRef.current) return;
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Search for a place instead."
            : "Could not determine your location. Try again or search for a place.";
        setState((prev) => ({ ...prev, isLocating: false, error: message }));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, []);

  return { ...state, locate };
}
