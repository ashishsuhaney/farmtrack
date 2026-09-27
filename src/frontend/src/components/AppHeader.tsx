import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Sprout } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard" },
  { to: "/map", label: "Map" },
  { to: "/plots", label: "Plots" },
  { to: "/profile", label: "Profile" },
];

export interface AppHeaderProps {
  /** The signed-in farmer's display name, when available. */
  displayName?: string | null;
  className?: string;
}

/** Sticky application header with mobile nav, app title, and auth control. */
export function AppHeader({ displayName, className }: AppHeaderProps) {
  const { isAuthenticated, isInitializing, isLoggingIn, login, clear } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const handleAuth = () => {
    if (isAuthenticated) {
      clear();
      queryClient.clear();
    } else {
      login();
    }
  };

  return (
    <header
      data-ocid="app.header"
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-subtle md:px-6",
        className,
      )}
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid="nav.menu_button"
            aria-label="Open navigation"
            className="md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetHeader className="border-b border-sidebar-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2 font-display text-lg">
              <Sprout className="size-4 text-primary" />
              Field Ledger
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={`nav.mobile.${item.label.toLowerCase()}_link`}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-smooth",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 md:hidden">
        <Sprout className="size-5 text-primary" />
        <span className="font-display text-base leading-none">
          Field Ledger
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isAuthenticated && displayName && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {displayName}
          </span>
        )}
        <Button
          type="button"
          variant={isAuthenticated ? "outline" : "default"}
          size="sm"
          data-ocid={
            isAuthenticated ? "auth.sign_out_button" : "auth.sign_in_button"
          }
          onClick={handleAuth}
          disabled={isInitializing || isLoggingIn}
        >
          {isAuthenticated ? (
            <>
              <LogOut className="size-4" />
              Sign out
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              {isInitializing ? "Loading…" : "Sign in"}
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
