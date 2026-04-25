import type { Org, OrgRole, OrgSummary } from "@/backend";
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
import { AlertTriangle, Building2, Lock, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

interface OrgSettingsTabProps {
  org: OrgSummary;
}

export function OrgSettingsTab({ org }: OrgSettingsTabProps) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  const isOwner = org.myRole === ("owner" as OrgRole);

  const orgDetailQuery = useQuery<Org | null>({
    queryKey: ["orgDetail", org.id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrg(org.id);
    },
    enabled: !!actor,
  });

  const orgDetail = orgDetailQuery.data;

  const [name, setName] = useState(org.name);
  const [slug, setSlug] = useState(org.slug);
  const [timezone, setTimezone] = useState(org.timezone || "UTC");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (orgDetail) {
      setTimezone(orgDetail.timezone || "UTC");
    }
  }, [orgDetail]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.updateOrg(
        org.id,
        name,
        slug,
        timezone,
        orgDetail?.orgType ?? ("company" as import("@/backend").OrgType),
        orgDetail?.gstin ?? null,
        orgDetail?.pan ?? null,
        orgDetail?.address ?? null,
        orgDetail?.contactPerson ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({
        queryKey: ["orgDetail", org.id.toString()],
      });
      toast.success("Organization updated successfully");
    },
    onError: () => toast.error("Failed to update organization"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.deleteOrg(org.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization deleted");
      localStorage.removeItem("bizcore_active_org");
    },
    onError: () => toast.error("Failed to delete organization"),
  });

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            General Information
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your organization's basic details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              data-ocid="org-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">
              URL Slug
              <span className="ml-1.5 text-xs text-muted-foreground">
                (URL identifier)
              </span>
            </Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
              placeholder="acme-corp"
              data-ocid="org-slug-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="org-timezone" data-ocid="org-timezone-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Org type — read-only */}
          <div className="space-y-2">
            <Label>Organization Type</Label>
            {orgDetailQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted/30">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-sm capitalize text-foreground">
                  {orgDetail?.orgType ?? "company"}
                </span>
                <Lock className="size-3.5 text-muted-foreground ml-auto" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Set during registration — contact support to change
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !name || !slug}
            data-ocid="org-save-btn"
            className="gap-2"
          >
            <Save className="size-4" />
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Tax & Compliance (read-only) */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
            Tax & Compliance
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="size-2.5" />
              Read-only
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            GSTIN and PAN are set during registration and cannot be changed
          </p>
        </div>

        {orgDetailQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted/30 font-mono text-sm">
                {orgDetail?.gstin ? (
                  <span className="text-foreground tracking-wide">
                    {orgDetail.gstin}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not provided
                  </span>
                )}
                <Lock className="size-3.5 text-muted-foreground ml-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PAN</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-muted/30 font-mono text-sm">
                {orgDetail?.pan ? (
                  <span className="text-foreground tracking-wide">
                    {orgDetail.pan}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not provided
                  </span>
                )}
                <Lock className="size-3.5 text-muted-foreground ml-auto" />
              </div>
            </div>
          </div>
        )}

        {/* Contact person */}
        {orgDetail?.contactPerson && (
          <div className="pt-3 border-t border-border space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Contact Person
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="text-xs text-muted-foreground/70 mb-0.5">Name</p>
                <p className="font-medium text-foreground">
                  {orgDetail.contactPerson.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70 mb-0.5">Email</p>
                <p className="font-medium text-foreground">
                  {orgDetail.contactPerson.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/70 mb-0.5">Phone</p>
                <p className="font-medium text-foreground">
                  {orgDetail.contactPerson.phone}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Danger Zone — Owner only */}
      {isOwner && (
        <section className="bg-card border border-destructive/30 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete this organization and all associated data.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                data-ocid="delete-org-btn"
              >
                <Trash2 className="size-4" />
                Delete Organization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="delete-org-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Delete Organization
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This will permanently delete{" "}
                    <strong className="text-foreground">{org.name}</strong> and
                    all data including contacts, deals, transactions, and
                    invoices. This action{" "}
                    <strong className="text-foreground">
                      cannot be undone
                    </strong>
                    .
                  </span>
                  <span className="block mt-3">
                    Type <strong className="text-foreground">{org.slug}</strong>{" "}
                    to confirm:
                  </span>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={org.slug}
                    className="mt-2"
                    data-ocid="delete-confirm-input"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="delete-cancel-btn">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={
                    deleteConfirmText !== org.slug || deleteMutation.isPending
                  }
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="delete-confirm-btn"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete Forever"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      )}
    </div>
  );
}
