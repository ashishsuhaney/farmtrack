import { ActivityType as ActivityTypeEnum } from "@/backend";
import { PlotDetailPage } from "@/pages/PlotDetailPage";
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
  useParams: () => ({ plotId: "1" }),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...rest}>
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

const weatherPayload = {
  current: {
    temperature_2m: 22,
    apparent_temperature: 21,
    relative_humidity_2m: 50,
    wind_speed_10m: 9,
    weather_code: 0,
    is_day: 1,
  },
  daily: {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_probability_max: [],
  },
};

beforeEach(() => {
  resetFixtureCounters();
  navigate.mockReset();
  actorRef.current = createMockActor();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        ({ ok: true, json: async () => weatherPayload }) as unknown as Response,
    ),
  );
});

describe("PlotDetailPage", () => {
  it("renders the plot header, weather, and activity timeline", async () => {
    const plot = makePlot({
      name: "Riverside",
      cropType: "Rice",
      areaHectares: 4.25,
      locationLabel: "Nairobi, Kenya",
    });
    actorRef.current = createMockActor({
      getPlot: async () => plot,
      listActivities: async () => [
        makeActivity({
          plotId: plot.id,
          activityType: ActivityTypeEnum.planting,
          date: BigInt(new Date("2026-03-01T12:00:00Z").getTime()) * 1_000_000n,
          notes: "Seeded",
        }),
      ],
    });

    renderWithQueryClient(<PlotDetailPage />);

    expect(
      await screen.findByRole("heading", { name: "Riverside" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("4.25 ha")).toBeInTheDocument();
    expect(screen.getByText("Nairobi, Kenya")).toBeInTheDocument();

    // Weather for the plot's coordinates.
    expect(await screen.findByText("22°")).toBeInTheDocument();

    // Activity timeline.
    expect(await screen.findByText("Seeded")).toBeInTheDocument();
    const activityItem = screen.getByText("Seeded").closest("li");
    expect(activityItem).not.toBeNull();
    expect(
      within(activityItem as HTMLElement).getByText("Planting"),
    ).toBeInTheDocument();
  });

  it("logs an activity against the plot", async () => {
    const user = userEvent.setup();
    const plot = makePlot({ name: "Riverside" });
    const addActivity = vi.fn(async (input) => makeActivity(input));
    actorRef.current = createMockActor({
      getPlot: async () => plot,
      addActivity,
    });

    renderWithQueryClient(<PlotDetailPage />);
    await screen.findByRole("heading", { name: "Riverside" });

    await user.click(screen.getByRole("button", { name: /log activity/i }));

    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Notes"),
      "Applied fertilizer",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /log activity/i }),
    );

    await waitFor(() => expect(addActivity).toHaveBeenCalledTimes(1));
    expect(addActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        plotId: plot.id,
        activityType: ActivityTypeEnum.planting,
        notes: "Applied fertilizer",
      }),
    );
  });

  it("shows a not-found state when the plot does not exist", async () => {
    actorRef.current = createMockActor({ getPlot: async () => null });

    renderWithQueryClient(<PlotDetailPage />);

    expect(await screen.findByText("Plot not found")).toBeInTheDocument();
  });

  it("deletes the plot after confirmation and returns to the dashboard", async () => {
    const user = userEvent.setup();
    const plot = makePlot({ name: "Riverside" });
    const deletePlot = vi.fn(async () => true);
    actorRef.current = createMockActor({
      getPlot: async () => plot,
      deletePlot,
    });

    renderWithQueryClient(<PlotDetailPage />);
    await screen.findByRole("heading", { name: "Riverside" });

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: /delete plot/i }),
    );

    await waitFor(() => expect(deletePlot).toHaveBeenCalledWith(plot.id));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/" }));
  });
});
