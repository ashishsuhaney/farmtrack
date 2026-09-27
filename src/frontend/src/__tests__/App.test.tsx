import App from "@/App";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockBackendActor,
  createMockActor,
  makePlot,
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

vi.mock("@/hooks/use-weather", () => ({
  useWeather: () => ({ data: undefined, isLoading: false, isError: false }),
}));

beforeEach(() => {
  resetFixtureCounters();
  actorRef.current = createMockActor();
});

describe("App", () => {
  it("renders the dashboard on the default route without a blank screen", async () => {
    actorRef.current = createMockActor({
      listPlots: async () => [makePlot({ name: "Home field" })],
      getDashboardSummary: async () => ({
        totalFarms: 1n,
        totalAreaHectares: 1.5,
        mostRecentActivity: undefined,
      }),
    });

    renderWithQueryClient(<App />);

    expect(
      await screen.findByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Home field")).toBeInTheDocument();
    expect(screen.getByTestId("app.content")).toBeInTheDocument();
  });

  it("shows the sign-in screen when the visitor is not authenticated", async () => {
    vi.resetModules();
    vi.doMock("@caffeineai/core-infrastructure", () => ({
      useActor: () => ({ actor: actorRef.current, isFetching: false }),
      useInternetIdentity: () => ({
        identity: undefined,
        isAuthenticated: false,
        isInitializing: false,
        isLoggingIn: false,
        login: vi.fn(),
        clear: vi.fn(),
      }),
    }));

    const { default: UnauthenticatedApp } = await import("@/App");
    renderWithQueryClient(<UnauthenticatedApp />);

    expect(
      await screen.findByRole("button", {
        name: /sign in with internet identity/i,
      }),
    ).toBeInTheDocument();
  });
});
