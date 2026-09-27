import Types "../types/farms";
import FarmsLib "../lib/farms";

mixin (state : FarmsLib.FarmState) {
  /// Return the caller's profile, or null when none has been saved yet.
  public query ({ caller }) func getProfile() : async ?Types.FarmerProfile {
    FarmsLib.getProfile(state, caller);
  };

  /// Create or replace the caller's profile.
  public shared ({ caller }) func setProfile(displayName : Text, defaultRegion : Text) : async Types.FarmerProfile {
    FarmsLib.setProfile(state, caller, displayName, defaultRegion);
  };

  /// List all farm plots owned by the caller.
  public query ({ caller }) func listPlots() : async [Types.FarmPlot] {
    FarmsLib.listPlots(state, caller);
  };

  /// Return one of the caller's plots, or null when it does not exist or is not theirs.
  public query ({ caller }) func getPlot(plotId : Types.PlotId) : async ?Types.FarmPlot {
    FarmsLib.getPlot(state, caller, plotId);
  };

  /// Create a farm plot owned by the caller.
  public shared ({ caller }) func addPlot(input : Types.FarmPlotInput) : async Types.FarmPlot {
    FarmsLib.addPlot(state, caller, input);
  };

  /// Update one of the caller's plots.
  public shared ({ caller }) func updatePlot(plotId : Types.PlotId, input : Types.FarmPlotUpdate) : async Types.FarmPlot {
    FarmsLib.updatePlot(state, caller, plotId, input);
  };

  /// Delete one of the caller's plots and its activities.
  public shared ({ caller }) func deletePlot(plotId : Types.PlotId) : async Bool {
    FarmsLib.deletePlot(state, caller, plotId);
  };

  /// List the caller's activities for a plot, newest first, optionally filtered by type.
  public query ({ caller }) func listActivities(plotId : Types.PlotId, filter : ?Types.ActivityType) : async [Types.FieldActivity] {
    FarmsLib.listActivities(state, caller, plotId, filter);
  };

  /// Log an activity against one of the caller's plots.
  public shared ({ caller }) func addActivity(input : Types.FieldActivityInput) : async Types.FieldActivity {
    FarmsLib.addActivity(state, caller, input);
  };

  /// Summarize the caller's farms, total area, and most recent activity.
  public query ({ caller }) func getDashboardSummary() : async Types.DashboardSummary {
    FarmsLib.getDashboardSummary(state, caller);
  };
};
