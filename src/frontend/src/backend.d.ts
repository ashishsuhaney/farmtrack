import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ActivityId = bigint;
export interface Cell {
    value: Value;
    name: string;
}
export interface DashboardSummary {
    totalFarms: bigint;
    totalAreaHectares: number;
    mostRecentActivity?: FieldActivity;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface FarmPlot {
    id: PlotId;
    latitude: number;
    areaHectares: number;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    longitude: number;
    locationLabel: string;
    cropType: string;
}
export interface FarmPlotInput {
    latitude: number;
    areaHectares: number;
    name: string;
    longitude: number;
    locationLabel: string;
    cropType: string;
}
export interface FarmPlotUpdate {
    latitude: number;
    areaHectares: number;
    name: string;
    longitude: number;
    locationLabel: string;
    cropType: string;
}
export interface FarmerProfile {
    displayName: string;
    defaultRegion: string;
}
export interface FieldActivity {
    id: ActivityId;
    activityType: ActivityType;
    plotId: PlotId;
    date: Timestamp;
    createdAt: Timestamp;
    notes: string;
}
export interface FieldActivityInput {
    activityType: ActivityType;
    plotId: PlotId;
    date: Timestamp;
    notes: string;
}
export type PlotId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum ActivityType {
    fertilizing = "fertilizing",
    harvest = "harvest",
    irrigation = "irrigation",
    pestControl = "pestControl",
    planting = "planting"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Log an activity against one of the caller's plots.
     */
    addActivity(input: FieldActivityInput): Promise<FieldActivity>;
    /**
     * / Create a farm plot owned by the caller.
     */
    addPlot(input: FarmPlotInput): Promise<FarmPlot>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Delete one of the caller's plots and its activities.
     */
    deletePlot(plotId: PlotId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    /**
     * / Return the backend's public API documentation as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Summarize the caller's farms, total area, and most recent activity.
     */
    getDashboardSummary(): Promise<DashboardSummary>;
    /**
     * / Return one of the caller's plots, or null when it does not exist or is not theirs.
     */
    getPlot(plotId: PlotId): Promise<FarmPlot | null>;
    /**
     * / Return the caller's profile, or null when none has been saved yet.
     */
    getProfile(): Promise<FarmerProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's activities for a plot, newest first, optionally filtered by type.
     */
    listActivities(plotId: PlotId, filter: ActivityType | null): Promise<Array<FieldActivity>>;
    /**
     * / List all farm plots owned by the caller.
     */
    listPlots(): Promise<Array<FarmPlot>>;
    schema(): Promise<string>;
    /**
     * / Create or replace the caller's profile.
     */
    setProfile(displayName: string, defaultRegion: string): Promise<FarmerProfile>;
    /**
     * / Update one of the caller's plots.
     */
    updatePlot(plotId: PlotId, input: FarmPlotUpdate): Promise<FarmPlot>;
}
