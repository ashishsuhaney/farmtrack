import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlots, useProfile, useSetProfile } from "@/hooks/use-farms";
import { errorMessage, formatHectares } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Copy,
  Fingerprint,
  Loader2,
  LogOut,
  MapPin,
  Sprout,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** A compact labelled statistic used in the account summary strip. */
function SummaryStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Sprout;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-display text-xl leading-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { identity, isAuthenticated, isInitializing, clear } =
    useInternetIdentity();
  const queryClient = useQueryClient();

  const profileQuery = useProfile();
  const plotsQuery = usePlots();
  const setProfile = useSetProfile();

  const [displayName, setDisplayName] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

  // One-time initialization of the editable draft from the loaded profile.
  useEffect(() => {
    if (initialized.current) return;
    const profile = profileQuery.data;
    if (profile) {
      setDisplayName(profile.displayName);
      setDefaultRegion(profile.defaultRegion);
      initialized.current = true;
    }
  }, [profileQuery.data]);

  const principal = identity?.getPrincipal().toText() ?? null;
  const plots = plotsQuery.data ?? [];
  const totalArea = plots.reduce((sum, plot) => sum + plot.areaHectares, 0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = displayName.trim();
    const trimmedRegion = defaultRegion.trim();

    if (trimmedName.length === 0) {
      setNameError("Enter a display name so your records are identifiable.");
      setSaved(false);
      return;
    }

    setNameError(null);
    setSaved(false);
    setProfile.mutate(
      { displayName: trimmedName, defaultRegion: trimmedRegion },
      {
        onSuccess: () => {
          setSaved(true);
        },
      },
    );
  };

  const handleCopyPrincipal = async () => {
    if (!principal) return;
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSignOut = () => {
    clear();
    queryClient.clear();
  };

  const isLoading = profileQuery.isLoading || plotsQuery.isLoading;
  const loadError = profileQuery.isError || plotsQuery.isError;

  return (
    <div
      data-ocid="profile.page"
      className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-10"
    >
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          Account
        </p>
        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Farmer profile
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your name and default region label the plots and activity in your
          private land record. Only you can see this data.
        </p>
      </header>

      {loadError ? (
        <div
          data-ocid="profile.error_state"
          className="mt-6 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Could not load your profile.</p>
            <p className="text-destructive/80">
              {errorMessage(profileQuery.error ?? plotsQuery.error)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <UserRound className="size-4 text-primary" />
              Profile details
            </CardTitle>
            <CardDescription>
              Set the name and region used across your dashboard and plots.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div
                data-ocid="profile.loading_state"
                className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                Loading your profile…
              </div>
            ) : (
              <form
                data-ocid="profile.form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-display-name">Display name</Label>
                  <Input
                    id="profile-display-name"
                    data-ocid="profile.display_name_input"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      if (nameError) setNameError(null);
                      if (saved) setSaved(false);
                    }}
                    placeholder="e.g. Ada Okonkwo"
                    autoComplete="name"
                    aria-invalid={nameError ? true : undefined}
                    aria-describedby={
                      nameError ? "profile-display-name-error" : undefined
                    }
                  />
                  {nameError ? (
                    <p
                      id="profile-display-name-error"
                      data-ocid="profile.display_name_error"
                      className="text-xs text-destructive"
                    >
                      {nameError}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="profile-default-region">Default region</Label>
                  <Input
                    id="profile-default-region"
                    data-ocid="profile.default_region_input"
                    value={defaultRegion}
                    onChange={(event) => {
                      setDefaultRegion(event.target.value);
                      if (saved) setSaved(false);
                    }}
                    placeholder="e.g. Central Valley, CA"
                    autoComplete="address-level1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saved to your profile as your primary growing region.
                  </p>
                </div>

                {setProfile.isError ? (
                  <p
                    data-ocid="profile.save_error"
                    className="flex items-center gap-2 text-xs text-destructive"
                  >
                    <AlertTriangle className="size-3.5 shrink-0" />
                    {errorMessage(setProfile.error)}
                  </p>
                ) : null}

                {saved ? (
                  <p
                    data-ocid="profile.success_state"
                    className="flex items-center gap-2 text-xs text-success"
                  >
                    <Check className="size-3.5 shrink-0" />
                    Profile saved.
                  </p>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    data-ocid="profile.save_button"
                    disabled={setProfile.isPending || displayName.trim() === ""}
                  >
                    {setProfile.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {setProfile.isPending ? "Saving…" : "Save profile"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Changes apply to your account immediately.
                  </span>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-lg shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Sprout className="size-4 text-primary" />
                Account summary
              </CardTitle>
              <CardDescription>
                Totals across the plots in your record.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <SummaryStat
                label="Plots"
                value={plotsQuery.isLoading ? "—" : `${plots.length}`}
                icon={Sprout}
              />
              <SummaryStat
                label="Total area"
                value={plotsQuery.isLoading ? "—" : formatHectares(totalArea)}
                icon={MapPin}
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Fingerprint className="size-4 text-primary" />
                Identity
              </CardTitle>
              <CardDescription>
                Your Internet Identity principal identifies this account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-principal">Principal</Label>
                <div className="flex items-start gap-2">
                  <code
                    id="profile-principal"
                    data-ocid="profile.principal_text"
                    className="min-w-0 flex-1 break-all rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground"
                  >
                    {principal ?? "Not available"}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    data-ocid="profile.copy_principal_button"
                    aria-label="Copy principal to clipboard"
                    onClick={handleCopyPrincipal}
                    disabled={!principal}
                  >
                    {copied ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {copied
                    ? "Principal copied to clipboard."
                    : "Share this only with people you trust to identify your account."}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="profile.sign_out_button"
                  onClick={handleSignOut}
                  disabled={!isAuthenticated || isInitializing}
                  className="w-full"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ends your Internet Identity session on this device.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
