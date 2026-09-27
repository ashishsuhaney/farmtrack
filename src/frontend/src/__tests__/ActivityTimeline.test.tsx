import { ActivityType as ActivityTypeEnum } from "@/backend";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockBackendActor,
  createMockActor,
  makeActivity,
  renderWithQueryClient,
  resetFixtureCounters,
} from "./helpers";

const actorRef: { current: MockBackendActor } = {
  current: createMockActor(),
};

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

const day = (iso: string) => BigInt(new Date(iso).getTime()) * 1_000_000n;

beforeEach(() => {
  resetFixtureCounters();
  actorRef.current = createMockActor();
});

describe("ActivityTimeline", () => {
  it("renders activities newest first with type and date", async () => {
    const activities = [
      makeActivity({
        activityType: ActivityTypeEnum.harvest,
        date: day("2026-03-20T12:00:00Z"),
        notes: "Harvested the north row",
      }),
      makeActivity({
        activityType: ActivityTypeEnum.planting,
        date: day("2026-03-01T12:00:00Z"),
        notes: "Planted the seed",
      }),
    ];
    actorRef.current = createMockActor({
      listActivities: async () => activities,
    });

    renderWithQueryClient(<ActivityTimeline plotId={1n} />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    // The backend returns newest first; the component preserves that order.
    expect(within(items[0]).getByText("Harvest")).toBeInTheDocument();
    expect(
      within(items[0]).getByText("Harvested the north row"),
    ).toBeInTheDocument();
    expect(within(items[1]).getByText("Planting")).toBeInTheDocument();
    expect(within(items[1]).getByText("Planted the seed")).toBeInTheDocument();
  });

  it("filters the timeline by activity type", async () => {
    const user = userEvent.setup();
    const listActivities = vi.fn(
      async (_plotId: bigint, filter: ActivityTypeEnum | null) => {
        const all = [
          makeActivity({
            activityType: ActivityTypeEnum.harvest,
            date: day("2026-03-20T12:00:00Z"),
            notes: "Harvest entry",
          }),
          makeActivity({
            activityType: ActivityTypeEnum.irrigation,
            date: day("2026-03-10T12:00:00Z"),
            notes: "Irrigation entry",
          }),
        ];
        return filter === null
          ? all
          : all.filter((activity) => activity.activityType === filter);
      },
    );
    actorRef.current = createMockActor({ listActivities });

    renderWithQueryClient(<ActivityTimeline plotId={1n} />);

    expect(await screen.findByText("Harvest entry")).toBeInTheDocument();
    expect(screen.getByText("Irrigation entry")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Irrigation" }));

    await waitFor(() =>
      expect(listActivities).toHaveBeenLastCalledWith(
        1n,
        ActivityTypeEnum.irrigation,
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText("Harvest entry")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Irrigation entry")).toBeInTheDocument();
  });

  it("shows an empty state when no activity matches the filter", async () => {
    const user = userEvent.setup();
    actorRef.current = createMockActor({
      listActivities: async (_plotId, filter) =>
        filter === null
          ? [
              makeActivity({
                activityType: ActivityTypeEnum.planting,
                date: day("2026-03-01T12:00:00Z"),
              }),
            ]
          : [],
    });

    renderWithQueryClient(<ActivityTimeline plotId={1n} />);
    await screen.findByText("Planting");

    await user.click(screen.getByRole("button", { name: "Harvest" }));

    expect(
      await screen.findByText(/no entries match this filter/i),
    ).toBeInTheDocument();
  });
});
