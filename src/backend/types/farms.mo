import Common "common";

module {
  public type PlotId = Common.PlotId;
  public type ActivityId = Common.ActivityId;
  public type Timestamp = Common.Timestamp;

  /// A farmer's profile. Private to the owning principal.
  public type FarmerProfile = {
    displayName : Text;
    defaultRegion : Text;
  };

  /// A farm plot owned by a farmer.
  public type FarmPlot = {
    id : PlotId;
    name : Text;
    cropType : Text;
    areaHectares : Float;
    latitude : Float;
    longitude : Float;
    locationLabel : Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// The kind of field activity logged against a plot.
  public type ActivityType = {
    #planting;
    #irrigation;
    #fertilizing;
    #pestControl;
    #harvest;
  };

  /// A field activity logged against a farm plot.
  public type FieldActivity = {
    id : ActivityId;
    plotId : PlotId;
    activityType : ActivityType;
    date : Timestamp;
    notes : Text;
    createdAt : Timestamp;
  };

  /// Input for creating a farm plot.
  public type FarmPlotInput = {
    name : Text;
    cropType : Text;
    areaHectares : Float;
    latitude : Float;
    longitude : Float;
    locationLabel : Text;
  };

  /// Input for updating a farm plot.
  public type FarmPlotUpdate = {
    name : Text;
    cropType : Text;
    areaHectares : Float;
    latitude : Float;
    longitude : Float;
    locationLabel : Text;
  };

  /// Input for logging a field activity.
  public type FieldActivityInput = {
    plotId : PlotId;
    activityType : ActivityType;
    date : Timestamp;
    notes : Text;
  };

  /// Dashboard summary for the authenticated farmer.
  public type DashboardSummary = {
    totalFarms : Nat;
    totalAreaHectares : Float;
    mostRecentActivity : ?FieldActivity;
  };

  /// Errors returned by farm plot and activity operations.
  public type FarmError = {
    #notFound : PlotId;
    #notAuthorized;
    #invalidInput : Text;
  };
};
