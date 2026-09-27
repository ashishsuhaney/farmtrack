# Design Brief

## Direction

Field Ledger — a precision farm-operations console where every plot, hectare, and field activity reads like an entry in a working land record.

## Tone

Organic instrument-panel: dark forest-ink surfaces with a vivid chlorophyll primary, rejecting the warm-amber/sage/cream farm cliché in favor of something that reads like a field tool, not a lifestyle app.

## Differentiation

Map markers and plot cards share one "signal" visual language — a pulsing lime ring on the map that echoes the same accent stripe on the matching plot card, so the map and the list feel like one instrument.

## Color Palette

| Token      | OKLCH         | Role                                    |
| ---------- | ------------- | --------------------------------------- |
| background | 0.155 0.022 152 | Forest-ink app canvas (dark primary)   |
| foreground | 0.93 0.012 148  | Soft green-tinted body text             |
| card       | 0.195 0.026 152 | Elevated plot/activity surfaces         |
| primary    | 0.72 0.17 150   | Chlorophyll green — actions, active nav |
| accent     | 0.82 0.18 126   | Signal lime — map markers, highlights   |
| muted      | 0.235 0.028 152 | Inset panels, timeline rails, chips     |

## Typography

- Display: Fraunces — page titles, plot names, hero numbers (organic editorial serif, signals land/growth)
- Body: Figtree — UI labels, notes, forms, dense data (clean geometric, high legibility outdoors)
- Mono: Geist Mono — coordinates, hectares, dates, weather readouts (tabular alignment)
- Scale: hero `text-4xl md:text-6xl font-display tracking-tight`, h2 `text-2xl md:text-3xl font-display`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base`

## Elevation & Depth

Three-layer surface hierarchy (background → card → popover) with hairline `border` edges; shadows are subtle and green-tinted, reserved for map overlays and floating plot cards.

## Structural Zones

| Zone    | Background       | Border     | Notes                                              |
| ------- | ---------------- | ---------- | -------------------------------------------------- |
| Header  | `bg-card`        | `border-b` | Sticky, holds app title + region selector          |
| Content | `bg-background`  | —          | Alternating `bg-muted/30` sections; map is full-bleed |
| Sidebar | `bg-sidebar`     | `border-r` | Desktop nav: dashboard, map, plots, profile        |
| Footer  | `bg-muted/40`    | `border-t` | Compact legal/status strip, muted text             |

## Spacing & Rhythm

Section gaps `py-8 md:py-12`, card padding `p-4 md:p-6`, micro-spacing `gap-2`/`gap-3` for dense data rows; map view breaks the rhythm with full-bleed edge-to-edge layout.

## Component Patterns

- Buttons: 6px radius, `bg-primary` solid for primary, `bg-secondary` for secondary, `text-destructive` ghost for delete; hover lifts with `shadow-elevated`
- Cards: 6px radius, `bg-card` with hairline border, `shadow-subtle`; plot cards get a 3px left accent stripe
- Badges: pill (`rounded-full`), `bg-muted` with `text-muted-foreground`; activity types use tinted `chart-*` backgrounds

## Motion

- Entrance: `animate-fade-in-up` staggered 40ms on card grids and timeline entries
- Hover: `transition-smooth` 250ms on all interactive surfaces; buttons lift shadow
- Decorative: `animate-marker-pulse` on the selected map marker ring only — one motion story

## Constraints

- Dark mode is the primary theme; light mode is a tuned counterpart, not an inversion
- No raw color literals or arbitrary color classes — semantic tokens only
- Map tiles are OpenStreetMap; markers must stay legible over any tile imagery

## Signature Detail

The pulsing lime "signal ring" marker — a live field beacon that ties the map, the plot card, and the activity timeline into a single visual system.
