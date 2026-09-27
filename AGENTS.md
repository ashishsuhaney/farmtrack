# Project Guidance

## User Preferences

- Map-connected farm tracking is the core purpose
- Maps use OpenStreetMap tiles with browser geolocation; no Google Maps SDK
- Each farmer's data is private to their own account

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- useGeolocation returns a fresh object each render; effects must depend on the stable locate callback, not the geo object.
- React attaches onWheel as a passive listener; attach a native wheel listener with { passive: false } to make preventDefault work.
- In Motoko, `?arr[0]` can bind the option to the array rather than the element; bind the indexed element to a local first, then wrap it in `?`.
- Enhanced migration chain enforces at most one pending migration per build (check-limit=1); fold changes into the latest pending file.
- OQL manual mode (OQL.Entity.manual) requires an explicit .payload(...) per column; variant fields must be converted to Text.
- OpenStreetMap raster tiles need no SDK: project lat/lng via Web Mercator and offset tiles by center world coords.
- Nominatim requires a descriptive User-Agent and returns lat/lon as strings; Open-Meteo needs no API key.
- The persistent suite lives in src/frontend/src/__tests__/ plus the PocketIC lane in test/pocketic/; run it with the root test script.
