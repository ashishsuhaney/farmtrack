import { ActivityType as ActivityTypeEnum } from "@/backend";
import { DashboardPage } from "@/pages/DashboardPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockBackendActor,
  createMockActor,
  makeActivity,
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

// Place search and reverse geocoding hit Nominatim over the network; stub them
// so the form flow is deterministic and no external request is made.
vi.mock("@/lib/geocode", () => ({
  searchPlaces: vi.fn(async () => [
    {
      displayName: "Nairobi, Kenya",
      latitude: -1.286389,
      longitude: 36.817223,
    },
  ]),
  reverseGeocode: vi.fn(async () => "Nairobi, Kenya"),
}));

// The dashboard renders a compact weather panel for the most recent plot.
// Stub the network so no real Open-Meteo request is made.
vi.mock("@/hooks/use-weather", () => ({
  useWeather: () => ({
    data: {
      temperature: 21,
      apparentTemperature: 20,
      weatherCode: 0,
      windSpeed: 8,
      humidity: 55,
      isDay: true,
      forecast: [],
    },
    isLoading: false,
    isError: false,
  }),
}));

beforeEach(() => {
  resetFixtureCounters();
  navigate.mockReset();
  actorRef.current = createMockActor();
});

describe("DashboardPage", () => {
  it("renders the summary totals and the plot list", async () => {
    const plots = [
      makePlot({ name: "North field", cropType: "Wheat", areaHectares: 2.5 }),
      makePlot({ name: "South field", cropType: "Maize", areaHectares: 1.25 }),
    ];
    actorRef.current = createMockActor({
      listPlots: async () => plots,
      getDashboardSummary: async () => ({
        totalFarms: 2n,
        totalAreaHectares: 3.75,
        mostRecentActivity: undefined,
      }),
    });

    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("North field")).toBeInTheDocument();
    expect(screen.getByText("South field")).toBeInTheDocument();

    const summary = screen.getByLabelText("Farm summary");
    expect(within(summary).getByText("2")).toBeInTheDocument();
    expect(within(summary).getByText("3.75 ha")).toBeInTheDocument();
    expect(within(summary).getByText("No activity")).toBeInTheDocument();
  });

  it("shows the empty state when the farmer has no plots", async () => {
    renderWithQueryClient(<DashboardPage />);

    expect(await screen.findByText("No plots yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add your first plot/i }),
    ).toBeInTheDocument();
  });

  it("adds a plot through the form dialog", async () => {
    const user = userEvent.setup();
    const addPlot = vi.fn(async (input) => makePlot(input));
    actorRef.current = createMockActor({ addPlot });

    renderWithQueryClient(<DashboardPage />);
    await screen.findByText("No plots yet");

    await user.click(screen.getByRole("button", { name: /^add plot$/i }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Plot name"), "River plot");
    await user.type(within(dialog).getByLabelText("Crop type"), "Rice");
    await user.type(within(dialog).getByLabelText("Area (hectares)"), "3.5");

    // Capture a location by searching a place name and picking the result.
    await user.type(
      within(dialog).getByLabelText("Search a place name"),
      "Nairobi",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /search places/i }),
    );
    await user.click(
      await within(dialog).findByRole("button", { name: /nairobi/i }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: /^add plot$/i }),
    );

    await waitFor(() => expect(addPlot).toHaveBeenCalledTimes(1));
    expect(addPlot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "River plot",
        cropType: "Rice",
        areaHectares: 3.5,
        latitude: -1.286389,
        longitude: 36.817223,
      }),
    );
  });

  it("edits an existing plot", async () => {
    const user = userEvent.setup();
    const plot = makePlot({ name: "Old name", cropType: "Barley" });
    const updatePlot = vi.fn(async (plotId, input) =>
      makePlot({ ...input, id: plotId }),
    );
    actorRef.current = createMockActor({
      listPlots: async () => [plot],
      updatePlot,
    });

    renderWithQueryClient(<DashboardPage />);
    await screen.findByText("Old name");

    await user.click(screen.getByRole("button", { name: /^edit$/i }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText("Plot name");
    await user.clear(nameInput);
    await user.type(nameInput, "New name");
    await user.click(
      within(dialog).getByRole("button", { name: /save changes/i }),
    );

    await waitFor(() => expect(updatePlot).toHaveBeenCalledTimes(1));
    expect(updatePlot).toHaveBeenCalledWith(
      plot.id,
      expect.objectContaining({ name: "New name" }),
    );
  });

  it("asks for confirmation before deleting a plot", async () => {
    const user = userEvent.setup();
    const plot = makePlot({ name: "Doomed plot" });
    const deletePlot = vi.fn(async () => true);
    actorRef.current = createMockActor({
      listPlots: async () => [plot],
      deletePlot,
    });

    renderWithQueryClient(<DashboardPage />);
    await screen.findByText("Doomed plot");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/delete doomed plot\?/i),
    ).toBeInTheDocument();
    expect(deletePlot).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: /delete plot/i }),
    );

    await waitFor(() => expect(deletePlot).toHaveBeenCalledWith(plot.id));
  });

  it("renders the most recent activity date in the summary", async () => {
    const plot = makePlot({ name: "Activity plot" });
    const activity = makeActivity({
      plotId: plot.id,
      activityType: ActivityTypeEnum.harvest,
      date: BigInt(new Date("2026-03-12T12:00:00Z").getTime()) * 1_000_000n,
    });
    actorRef.current = createMockActor({
      listPlots: async () => [plot],
      getDashboardSummary: async () => ({
        totalFarms: 1n,
        totalAreaHectares: plot.areaHectares,
        mostRecentActivity: activity,
      }),
      listActivities: async () => [activity],
    });

    renderWithQueryClient(<DashboardPage />);

    const summary = screen.getByLabelText("Farm summary");
    expect(await within(summary).findByText(/2026/)).toBeInTheDocument();
  });
});
