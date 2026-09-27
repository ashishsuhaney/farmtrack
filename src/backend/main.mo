import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import OQL "mo:caffeineai-oql";
import Entity "mo:caffeineai-oql/Entity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import FarmsLib "lib/farms";
import FarmsTypes "types/farms";
import FarmsApi "mixins/farms-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let farmState : FarmsLib.FarmState;

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  // A plot row carries its owning farmer so per-user scoping can be enforced.
  type PlotRow = {
    owner : Principal;
    id : Nat;
    name : Text;
    cropType : Text;
    areaHectares : Float;
    latitude : Float;
    longitude : Float;
    locationLabel : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  // An activity row carries its owning farmer and a text form of its variant type.
  type ActivityRow = {
    owner : Principal;
    id : Nat;
    plotId : Nat;
    activityType : Text;
    date : Int;
    notes : Text;
    createdAt : Int;
  };

  // A profile row carries its owning farmer (the map key) as a column.
  type ProfileRow = {
    owner : Principal;
    displayName : Text;
    defaultRegion : Text;
  };

  func activityTypeText(activityType : FarmsTypes.ActivityType) : Text {
    switch (activityType) {
      case (#planting) { "planting" };
      case (#irrigation) { "irrigation" };
      case (#fertilizing) { "fertilizing" };
      case (#pestControl) { "pestControl" };
      case (#harvest) { "harvest" };
    };
  };

  func plotRows() : Iter.Iter<PlotRow> {
    farmState.plots.entries().flatMap(
      func ((owner, plots)) {
        plots.values().map(
          func (plot) {
            {
              owner;
              id = plot.id;
              name = plot.name;
              cropType = plot.cropType;
              areaHectares = plot.areaHectares;
              latitude = plot.latitude;
              longitude = plot.longitude;
              locationLabel = plot.locationLabel;
              createdAt = plot.createdAt;
              updatedAt = plot.updatedAt;
            };
          }
        );
      }
    );
  };

  func activityRows() : Iter.Iter<ActivityRow> {
    farmState.activities.entries().flatMap(
      func ((owner, activities)) {
        activities.values().map(
          func (activity) {
            {
              owner;
              id = activity.id;
              plotId = activity.plotId;
              activityType = activityTypeText(activity.activityType);
              date = activity.date;
              notes = activity.notes;
              createdAt = activity.createdAt;
            };
          }
        );
      }
    );
  };

  func profileRows() : Iter.Iter<ProfileRow> {
    farmState.profiles.entries().map(
      func ((owner, profile)) {
        { owner; displayName = profile.displayName; defaultRegion = profile.defaultRegion };
      }
    );
  };

  include MixinAuthorization(accessControlState, null);
  include FarmsApi(farmState);
  include ApiDocMixin();
  include Expose({
    entities = [
      OQL.Entity.manual<ProfileRow>("profile", profileRows, "Profile", "owner")
        .sample({ owner = anyPrincipal; displayName = ""; defaultRegion = "" })
        .payload("owner", func (row) = row.owner)
        .payload("displayName", func (row) = row.displayName)
        .payload("defaultRegion", func (row) = row.defaultRegion)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<PlotRow>("plot", plotRows, "Plot", "id")
        .sample({
          owner = anyPrincipal;
          id = 0;
          name = "";
          cropType = "";
          areaHectares = 0.0;
          latitude = 0.0;
          longitude = 0.0;
          locationLabel = "";
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("owner", func (row) = row.owner)
        .payload("id", func (row) = row.id)
        .payload("name", func (row) = row.name)
        .payload("cropType", func (row) = row.cropType)
        .payload("areaHectares", func (row) = row.areaHectares)
        .payload("latitude", func (row) = row.latitude)
        .payload("longitude", func (row) = row.longitude)
        .payload("locationLabel", func (row) = row.locationLabel)
        .payload("createdAt", func (row) = row.createdAt)
        .payload("updatedAt", func (row) = row.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<ActivityRow>("activity", activityRows, "Activity", "id")
        .sample({
          owner = anyPrincipal;
          id = 0;
          plotId = 0;
          activityType = "";
          date = 0;
          notes = "";
          createdAt = 0;
        })
        .payload("owner", func (row) = row.owner)
        .payload("id", func (row) = row.id)
        .payload("plotId", func (row) = row.plotId)
        .payload("activityType", func (row) = row.activityType)
        .payload("date", func (row) = row.date)
        .payload("notes", func (row) = row.notes)
        .payload("createdAt", func (row) = row.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
