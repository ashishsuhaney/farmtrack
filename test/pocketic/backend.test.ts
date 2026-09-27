import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// One canister is shared by the whole file, so each test gets its own
// principal. That keeps a test's plots and activities from leaking into the
// next test's reads, which is what makes the empty-state and summary
// assertions meaningful rather than order-dependent.
let identityCounter = 0;
function freshIdentity(label: string) {
  identityCounter += 1;
  return createIdentity(`${label}-${String(identityCounter)}`);
}

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const PLOT_INPUT = {
  name: "North field",
  cropType: "Wheat",
  areaHectares: 2.5,
  latitude: -0.3031,
  longitude: 36.08,
  locationLabel: "Nairobi, Kenya",
};

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  await pic?.tearDown();
});

describe("backend public API", () => {
  it("answers empty-state reads instead of trapping", async () => {
    actor.setIdentity(freshIdentity("empty"));
    await expect(actor.listPlots()).resolves.toEqual([]);
    await expect(actor.getProfile()).resolves.toEqual([]);
    await expect(actor.getDashboardSummary()).resolves.toMatchObject({
      totalFarms: 0n,
      totalAreaHectares: 0,
      // No activity yet: the optional field is an empty option (`[]`), not a
      // one-element array holding a placeholder.
      mostRecentActivity: [],
    });
  });

  it("round-trips a profile through the real canister", async () => {
    actor.setIdentity(freshIdentity("profile"));
    const saved = await actor.setProfile("Ada Okonkwo", "Central Valley, CA");
    expect(saved).toEqual({
      displayName: "Ada Okonkwo",
      defaultRegion: "Central Valley, CA",
    });
    await expect(actor.getProfile()).resolves.toEqual([
      { displayName: "Ada Okonkwo", defaultRegion: "Central Valley, CA" },
    ]);
  });

  it("creates, reads, updates, and deletes a plot", async () => {
    actor.setIdentity(freshIdentity("plot"));
    const created = await actor.addPlot(PLOT_INPUT);
    expect(created).toMatchObject({
      name: "North field",
      cropType: "Wheat",
      areaHectares: 2.5,
      latitude: -0.3031,
      longitude: 36.08,
      locationLabel: "Nairobi, Kenya",
    });

    await expect(actor.getPlot(created.id)).resolves.toEqual([created]);
    await expect(actor.listPlots()).resolves.toContainEqual(created);

    const updated = await actor.updatePlot(created.id, {
      ...PLOT_INPUT,
      name: "North field (renamed)",
      areaHectares: 3,
    });
    expect(updated).toMatchObject({
      id: created.id,
      name: "North field (renamed)",
      areaHectares: 3,
    });

    await expect(actor.deletePlot(created.id)).resolves.toBe(true);
    await expect(actor.getPlot(created.id)).resolves.toEqual([]);
    await expect(actor.listPlots()).resolves.toEqual([]);
  });

  it("logs activities and filters them by type, newest first", async () => {
    actor.setIdentity(freshIdentity("activity"));
    const plot = await actor.addPlot(PLOT_INPUT);

    const older = await actor.addActivity({
      plotId: plot.id,
      activityType: { planting: null },
      date: 1_000_000_000n,
      notes: "Planted",
    });
    const newer = await actor.addActivity({
      plotId: plot.id,
      activityType: { harvest: null },
      date: 2_000_000_000n,
      notes: "Harvested",
    });

    const all = await actor.listActivities(plot.id, []);
    expect(all.map((activity) => activity.id)).toEqual([newer.id, older.id]);

    const harvestOnly = await actor.listActivities(plot.id, [{ harvest: null }]);
    expect(harvestOnly).toHaveLength(1);
    expect(harvestOnly[0]).toMatchObject({
      id: newer.id,
      activityType: { harvest: null },
      notes: "Harvested",
    });
  });

  it("summarizes farms, total area, and the most recent activity", async () => {
    actor.setIdentity(freshIdentity("summary"));
    const first = await actor.addPlot({ ...PLOT_INPUT, name: "A", areaHectares: 2 });
    await actor.addPlot({ ...PLOT_INPUT, name: "B", areaHectares: 3.5 });
    await actor.addActivity({
      plotId: first.id,
      activityType: { irrigation: null },
      date: 5_000_000_000n,
      notes: "Watered",
    });

    const summary = await actor.getDashboardSummary();
    expect(summary.totalFarms).toBe(2n);
    expect(summary.totalAreaHectares).toBeCloseTo(5.5);
    // `mostRecentActivity` is a Candid `Opt(FieldActivity)`, which the
    // declarations encode as `[] | [FieldActivity]`. Unwrap the option and
    // assert the single activity, not a one-element array.
    expect(summary.mostRecentActivity).toHaveLength(1);
    expect(summary.mostRecentActivity[0]).toMatchObject({
      activityType: { irrigation: null },
      notes: "Watered",
    });
  });

  it("keeps each farmer's plots and activity private", async () => {
    const alice = freshIdentity("alice");
    const bob = freshIdentity("bob");
    actor.setIdentity(alice);
    const alicePlot = await actor.addPlot({ ...PLOT_INPUT, name: "Alice field" });
    await actor.addActivity({
      plotId: alicePlot.id,
      activityType: { planting: null },
      date: 1n,
      notes: "Alice only",
    });

    actor.setIdentity(bob);
    await expect(actor.listPlots()).resolves.toEqual([]);
    await expect(actor.getPlot(alicePlot.id)).resolves.toEqual([]);
    await expect(actor.listActivities(alicePlot.id, [])).resolves.toEqual([]);
    await expect(actor.getDashboardSummary()).resolves.toMatchObject({
      totalFarms: 0n,
    });

    // Bob cannot delete Alice's plot either.
    await expect(actor.deletePlot(alicePlot.id)).resolves.toBe(false);

    actor.setIdentity(alice);
    await expect(actor.listPlots()).resolves.toHaveLength(1);
  });
});
