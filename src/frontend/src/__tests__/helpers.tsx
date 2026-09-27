import type {
  ActivityType,
  DashboardSummary,
  FarmPlot,
  FarmPlotInput,
  FarmerProfile,
  FieldActivity,
  FieldActivityInput,
  PlotId,
} from "@/backend";
import { ActivityType as ActivityTypeEnum } from "@/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * A typed stand-in for the generated backend actor. Every method the frontend
 * calls is present, so a test that forgets to stub one fails loudly instead of
 * silently returning undefined. This is a local mock: it proves nothing about
 * the real canister, which the PocketIC lane covers separately.
 */
export interface MockBackendActor {
  getProfile: () => Promise<FarmerProfile | null>;
  setProfile: (
    displayName: string,
    defaultRegion: string,
  ) => Promise<FarmerProfile>;
  listPlots: () => Promise<FarmPlot[]>;
  getPlot: (plotId: PlotId) => Promise<FarmPlot | null>;
  addPlot: (input: FarmPlotInput) => Promise<FarmPlot>;
  updatePlot: (plotId: PlotId, input: FarmPlotInput) => Promise<FarmPlot>;
  deletePlot: (plotId: PlotId) => Promise<boolean>;
  listActivities: (
    plotId: PlotId,
    filter: ActivityType | null,
  ) => Promise<FieldActivity[]>;
  addActivity: (input: FieldActivityInput) => Promise<FieldActivity>;
  getDashboardSummary: () => Promise<DashboardSummary>;
}

export function createMockActor(
  overrides: Partial<MockBackendActor> = {},
): MockBackendActor {
  const actor: MockBackendActor = {
    getProfile: async () => null,
    setProfile: async (displayName, defaultRegion) => ({
      displayName,
      defaultRegion,
    }),
    listPlots: async () => [],
    getPlot: async () => null,
    addPlot: async (input) => makePlot({ ...input }),
    updatePlot: async (plotId, input) => makePlot({ ...input, id: plotId }),
    deletePlot: async () => true,
    listActivities: async () => [],
    addActivity: async (input) => makeActivity(input),
    getDashboardSummary: async () => ({
      totalFarms: 0n,
      totalAreaHectares: 0,
      mostRecentActivity: undefined,
    }),
    ...overrides,
  };
  return actor;
}

let plotCounter = 0;

export function makePlot(overrides: Partial<FarmPlot> = {}): FarmPlot {
  plotCounter += 1;
  const now = BigInt(Date.now()) * 1_000_000n;
  return {
    id: BigInt(plotCounter),
    name: `Plot ${plotCounter}`,
    cropType: "Maize",
    areaHectares: 1.5,
    latitude: -0.3031,
    longitude: 36.08,
    locationLabel: "Nairobi, Kenya",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

let activityCounter = 0;

export function makeActivity(
  overrides: Partial<FieldActivity> = {},
): FieldActivity {
  activityCounter += 1;
  const now = BigInt(Date.now()) * 1_000_000n;
  return {
    id: BigInt(activityCounter),
    plotId: 1n,
    activityType: ActivityTypeEnum.planting,
    date: now,
    notes: "",
    createdAt: now,
    ...overrides,
  };
}

/** Reset the deterministic id counters between tests. */
export function resetFixtureCounters(): void {
  plotCounter = 0;
  activityCounter = 0;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

export function renderWithQueryClient(
  ui: ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {},
) {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
