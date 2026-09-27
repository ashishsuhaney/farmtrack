import { MapPage } from "@/pages/MapPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockBackendActor,
  createMockActor,
  makePlot,
  renderWithQueryClient,
  resetFixtureCounters,
} from "./helpers";

const navigate = vi.fn();
const actorRef: { current: MockBackendActor } = {
  current: createMockActor(),
};

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  }) => (
    <a
      href={params ? to.replace("$plotId", params.plotId ?? "") : to}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
  useInternetIdentity: () => ({
    identity: undefined,
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
  }),
}));

vi.mock("@/lib/geocode", () => ({
  searchPlaces: vi.fn(async () => []),
  reverseGeocode: vi.fn(async () => "Nairobi, Kenya"),
}));

beforeEach(() => {
  resetFixtureCounters();
  navigate.mockReset();
  actorRef.current = createMockActor();
});

describe("MapPage", () => {
  it("renders an OpenStreetMap tile and a marker for every saved plot", async () => {
    const plots = [
      makePlot({ name: "North field", latitude: -0.3031, longitude: 36.08 }),
      makePlot({
        name: "South field",
        latitude: -1.286389,
        longitude: 36.817223,
      }),
    ];
    actorRef.current = createMockActor({ listPlots: async () => plots });

    renderWithQueryClient(<MapPage />);

    expect(
      await screen.findByRole("button", { name: "North field plot marker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "South field plot marker" }),
    ).toBeInTheDocument();

    // Tiles are raster images served from the OpenStreetMap tile server.
    const tiles = document.querySelectorAll(
      'img[src*="tile.openstreetmap.org"]',
    );
    expect(tiles.length).toBeGreaterThan(0);
  });

  it("opens a plot summary card when a marker is clicked", async () => {
    const user = userEvent.setup();
    const plot = makePlot({
      name: "Riverside",
      cropType: "Rice",
      areaHectares: 4.25,
      locationLabel: "Nairobi, Kenya",
    });
    actorRef.current = createMockActor({ listPlots: async () => [plot] });

    renderWithQueryClient(<MapPage />);

    await user.click(
      await screen.findByRole("button", { name: "Riverside plot marker" }),
    );

    const card = await screen.findByText("Riverside");
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("4.25 ha")).toBeInTheDocument();
    expect(screen.getByText("Nairobi, Kenya")).toBeInTheDocument();
  });

  it("shows the empty state and prompts to add a first plot", async () => {
    renderWithQueryClient(<MapPage />);

    expect(await screen.findByText("Map your first plot")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add your first plot/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the plot detail view from the summary card", async () => {
    const user = userEvent.setup();
    const plot = makePlot({ name: "Riverside" });
    actorRef.current = createMockActor({ listPlots: async () => [plot] });

    renderWithQueryClient(<MapPage />);

    await user.click(
      await screen.findByRole("button", { name: "Riverside plot marker" }),
    );
    await user.click(
      await screen.findByRole("button", { name: /add activity/i }),
    );

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/plots/$plotId",
        params: { plotId: plot.id.toString() },
      }),
    );
  });

  it("zooms in and out with the map controls", async () => {
    const user = userEvent.setup();
    actorRef.current = createMockActor({
      listPlots: async () => [makePlot({ name: "Zoom plot" })],
    });

    renderWithQueryClient(<MapPage />);
    await screen.findByRole("button", { name: "Zoom plot plot marker" });

    const canvas = screen.getByTestId("map.canvas");
    const zoomLevels = () =>
      new Set(
        Array.from(
          canvas.querySelectorAll<HTMLImageElement>(
            'img[src*="tile.openstreetmap.org"]',
          ),
        ).map((img) => img.src.match(/openstreetmap\.org\/(\d+)\//)?.[1]),
      );

    const before = zoomLevels();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));

    await waitFor(() => expect(zoomLevels()).not.toEqual(before));
    expect(
      screen.getByRole("button", { name: "Zoom plot plot marker" }),
    ).toBeInTheDocument();
  });
});
