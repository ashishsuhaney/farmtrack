import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { useProfile } from "@/hooks/use-farms";
import type { ReactNode } from "react";

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Application shell: sidebar + sticky header + content area + attribution footer.
 * Header and footer use distinct surfaces from the content background.
 */
export function Layout({ children }: LayoutProps) {
  const { data: profile } = useProfile();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader displayName={profile?.displayName ?? null} />
        <main data-ocid="app.content" className="flex-1 bg-background">
          {children}
        </main>
        <footer
          data-ocid="app.footer"
          className="border-t border-border bg-muted/40 px-4 py-4 text-center text-xs text-muted-foreground md:px-6"
        >
          © {year}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window === "undefined" ? "" : window.location.hostname,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 transition-smooth hover:text-foreground"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
