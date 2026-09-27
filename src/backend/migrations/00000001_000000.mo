import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type PlotId = Nat;
  type ActivityId = Nat;
  type Timestamp = Int;

  type FarmerProfile = {
    displayName : Text;
    defaultRegion : Text;
  };

  type FarmPlot = {
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

  type ActivityType = {
    #planting;
    #irrigation;
    #fertilizing;
    #pestControl;
    #harvest;
  };

  type FieldActivity = {
    id : ActivityId;
    plotId : PlotId;
    activityType : ActivityType;
    date : Timestamp;
    notes : Text;
    createdAt : Timestamp;
  };

  type FarmState = {
    profiles : Map.Map<Principal, FarmerProfile>;
    plots : Map.Map<Principal, List.List<FarmPlot>>;
    activities : Map.Map<Principal, List.List<FieldActivity>>;
    var nextPlotId : Nat;
    var nextActivityId : Nat;
  };

  public type OldActor = {};

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    farmState : FarmState;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      farmState = {
        profiles = Map.empty();
        plots = Map.empty();
        activities = Map.empty();
        var nextPlotId = 0;
        var nextActivityId = 0;
      };
    };
  };
};
