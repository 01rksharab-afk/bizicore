import type { UserProfile } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Globe2,
  Mail,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Google Icon SVG ───────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Connected Accounts Section ────────────────────────────────────────────────
function ConnectedAccountsSection() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <section
      className="bg-card border border-border rounded-lg p-6 space-y-5"
      data-ocid="connected-accounts-section"
    >
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Globe2 className="size-4 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            Connected Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Link additional sign-in methods to your Internet Identity account
          </p>
        </div>
      </div>

      <Separator className="bg-border" />

      <div className="space-y-3">
        {/* Internet Identity — always active, cannot be unlinked */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Shield className="size-3.5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Internet Identity
              </p>
              <p className="text-xs text-muted-foreground">
                Primary sign-in method
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
            <CheckCircle2 className="size-3" />
            Active
          </span>
        </div>

        {/* Google — coming soon */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <GoogleIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Google Account
              </p>
              <p className="text-xs text-muted-foreground">
                Coming soon — available in a future update
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled
            data-ocid="link-google-btn"
            className="gap-1.5 opacity-60"
          >
            <Clock className="size-3" />
            Soon
          </Button>
        </div>

        {/* Phone — coming soon */}
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                <Phone className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Phone Number
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon — available in a future update
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled
              data-ocid="link-phone-btn"
              className="gap-1.5 opacity-60"
            >
              <Clock className="size-3" />
              Soon
            </Button>
          </div>
        </div>
      </div>

      {/* Coming soon notice */}
      <div className="flex items-start gap-2.5 bg-accent/5 border border-accent/15 rounded-xl px-4 py-3">
        <Clock className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">
            Multi-method authentication is coming soon.
          </span>{" "}
          Google and phone number linking will be available in a future update.
          Your Internet Identity remains your secure primary sign-in.
        </p>
      </div>
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function UserProfileSection() {
  const { isAuthenticated, identity } = useAuth();
  const { actor, isFetching } = useBackendActor();
  const queryClient = useQueryClient();

  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (profileQuery.data) {
      setName(profileQuery.data.name ?? "");
      setEmail(profileQuery.data.email ?? "");
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile({
        name: name.trim(),
        email: email.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile saved successfully");
    },
    onError: () => toast.error("Failed to save profile"),
  });

  const principal = identity?.getPrincipal().toString();
  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : principal
      ? principal.slice(0, 2).toUpperCase()
      : "?";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Info */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-start gap-4">
          {/* Initials avatar */}
          <div className="size-16 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center flex-shrink-0">
            {profileQuery.isLoading ? (
              <Skeleton className="size-16 rounded-full" />
            ) : (
              <span className="font-display font-bold text-lg text-accent">
                {initials}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-display font-semibold text-foreground">
              Personal Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update your display name and contact details
            </p>
          </div>
        </div>

        {profileQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                disabled={!isAuthenticated}
                data-ocid="profile-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-display-name">Display Name</Label>
              <Input
                id="profile-display-name"
                value={name.split(" ")[0] ?? ""}
                onChange={(e) => {
                  const parts = name.split(" ");
                  parts[0] = e.target.value;
                  setName(parts.join(" "));
                }}
                placeholder="Jane"
                disabled={!isAuthenticated}
                data-ocid="profile-display-name-input"
              />
              <p className="text-xs text-muted-foreground">
                Shown in navigation and team lists
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="pl-9"
                  disabled={!isAuthenticated}
                  data-ocid="profile-email-input"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              !isAuthenticated || saveMutation.isPending || !name.trim()
            }
            className="gap-2"
            data-ocid="profile-save-btn"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </section>

      {/* Connected Accounts */}
      <ConnectedAccountsSection />

      {/* Account Security */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-display font-semibold text-foreground">
              Account Security
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your account is secured with Internet Identity — no passwords
              needed
            </p>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                Authentication Method
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Passwordless — secured by your device passkey
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium border border-accent/20">
              Internet Identity
            </span>
          </div>

          {principal && (
            <>
              <Separator className="bg-border" />
              <div className="py-2">
                <p className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  Principal ID
                </p>
                <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2.5 rounded-md break-all leading-relaxed">
                  {principal}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {!isAuthenticated && (
        <div className="bg-muted/40 border border-border rounded-lg px-5 py-4 text-sm text-muted-foreground text-center">
          Sign in to edit your profile
        </div>
      )}
    </div>
  );
}
