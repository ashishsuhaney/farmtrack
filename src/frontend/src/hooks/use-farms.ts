import { createActor } from "@/backend";
import type {
  ActivityType,
  FarmPlot,
  FarmPlotInput,
  FarmerProfile,
  FieldActivity,
  FieldActivityInput,
  PlotId,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const farmKeys = {
  profile: ["profile"] as const,
  plots: ["plots"] as const,
  plot: (plotId: PlotId) => ["plot", plotId.toString()] as const,
  activities: (plotId: PlotId, filter: ActivityType | null) =>
    ["activities", plotId.toString(), filter ?? "all"] as const,
  dashboard: ["dashboard"] as const,
};

/** The caller's saved profile, or null when none exists yet. */
export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: farmKeys.profile,
    queryFn: async (): Promise<FarmerProfile | null> => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

/** All farm plots owned by the caller. */
export function usePlots() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: farmKeys.plots,
    queryFn: async (): Promise<FarmPlot[]> => {
      if (!actor) return [];
      return actor.listPlots();
    },
    enabled: !!actor && !isFetching,
  });
}

/** A single plot by id, or null when it does not exist or is not the caller's. */
export function usePlot(plotId: PlotId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: farmKeys.plot(plotId ?? 0n),
    queryFn: async (): Promise<FarmPlot | null> => {
      if (!actor || plotId === null) return null;
      return actor.getPlot(plotId);
    },
    enabled: !!actor && !isFetching && plotId !== null,
  });
}

/** Activities for a plot, newest first, optionally filtered by type. */
export function useActivities(
  plotId: PlotId | null,
  filter: ActivityType | null,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: farmKeys.activities(plotId ?? 0n, filter),
    queryFn: async (): Promise<FieldActivity[]> => {
      if (!actor || plotId === null) return [];
      return actor.listActivities(plotId, filter);
    },
    enabled: !!actor && !isFetching && plotId !== null,
  });
}

/** Dashboard totals and the most recent activity. */
export function useDashboardSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: farmKeys.dashboard,
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getDashboardSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Create or replace the caller's profile. */
export function useSetProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: FarmerProfile): Promise<FarmerProfile> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProfile(profile.displayName, profile.defaultRegion);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: farmKeys.profile });
    },
  });
}

/** Create a farm plot. */
export function useAddPlot() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FarmPlotInput): Promise<FarmPlot> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addPlot(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: farmKeys.plots });
      void queryClient.invalidateQueries({ queryKey: farmKeys.dashboard });
    },
  });
}

/** Update an existing farm plot. */
export function useUpdatePlot() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      plotId: PlotId;
      input: FarmPlotInput;
    }): Promise<FarmPlot> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updatePlot(args.plotId, args.input);
    },
    onSuccess: (_plot, args) => {
      void queryClient.invalidateQueries({ queryKey: farmKeys.plots });
      void queryClient.invalidateQueries({
        queryKey: farmKeys.plot(args.plotId),
      });
      void queryClient.invalidateQueries({ queryKey: farmKeys.dashboard });
    },
  });
}

/** Delete a farm plot and its activities. */
export function useDeletePlot() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plotId: PlotId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deletePlot(plotId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: farmKeys.plots });
      void queryClient.invalidateQueries({ queryKey: farmKeys.dashboard });
    },
  });
}

/** Log an activity against a plot. */
export function useAddActivity() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FieldActivityInput): Promise<FieldActivity> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addActivity(input);
    },
    onSuccess: (_activity, input) => {
      void queryClient.invalidateQueries({
        queryKey: ["activities", input.plotId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: farmKeys.dashboard });
    },
  });
}
