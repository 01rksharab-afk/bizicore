import type {
  OrgId,
  OrgMember,
  OrgRole,
  PendingInvite,
  PlanTier,
} from "@/backend";
import type { OrgSubscription } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, User, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TeamManagementTabProps {
  orgId: OrgId;
  myRole: OrgRole;
}

const ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: "owner" as OrgRole, label: "Owner" },
  { value: "admin" as OrgRole, label: "Admin" },
  { value: "member" as OrgRole, label: "Member" },
];

const PLAN_MEMBER_LIMITS: Record<PlanTier, number | null> = {
  free: 3,
  pro: 20,
  enterprise: null,
};

function roleIcon(role: OrgRole) {
  if (role === ("owner" as OrgRole))
    return <Crown className="size-3.5 text-yellow-400" />;
  if (role === ("admin" as OrgRole))
    return <Shield className="size-3.5 text-accent" />;
  return <User className="size-3.5 text-muted-foreground" />;
}

function roleBadgeVariant(role: OrgRole): "default" | "secondary" | "outline" {
  if (role === ("owner" as OrgRole)) return "default";
  if (role === ("admin" as OrgRole)) return "secondary";
  return "outline";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TeamManagementTab({ orgId, myRole }: TeamManagementTabProps) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const canManage =
    myRole === ("owner" as OrgRole) || myRole === ("admin" as OrgRole);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member" as OrgRole);

  const membersQuery = useQuery<OrgMember[]>({
    queryKey: ["members", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMembers(orgId);
    },
    enabled: !!actor,
  });

  const invitesQuery = useQuery<PendingInvite[]>({
    queryKey: ["pendingInvites", orgId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingInvites(orgId);
    },
    enabled: !!actor && canManage,
  });

  const subscriptionQuery = useQuery<OrgSubscription | null>({
    queryKey: ["subscription", orgId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSubscription(orgId);
    },
    enabled: !!actor,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.inviteMember(orgId, inviteEmail, inviteRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pendingInvites", orgId.toString()],
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    },
    onError: () => toast.error("Failed to send invitation"),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.cancelInvite(inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pendingInvites", orgId.toString()],
      });
      toast.success("Invitation revoked");
    },
    onError: () => toast.error("Failed to revoke invitation"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      principal,
      newRole,
    }: { principal: string; newRole: OrgRole }) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.updateMemberRole(
        orgId,
        Principal.fromText(principal),
        newRole,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", orgId.toString()],
      });
      toast.success("Member role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.removeMember(orgId, Principal.fromText(principal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["members", orgId.toString()],
      });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const memberCount = membersQuery.data?.length ?? 0;
  const currentPlan = subscriptionQuery.data?.plan ?? ("free" as PlanTier);
  const memberLimit = PLAN_MEMBER_LIMITS[currentPlan];
  const atLimit = memberLimit !== null && memberCount >= memberLimit;

  return (
    <div className="space-y-6">
      {/* Member count indicator */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border border-border rounded-lg">
        <Users className="size-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              Team Members
            </span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {membersQuery.isLoading ? (
                <Skeleton className="h-4 w-16 inline-block" />
              ) : (
                <>
                  {memberCount}
                  {memberLimit !== null && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      /{memberLimit}
                    </span>
                  )}
                  {memberLimit === null && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      / ∞
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
          {memberLimit !== null && !membersQuery.isLoading && (
            <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-accent"}`}
                style={{
                  width: `${Math.min((memberCount / memberLimit) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        {atLimit && (
          <Badge variant="destructive" className="text-xs flex-shrink-0">
            Limit reached
          </Badge>
        )}
      </div>

      {/* Invite Form */}
      {canManage && (
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-base font-display font-semibold text-foreground">
              Invite Team Member
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Send an invitation to join your organization
              {atLimit && (
                <span className="text-destructive ml-1">
                  — upgrade your plan to add more members
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                disabled={atLimit}
                data-ocid="invite-email-input"
              />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as OrgRole)}
                disabled={atLimit}
              >
                <SelectTrigger id="invite-role" data-ocid="invite-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.filter(
                    (r) => r.value !== ("owner" as OrgRole),
                  ).map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending || atLimit}
                className="gap-2 w-full sm:w-auto"
                data-ocid="send-invite-btn"
              >
                <UserPlus className="size-4" />
                {inviteMutation.isPending ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Members List */}
      <section className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-foreground">
            Members
            {membersQuery.data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({membersQuery.data.length})
              </span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-border">
          {membersQuery.isLoading ? (
            ["m1", "m2", "m3"].map((sk) => (
              <div key={sk} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            ))
          ) : membersQuery.data?.length === 0 ? (
            <div
              className="px-6 py-8 text-center text-sm text-muted-foreground"
              data-ocid="members-empty"
            >
              No members yet
            </div>
          ) : (
            membersQuery.data?.map((member) => (
              <MemberRow
                key={member.principal.toString()}
                member={member}
                myRole={myRole}
                canManage={canManage}
                onUpdateRole={(newRole) =>
                  updateRoleMutation.mutate({
                    principal: member.principal.toString(),
                    newRole,
                  })
                }
                onRemove={() =>
                  removeMemberMutation.mutate(member.principal.toString())
                }
              />
            ))
          )}
        </div>
      </section>

      {/* Pending Invites */}
      {canManage && (
        <section className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-display font-semibold text-foreground">
              Pending Invitations
              {invitesQuery.data && invitesQuery.data.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                  {invitesQuery.data.length}
                </span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-border">
            {invitesQuery.isLoading ? (
              <div className="px-6 py-4 space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : !invitesQuery.data?.length ? (
              <div
                className="px-6 py-8 text-center text-sm text-muted-foreground"
                data-ocid="invites-empty"
              >
                No pending invitations
              </div>
            ) : (
              invitesQuery.data.map((invite) => (
                <div
                  key={invite.id.toString()}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                  data-ocid="invite-row"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {invite.email[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {invite.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Invited {formatDate(invite.createdAt)} · Role:{" "}
                        {invite.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {invite.role}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => cancelInviteMutation.mutate(invite.id)}
                      aria-label="Revoke invitation"
                      data-ocid="revoke-invite-btn"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

interface MemberRowProps {
  member: OrgMember;
  myRole: OrgRole;
  canManage: boolean;
  onUpdateRole: (role: OrgRole) => void;
  onRemove: () => void;
}

function MemberRow({
  member,
  myRole,
  canManage,
  onUpdateRole,
  onRemove,
}: MemberRowProps) {
  const isOwner = member.role === ("owner" as OrgRole);
  const canEdit = canManage && !isOwner && myRole === ("owner" as OrgRole);
  const principal = member.principal.toString();
  const initials = principal.slice(0, 2).toUpperCase();

  return (
    <div
      className="px-6 py-4 flex items-center justify-between gap-4"
      data-ocid="member-row"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate font-mono text-xs">
            {principal.slice(0, 24)}…
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Joined {formatDate(member.joinedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canEdit ? (
          <Select
            value={member.role}
            onValueChange={(v) => onUpdateRole(v as OrgRole)}
          >
            <SelectTrigger
              className="h-8 text-xs w-28"
              data-ocid="member-role-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.filter((r) => r.value !== ("owner" as OrgRole)).map(
                (r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            variant={roleBadgeVariant(member.role)}
            className="gap-1.5 capitalize text-xs"
          >
            {roleIcon(member.role)}
            {member.role}
          </Badge>
        )}
        {canEdit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Remove member"
                data-ocid="remove-member-btn"
              >
                <X className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the member from your organization. They will
                  lose access immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
