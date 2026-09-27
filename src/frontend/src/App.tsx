import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/pages/DashboardPage";
import { MapPage } from "@/pages/MapPage";
import { PlotDetailPage } from "@/pages/PlotDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Loader2, Sprout } from "lucide-react";

function SignInScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();

  return (
    <div
      data-ocid="auth.sign_in_screen"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-field">
        <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sprout className="size-5" />
        </span>
        <h1 className="mt-5 font-display text-3xl tracking-tight">
          Field Ledger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your farm plots, field activity, and local weather on one map.
          Sign in to open your private land record.
        </p>
        <Button
          type="button"
          data-ocid="auth.sign_in_button"
          className="mt-6 w-full"
          onClick={() => login()}
          disabled={isInitializing || isLoggingIn}
        >
          {isInitializing || isLoggingIn ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {isInitializing ? "Loading…" : "Sign in with Internet Identity"}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Your plots and activity stay private to your account.
        </p>
      </div>
    </div>
  );
}

function RootLayout() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div
        data-ocid="auth.loading_state"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapPage,
});

// The dashboard already renders the full plot list, so /plots resolves there.
const plotsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plots",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

const plotDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plots/$plotId",
  component: PlotDetailPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  mapRoute,
  plotsRoute,
  plotDetailRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
