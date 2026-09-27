import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/farms";

module {
  /// Mutable state owned by the actor and shared with the farms API mixin.
  public type FarmState = {
    profiles : Map.Map<Principal, Types.FarmerProfile>;
    plots : Map.Map<Principal, List.List<Types.FarmPlot>>;
    activities : Map.Map<Principal, List.List<Types.FieldActivity>>;
    var nextPlotId : Nat;
    var nextActivityId : Nat;
  };

  func isBlank(text : Text) : Bool {
    text.trim(#predicate(func c = c == ' ' or c == '\t' or c == '\n' or c == '\r')).size() == 0;
  };

  func validatePlotInput(name : Text, areaHectares : Float, latitude : Float, longitude : Float) : ?Text {
    if (isBlank(name)) {
      return ?"name must not be empty";
    };
    if (areaHectares <= 0.0) {
      return ?"areaHectares must be greater than zero";
    };
    if (latitude < -90.0 or latitude > 90.0) {
      return ?"latitude must be between -90 and 90";
    };
    if (longitude < -180.0 or longitude > 180.0) {
      return ?"longitude must be between -180 and 180";
    };
    null;
  };

  func plotsOf(state : FarmState, caller : Principal) : List.List<Types.FarmPlot> {
    switch (state.plots.get(caller)) {
      case (?plots) { plots };
      case null { List.empty() };
    };
  };

  func activitiesOf(state : FarmState, caller : Principal) : List.List<Types.FieldActivity> {
    switch (state.activities.get(caller)) {
      case (?activities) { activities };
      case null { List.empty() };
    };
  };

  func mutablePlotsOf(state : FarmState, caller : Principal) : List.List<Types.FarmPlot> {
    switch (state.plots.get(caller)) {
      case (?plots) { plots };
      case null {
        let plots = List.empty<Types.FarmPlot>();
        state.plots.add(caller, plots);
        plots;
      };
    };
  };

  func mutableActivitiesOf(state : FarmState, caller : Principal) : List.List<Types.FieldActivity> {
    switch (state.activities.get(caller)) {
      case (?activities) { activities };
      case null {
        let activities = List.empty<Types.FieldActivity>();
        state.activities.add(caller, activities);
        activities;
      };
    };
  };

  /// Return the caller's profile, or null when none has been saved yet.
  public func getProfile(state : FarmState, caller : Principal) : ?Types.FarmerProfile {
    state.profiles.get(caller);
  };

  /// Create or replace the caller's profile.
  public func setProfile(state : FarmState, caller : Principal, displayName : Text, defaultRegion : Text) : Types.FarmerProfile {
    let profile : Types.FarmerProfile = { displayName; defaultRegion };
    state.profiles.add(caller, profile);
    profile;
  };

  /// List all farm plots owned by the caller.
  public func listPlots(state : FarmState, caller : Principal) : [Types.FarmPlot] {
    plotsOf(state, caller).toArray();
  };

  /// Return one of the caller's plots, or null when it does not exist or is not theirs.
  public func getPlot(state : FarmState, caller : Principal, plotId : Types.PlotId) : ?Types.FarmPlot {
    plotsOf(state, caller).find(func plot = plot.id == plotId);
  };

  /// Create a farm plot owned by the caller.
  public func addPlot(state : FarmState, caller : Principal, input : Types.FarmPlotInput) : Types.FarmPlot {
    switch (validatePlotInput(input.name, input.areaHectares, input.latitude, input.longitude)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    let now = Time.now();
    let plot : Types.FarmPlot = {
      id = state.nextPlotId;
      name = input.name;
      cropType = input.cropType;
      areaHectares = input.areaHectares;
      latitude = input.latitude;
      longitude = input.longitude;
      locationLabel = input.locationLabel;
      createdAt = now;
      updatedAt = now;
    };
    state.nextPlotId += 1;
    mutablePlotsOf(state, caller).add(plot);
    plot;
  };

  /// Update one of the caller's plots.
  public func updatePlot(state : FarmState, caller : Principal, plotId : Types.PlotId, input : Types.FarmPlotUpdate) : Types.FarmPlot {
    switch (validatePlotInput(input.name, input.areaHectares, input.latitude, input.longitude)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    let plots = mutablePlotsOf(state, caller);
    let existing = plots.find(func plot = plot.id == plotId)
      ?? Runtime.trap("plot not found");
    let updated : Types.FarmPlot = {
      id = existing.id;
      name = input.name;
      cropType = input.cropType;
      areaHectares = input.areaHectares;
      latitude = input.latitude;
      longitude = input.longitude;
      locationLabel = input.locationLabel;
      createdAt = existing.createdAt;
      updatedAt = Time.now();
    };
    plots.mapInPlace(func plot = if (plot.id == plotId) { updated } else { plot });
    updated;
  };

  /// Delete one of the caller's plots and its activities.
  public func deletePlot(state : FarmState, caller : Principal, plotId : Types.PlotId) : Bool {
    let plots = mutablePlotsOf(state, caller);
    var removed = false;
    let plotSnapshot = plots.toArray();
    plots.clear();
    for (plot in plotSnapshot.values()) {
      if (plot.id == plotId) {
        removed := true;
      } else {
        plots.add(plot);
      };
    };
    if (removed) {
      let activities = mutableActivitiesOf(state, caller);
      let activitySnapshot = activities.toArray();
      activities.clear();
      for (activity in activitySnapshot.values()) {
        if (activity.plotId != plotId) {
          activities.add(activity);
        };
      };
    };
    removed;
  };

  /// List the caller's activities for a plot, newest first, optionally filtered by type.
  public func listActivities(state : FarmState, caller : Principal, plotId : Types.PlotId, filter : ?Types.ActivityType) : [Types.FieldActivity] {
    let matching = activitiesOf(state, caller).filter(func activity = activity.plotId == plotId);
    let filtered = switch (filter) {
      case (?activityType) { matching.filter(func activity = activity.activityType == activityType) };
      case null { matching };
    };
    filtered.toArray().sort(func (a, b) = Int.compare(b.date, a.date));
  };

  /// Log an activity against one of the caller's plots.
  public func addActivity(state : FarmState, caller : Principal, input : Types.FieldActivityInput) : Types.FieldActivity {
    switch (getPlot(state, caller, input.plotId)) {
      case null { Runtime.trap("plot not found") };
      case (?_) {};
    };
    let activity : Types.FieldActivity = {
      id = state.nextActivityId;
      plotId = input.plotId;
      activityType = input.activityType;
      date = input.date;
      notes = input.notes;
      createdAt = Time.now();
    };
    state.nextActivityId += 1;
    mutableActivitiesOf(state, caller).add(activity);
    activity;
  };

  /// Summarize the caller's farms, total area, and most recent activity.
  public func getDashboardSummary(state : FarmState, caller : Principal) : Types.DashboardSummary {
    let plots = plotsOf(state, caller).toArray();
    let totalAreaHectares = plots.foldLeft(
      0.0,
      func(acc, plot) = acc + plot.areaHectares,
    );
    let plotIds = plots.map(func plot = plot.id);
    let activities = activitiesOf(state, caller).toArray().filter(
      func activity = plotIds.contains(activity.plotId)
    );
    let mostRecentActivity : ?Types.FieldActivity = if (activities.size() == 0) {
      null;
    } else {
      let sorted = activities.sort(func (a, b) = Int.compare(b.date, a.date));
      let first = sorted[0];
      ?first;
    };
    {
      totalFarms = plots.size();
      totalAreaHectares;
      mostRecentActivity;
    };
  };
};
