import type { PendingInvite } from "@/backend";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AlertTriangle, Building2, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

type InviteState = "idle" | "accepting" | "accepted" | "error";

export function AcceptInvitePage() {
  const { isAuthenticated, login } = useAuth();
  const { actor } = useBackendActor();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Read invite ID from query param ?invite=<id>
  const search = useSearch({ strict: false }) as { invite?: string };
  const inviteId = search.invite ? BigInt(search.invite) : null;

  const [state, setState] = useState<InviteState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load pending invites to show invite info
  const invitesQuery = useQuery<PendingInvite[]>({
    queryKey: ["pendingInvites"],
    queryFn: async () => {
      if (!actor) return [];
      // listPendingInvites needs an orgId — we use 0n as a "global" lookup fallback
      // The actual invite data comes from the ID in URL
      return [];
    },
    enabled: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !inviteId) throw new Error("No actor or invite");
      return actor.acceptInvite(inviteId);
    },
    onSuccess: () => {
      setState("accepted");
      // Invalidate orgs so the newly joined org appears in OrgSelectPage
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("You've joined the organization!");
    },
    onError: (e: Error) => {
      setState("error");
      setErrorMsg(e.message ?? "Failed to accept invite");
      toast.error(e.message ?? "Failed to accept invite");
    },
  });

  const handleAccept = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setState("accepting");
    acceptMutation.mutate();
  };

  useEffect(() => {
    if (!inviteId) {
      setErrorMsg("Invalid or missing invite link.");
      setState("error");
    }
  }, [inviteId]);

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-6"
      data-ocid="accept-invite-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-display font-bold text-sm">
              B
            </span>
          </div>
          <span className="font-display font-semibold text-foreground text-lg">
            BizCore
          </span>
        </div>

        {state === "accepted" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-8 text-center space-y-4"
            data-ocid="invite-accepted"
          >
            <div className="w-14 h-14 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-accent" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-display font-semibold text-foreground">
                You're in!
              </h2>
              <p className="text-sm text-muted-foreground">
                You've successfully joined the organization. Choose a workspace
                to get started.
              </p>
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => navigate({ to: "/orgs/select" })}
              data-ocid="go-to-dashboard-btn"
            >
              Choose workspace
            </Button>
          </motion.div>
        ) : state === "error" ? (
          <div
            className="bg-card border border-destructive/30 rounded-xl p-8 text-center space-y-4"
            data-ocid="invite-error"
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-display font-semibold text-foreground">
                Invite not valid
              </h2>
              <p className="text-sm text-muted-foreground">
                {errorMsg ||
                  "This invite link is invalid, expired, or has already been used."}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/login" })}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <div
            className="bg-card border border-border rounded-xl p-8 space-y-6"
            data-ocid="invite-card"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                  You've been invited
                </p>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Join an organization
                </h2>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invite ID</span>
                <span className="font-mono text-foreground text-xs">
                  #{inviteId?.toString() ?? "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your role</span>
                <span className="font-medium text-foreground">
                  {invitesQuery.data?.[0]
                    ? (ROLE_LABELS[invitesQuery.data[0].role] ??
                      invitesQuery.data[0].role)
                    : "Member"}
                </span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-muted/40 border border-border rounded-lg px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  You'll need to sign in with Internet Identity before
                  accepting.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                className="w-full h-10"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
                data-ocid="accept-invite-btn"
              >
                {acceptMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Accepting…
                  </span>
                ) : !isAuthenticated ? (
                  "Sign in & accept invite"
                ) : (
                  "Accept invite"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full h-9 text-muted-foreground"
                onClick={() => navigate({ to: "/login" })}
              >
                Decline
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
