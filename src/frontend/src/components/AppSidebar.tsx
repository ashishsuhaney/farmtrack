import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map as MapIcon, Sprout, User } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/profile", label: "Profile", icon: User },
];

export interface AppSidebarProps {
  className?: string;
}

/** Desktop navigation rail: dashboard, map, profile. */
export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <aside
      data-ocid="nav.sidebar"
      className={cn(
        "hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sprout className="size-4" />
        </span>
        <span className="font-display text-lg leading-none">Field Ledger</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase()}_link`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Field operations
        </p>
      </div>
    </aside>
  );
}
