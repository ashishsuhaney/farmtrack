import { ProfilePage } from "@/pages/ProfilePage";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockBackendActor,
  createMockActor,
  makePlot,
  renderWithQueryClient,
  resetFixtureCounters,
} from "./helpers";

const clear = vi.fn();
const actorRef: { current: MockBackendActor } = {
  current: createMockActor(),
};

const identity = {
  getPrincipal: () => ({
    toText: () => "aaaaa-aa",
  }),
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
  useInternetIdentity: () => ({
    identity,
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear,
  }),
}));

beforeEach(() => {
  resetFixtureCounters();
  clear.mockReset();
  actorRef.current = createMockActor();
});

describe("ProfilePage", () => {
  it("loads the saved profile into the form", async () => {
    actorRef.current = createMockActor({
      getProfile: async () => ({
        displayName: "Ada Okonkwo",
        defaultRegion: "Central Valley, CA",
      }),
    });

    renderWithQueryClient(<ProfilePage />);

    expect(await screen.findByDisplayValue("Ada Okonkwo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Central Valley, CA")).toBeInTheDocument();
  });

  it("saves an edited profile", async () => {
    const user = userEvent.setup();
    const setProfile = vi.fn(async (displayName, defaultRegion) => ({
      displayName,
      defaultRegion,
    }));
    actorRef.current = createMockActor({
      getProfile: async () => ({
        displayName: "Ada",
        defaultRegion: "Nairobi",
      }),
      setProfile,
    });

    renderWithQueryClient(<ProfilePage />);
    const nameInput = await screen.findByDisplayValue("Ada");

    await user.clear(nameInput);
    await user.type(nameInput, "Ada Okonkwo");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() =>
      expect(setProfile).toHaveBeenCalledWith("Ada Okonkwo", "Nairobi"),
    );
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
  });

  it("requires a display name before saving", async () => {
    const user = userEvent.setup();
    const setProfile = vi.fn();
    actorRef.current = createMockActor({
      getProfile: async () => ({
        displayName: "Ada",
        defaultRegion: "Nairobi",
      }),
      setProfile,
    });

    renderWithQueryClient(<ProfilePage />);
    const nameInput = await screen.findByDisplayValue("Ada");

    await user.clear(nameInput);
    // The submit button is disabled while the name is empty, so submit the
    // form directly to exercise the validation branch.
    const form = screen.getByTestId("profile.form");
    await act(async () => {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(
      await screen.findByText(/enter a display name/i),
    ).toBeInTheDocument();
    expect(setProfile).not.toHaveBeenCalled();
  });

  it("summarizes the farmer's plots and area", async () => {
    actorRef.current = createMockActor({
      listPlots: async () => [
        makePlot({ areaHectares: 2 }),
        makePlot({ areaHectares: 3.5 }),
      ],
    });

    renderWithQueryClient(<ProfilePage />);

    const summary = await screen.findByText("Account summary");
    const card = (summary.closest('[data-slot="card"]') ??
      document.body) as HTMLElement;
    expect(await within(card).findByText("2")).toBeInTheDocument();
    expect(within(card).getByText("5.50 ha")).toBeInTheDocument();
  });

  it("shows the caller's principal and signs out", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProfilePage />);

    expect(await screen.findByText("aaaaa-aa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
