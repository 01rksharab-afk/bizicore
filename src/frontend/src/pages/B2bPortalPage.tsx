import { PortalType, type SyncRecord } from "@/backend";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAllPortalSyncHistory,
  usePortalKeys,
  usePortalSyncHistory,
  useSavePortalKey,
  useSyncPortal,
} from "@/hooks/useB2b";
import { useActiveOrg } from "@/hooks/useOrg";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Globe,
  Key,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";

// ─── Portal Metadata ────────────────────────────────────────────────────────────

type PortalMeta = {
  label: string;
  description: string;
  abbr: string;
  iconBg: string;
  border: string;
  headerBg: string;
  keyLabel?: string; // custom label for API key field
  isWebhook?: boolean; // special webhook UI
};

const PORTAL_META: Record<PortalType, PortalMeta> = {
  [PortalType.indiamart]: {
    label: "IndiaMart",
    description: "India's largest B2B marketplace with 100M+ product listings",
    abbr: "IM",
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    headerBg: "bg-orange-500/5",
  },
  [PortalType.tradeindia]: {
    label: "TradeIndia",
    description:
      "Connect with verified Indian suppliers and manufacturing buyers",
    abbr: "TI",
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    headerBg: "bg-teal-500/5",
  },
  [PortalType.exportindia]: {
    label: "Export India",
    description: "India's export-import trade portal for global commerce",
    abbr: "EI",
    iconBg: "bg-green-500/15 text-green-600 dark:text-green-400",
    border: "border-green-500/30",
    headerBg: "bg-green-500/5",
  },
  [PortalType.justdial]: {
    label: "JustDial",
    description: "Local business discovery and high-intent B2B leads",
    abbr: "JD",
    iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    headerBg: "bg-purple-500/5",
  },
  [PortalType.globallinker]: {
    label: "GlobalLinker",
    description: "SME network for global trade connections and partnerships",
    abbr: "GL",
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    headerBg: "bg-indigo-500/5",
  },
  [PortalType.google]: {
    label: "Google Business",
    description: "Capture leads from Google Business Profile and Maps queries",
    abbr: "G",
    iconBg: "bg-red-500/15 text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    headerBg: "bg-red-500/5",
    keyLabel: "Google API Key",
  },
  [PortalType.facebookPage]: {
    label: "Facebook Page",
    description: "Sync leads from Facebook Page lead gen forms and Messenger",
    abbr: "FB",
    iconBg: "bg-blue-600/15 text-blue-700 dark:text-blue-400",
    border: "border-blue-600/30",
    headerBg: "bg-blue-600/5",
    keyLabel: "Page Access Token",
  },
  [PortalType.metaAds]: {
    label: "Meta Ads",
    description: "Import leads from Meta (Facebook/Instagram) ad campaigns",
    abbr: "MA",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    border: "border-violet-500/30",
    headerBg: "bg-violet-500/5",
    keyLabel: "Meta Ads API Key",
  },
  [PortalType.websiteWebhook]: {
    label: "Website Webhook",
    description: "Receive leads from your website contact forms via webhook",
    abbr: "WH",
    iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    headerBg: "bg-cyan-500/5",
    isWebhook: true,
  },
};

const ALL_PORTALS: PortalType[] = [
  PortalType.indiamart,
  PortalType.tradeindia,
  PortalType.exportindia,
  PortalType.justdial,
  PortalType.globallinker,
  PortalType.google,
  PortalType.facebookPage,
  PortalType.metaAds,
  PortalType.websiteWebhook,
];

type SyncStatusType = "idle" | "syncing" | "success" | "failed";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatTs(nanoTs: bigint): string {
  return new Date(Number(nanoTs) / 1_000_000).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function relativeTime(nanoTs: bigint): string {
  const ms = Number(nanoTs) / 1_000_000;
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SyncStatusType | string }) {
  if (status === "syncing") {
    return (
      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5 animate-pulse">
        <Loader2 className="size-3 animate-spin" />
        Syncing
      </Badge>
    );
  }
  if (status === "success") {
    return (
      <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 gap-1.5">
        <CheckCircle2 className="size-3" />
        Success
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1.5">
        <XCircle className="size-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1.5">
      <Clock className="size-3" />
      Idle
    </Badge>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 shrink-0 text-xs gap-1"
      onClick={handleCopy}
      aria-label={label ?? "Copy to clipboard"}
      title={label ?? "Copy to clipboard"}
    >
      {copied ? (
        <CheckCircle2 className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ─── Webhook Field ────────────────────────────────────────────────────────────────

function WebhookField({
  portal,
  orgId,
  maskedKey,
}: {
  portal: PortalType;
  orgId: bigint;
  maskedKey?: string;
}) {
  const [secretInput, setSecretInput] = useState("");
  const [editingSecret, setEditingSecret] = useState(false);
  const saveKey = useSavePortalKey(orgId);

  const webhookUrl = `https://bizcore.app/webhook/${orgId.toString()}/leads`;

  const handleSaveSecret = async () => {
    if (!secretInput.trim()) return;
    try {
      await saveKey.mutateAsync({ portal, apiKey: secretInput.trim() });
      setEditingSecret(false);
      setSecretInput("");
    } catch {
      // toast handled in hook
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Webhook URL */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ExternalLink className="size-3" />
          Webhook URL
        </Label>
        <div className="flex items-center gap-1 bg-muted/50 border border-border/50 rounded-md px-3 py-1.5">
          <code className="font-mono text-xs text-foreground flex-1 truncate min-w-0">
            {webhookUrl}
          </code>
          <CopyButton text={webhookUrl} label="Copy webhook URL" />
        </div>
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
          <Link2 className="size-3" />
          Point your contact form POST to this URL
        </p>
      </div>

      {/* Secret Key */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Key className="size-3" />
          Secret Key
        </Label>
        {editingSecret ? (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Set a secret key to verify requests…"
                className="h-8 text-xs font-mono"
                data-ocid={`webhook-secret-input-${portal}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSecret();
                  if (e.key === "Escape") {
                    setEditingSecret(false);
                    setSecretInput("");
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-8 px-3 shrink-0"
                onClick={handleSaveSecret}
                disabled={saveKey.isPending || !secretInput.trim()}
                data-ocid={`webhook-secret-save-${portal}`}
              >
                {saveKey.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 shrink-0 text-xs"
                onClick={() => {
                  setEditingSecret(false);
                  setSecretInput("");
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Used to verify webhook requests from your site
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 min-w-0">
              <Key className="size-3 text-muted-foreground shrink-0" />
              {maskedKey ? (
                <code className="font-mono text-xs text-foreground truncate">
                  {maskedKey}
                </code>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No secret configured
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 shrink-0"
              onClick={() => setEditingSecret(true)}
              data-ocid={`webhook-secret-edit-${portal}`}
            >
              {maskedKey ? "Rotate" : "Set Secret"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── API Key Field ───────────────────────────────────────────────────────────────

function ApiKeyField({
  portal,
  maskedKey,
  orgId,
  keyLabel,
}: {
  portal: PortalType;
  maskedKey?: string;
  orgId: bigint;
  keyLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const saveKey = useSavePortalKey(orgId);

  const handleSave = async () => {
    if (!inputKey.trim()) return;
    try {
      await saveKey.mutateAsync({ portal, apiKey: inputKey.trim() });
      setEditing(false);
      setInputKey("");
    } catch {
      // toast handled in hook
    }
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {keyLabel ?? "New API key"}
        </Label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Paste your key…"
            className="h-8 text-xs font-mono"
            data-ocid={`api-key-input-${portal}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEditing(false);
                setInputKey("");
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            className="h-8 px-3 shrink-0"
            onClick={handleSave}
            disabled={saveKey.isPending || !inputKey.trim()}
            data-ocid={`save-key-submit-${portal}`}
          >
            {saveKey.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 shrink-0 text-xs"
            onClick={() => {
              setEditing(false);
              setInputKey("");
            }}
          >
            Cancel
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
          <ShieldCheck className="size-3" />
          Stored securely — only last 4 digits shown
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 min-w-0">
        <Key className="size-3 text-muted-foreground shrink-0" />
        {maskedKey ? (
          <code className="font-mono text-xs text-foreground truncate">
            {maskedKey}
          </code>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No key configured
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2.5 shrink-0"
        onClick={() => setEditing(true)}
        data-ocid={`update-key-btn-${portal}`}
      >
        {maskedKey ? "Update" : "Add Key"}
      </Button>
    </div>
  );
}

// ─── Portal Card ────────────────────────────────────────────────────────────────

function PortalCard({
  portal,
  orgId,
  totalLeads,
}: {
  portal: PortalType;
  orgId: bigint;
  totalLeads: number;
}) {
  const { data: portalKeys = [], isLoading } = usePortalKeys(orgId);
  const syncPortal = useSyncPortal(orgId);
  const meta = PORTAL_META[portal];

  const keyInfo = portalKeys.find((k) => k.portal === portal);
  const isConnected = !!keyInfo?.maskedKey || meta.isWebhook === true;
  const isSyncing = syncPortal.isPending && syncPortal.variables === portal;
  const syncStatus: SyncStatusType = isSyncing
    ? "syncing"
    : ((keyInfo?.syncStatus as SyncStatusType) ?? "idle");

  const handleSync = async () => {
    try {
      await syncPortal.mutateAsync(portal);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Card
      className={`flex flex-col transition-all duration-200 hover:shadow-md ${
        isConnected ? `${meta.border} shadow-sm` : "border-border"
      }`}
      data-ocid={`portal-card-${portal}`}
    >
      {/* Card Header */}
      <CardHeader
        className={`pb-3 rounded-t-lg ${isConnected ? meta.headerBg : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${meta.iconBg} ${meta.border}`}
            >
              {meta.abbr}
            </div>
            <div className="min-w-0">
              <CardTitle className="font-display text-sm leading-tight">
                {meta.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>
          <StatusBadge status={syncStatus} />
        </div>

        {/* Connection status row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <CheckCircle2 className="size-3.5 text-green-500 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {meta.isWebhook ? "Ready" : "Connected"}
                </span>
              </>
            ) : (
              <>
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Not connected
                </span>
              </>
            )}
          </div>
          {totalLeads > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              <span className="font-mono font-medium">{totalLeads}</span>
              <span>leads synced</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="flex flex-col flex-1 gap-3 pt-3">
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : meta.isWebhook ? (
          <WebhookField
            portal={portal}
            orgId={orgId}
            maskedKey={keyInfo?.maskedKey}
          />
        ) : (
          <ApiKeyField
            portal={portal}
            maskedKey={keyInfo?.maskedKey}
            orgId={orgId}
            keyLabel={meta.keyLabel}
          />
        )}

        {keyInfo?.lastSynced && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="size-3 shrink-0" />
            Last synced:{" "}
            <span className="font-medium text-foreground/70">
              {relativeTime(keyInfo.lastSynced)}
            </span>
            <span className="opacity-50">·</span>
            <span className="opacity-70">{formatTs(keyInfo.lastSynced)}</span>
          </p>
        )}

        {!meta.isWebhook && (
          <Button
            size="sm"
            className="w-full mt-auto"
            disabled={!isConnected || isSyncing}
            onClick={handleSync}
            data-ocid={`sync-portal-btn-${portal}`}
            variant={isConnected ? "default" : "outline"}
          >
            {isSyncing ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Syncing…
              </>
            ) : (
              <>
                <Zap className="size-3.5 mr-1.5" />
                Sync Now
              </>
            )}
          </Button>
        )}

        {meta.isWebhook && (
          <div className="mt-auto pt-1">
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5 justify-center">
              <Zap className="size-3 text-accent" />
              Leads arrive automatically via POST requests
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sync History Table ──────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function SyncHistorySection({ orgId }: { orgId: bigint }) {
  const [filterPortal, setFilterPortal] = useState<PortalType | null>(null);
  const [page, setPage] = useState(0);

  const { data: filteredHistory = [], isLoading: isLoadingFiltered } =
    usePortalSyncHistory(orgId, filterPortal);
  const { data: allHistory = [], isLoading: isLoadingAll } =
    useAllPortalSyncHistory(orgId);

  const records = filterPortal ? filteredHistory : allHistory;
  const isTableLoading = filterPortal ? isLoadingFiltered : isLoadingAll;

  const sorted = [...records].sort((a, b) => Number(b.timestamp - a.timestamp));
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRecords = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4" data-ocid="sync-history-section">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            Sync History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recent synchronization activity across all portals
          </p>
        </div>
        <div
          className="flex items-center gap-2 flex-wrap"
          data-ocid="history-filter"
        >
          <Filter className="size-3.5 text-muted-foreground" />
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFilterPortal(null);
                setPage(0);
              }}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterPortal === null
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid="filter-all"
            >
              All
            </button>
            {ALL_PORTALS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => {
                  setFilterPortal(p);
                  setPage(0);
                }}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterPortal === p
                    ? PORTAL_META[p].iconBg
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-ocid={`filter-portal-${p}`}
              >
                {PORTAL_META[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-medium">Portal</TableHead>
                <TableHead className="text-xs font-medium">Timestamp</TableHead>
                <TableHead className="text-xs font-medium text-right">
                  New Leads
                </TableHead>
                <TableHead className="text-xs font-medium text-right">
                  Duplicates
                </TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTableLoading ? (
                ["r0", "r1", "r2", "r3", "r4"].map((rk) => (
                  <TableRow key={rk}>
                    {["c0", "c1", "c2", "c3", "c4", "c5"].map((ck) => (
                      <TableCell key={ck}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pageRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Clock className="size-8 opacity-25" />
                      <p className="text-sm font-medium">No sync history yet</p>
                      <p className="text-xs opacity-60">
                        Run a sync to see results here
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRecords.map((record: SyncRecord, i) => (
                  <TableRow
                    key={`${record.portal}-${record.timestamp.toString()}-${i}`}
                    className="hover:bg-muted/20 transition-colors"
                    data-ocid={`history-row-${i}`}
                  >
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          PORTAL_META[record.portal as PortalType]?.iconBg ?? ""
                        }`}
                      >
                        {PORTAL_META[record.portal as PortalType]?.label ??
                          record.portal}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTs(record.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-semibold text-green-600 dark:text-green-400">
                      +{record.newLeads.toString()}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">
                      {record.duplicates ? record.duplicates.toString() : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      {record.errorMsg ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="size-3 shrink-0" />
                          <span className="truncate">{record.errorMsg}</span>
                        </span>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{" "}
              {sorted.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                data-ocid="history-prev"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                data-ocid="history-next"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Stats Banner ────────────────────────────────────────────────────────────────

function StatsBanner({
  totalConnected,
  totalLeads,
}: {
  totalConnected: number;
  totalLeads: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Portals Available",
          value: "9",
          icon: Globe,
          color: "text-accent",
        },
        {
          label: "Connected",
          value: totalConnected.toString(),
          icon: CheckCircle2,
          color: "text-green-500",
        },
        {
          label: "Total Leads Synced",
          value: totalLeads.toString(),
          icon: Users,
          color: "text-primary",
        },
        {
          label: "Auto-Sync",
          value: "Active",
          icon: Zap,
          color: "text-yellow-500",
        },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="bg-card/80">
          <CardContent className="p-3 flex items-center gap-3">
            <div
              className={`size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 ${color}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <p className="text-sm font-display font-semibold text-foreground">
                {value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty / No-org state ────────────────────────────────────────────────────────

function NoOrgState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      data-ocid="no-org-state"
    >
      <div className="size-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <Globe className="size-8 text-accent" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        No organization selected
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Select or create an organization to manage your B2B portal integrations.
      </p>
    </div>
  );
}

// ─── Inner Page Content ──────────────────────────────────────────────────────────

function B2bPortalContent() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;
  const { data: portalKeys = [], isLoading } = usePortalKeys(orgId);
  const { data: allHistory = [] } = useAllPortalSyncHistory(orgId);

  const connectedCount = portalKeys.filter((k) => !!k.maskedKey).length;
  const totalLeads = allHistory.reduce((sum, r) => sum + Number(r.newLeads), 0);

  // Per-portal total leads calculation
  const leadsPerPortal: Record<string, number> = {};
  for (const record of allHistory) {
    const p = record.portal as string;
    leadsPerPortal[p] = (leadsPerPortal[p] ?? 0) + Number(record.newLeads);
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex items-start gap-4">
        <div className="size-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Globe className="size-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            B2B Portal Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Connect your B2B marketplace accounts and social platforms to
            automatically import and sync leads into your CRM pipeline. Supports
            IndiaMart, TradeIndia, Export India, JustDial, GlobalLinker, Google
            Business, Facebook Page, Meta Ads, and Website Webhooks.
          </p>
        </div>
      </div>

      {!orgId ? (
        <Card>
          <NoOrgState />
        </Card>
      ) : (
        <>
          {/* Stats */}
          <StatsBanner
            totalConnected={connectedCount}
            totalLeads={totalLeads}
          />

          {/* How it works */}
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Zap className="size-4 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  How it works
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your API key for each portal below. BizCore will use it
                  to fetch new leads and import them into your CRM pipeline.
                  Duplicate contacts are automatically detected and skipped. For{" "}
                  <strong>Website Webhook</strong>, copy the generated URL and
                  paste it into your contact form to receive leads in real time.
                  Use <strong>Sync Now</strong> for immediate pull-based sync.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Portal Cards — Indian B2B Portals */}
          <div className="space-y-3">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Indian B2B Marketplaces
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  PortalType.indiamart,
                  PortalType.tradeindia,
                  PortalType.exportindia,
                  PortalType.justdial,
                  PortalType.globallinker,
                ].map((p) => (
                  <Card key={p} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-11 rounded-xl" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  PortalType.indiamart,
                  PortalType.tradeindia,
                  PortalType.exportindia,
                  PortalType.justdial,
                  PortalType.globallinker,
                ].map((portal) => (
                  <PortalCard
                    key={portal}
                    portal={portal}
                    orgId={orgId}
                    totalLeads={leadsPerPortal[portal] ?? 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Portal Cards — Social & Digital Platforms */}
          <div className="space-y-3">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">
              Social & Digital Platforms
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  PortalType.google,
                  PortalType.facebookPage,
                  PortalType.metaAds,
                  PortalType.websiteWebhook,
                ].map((p) => (
                  <Card key={p} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-11 rounded-xl" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  PortalType.google,
                  PortalType.facebookPage,
                  PortalType.metaAds,
                  PortalType.websiteWebhook,
                ].map((portal) => (
                  <PortalCard
                    key={portal}
                    portal={portal}
                    orgId={orgId}
                    totalLeads={leadsPerPortal[portal] ?? 0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sync History */}
          <SyncHistorySection orgId={orgId} />
        </>
      )}
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────────

export default function B2bPortalPage() {
  return (
    <SubscriptionGate
      requiredPlan="enterprise"
      feature="B2B Portal Integration"
    >
      <B2bPortalContent />
    </SubscriptionGate>
  );
}
