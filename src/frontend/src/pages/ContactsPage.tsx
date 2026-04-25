import type { Contact, ContactSortField } from "@/backend";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useContacts, useExportContactsCsv, useMyRole } from "@/hooks/useCRM";
import { useActiveOrg } from "@/hooks/useOrg";
import { Link } from "@tanstack/react-router";
import { Building2, Download, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TAG_COLORS: Record<string, string> = {
  customer: "bg-accent/15 text-accent border-accent/30",
  prospect: "bg-primary/15 text-primary border-primary/30",
  partner: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  vip: "bg-chart-3/15 text-chart-3 border-chart-3/30",
};

function tagClass(tag: string) {
  return (
    TAG_COLORS[tag.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border"
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <Link
      to="/crm/contacts/$contactId"
      params={{ contactId: contact.id.toString() }}
      className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors duration-150 group"
      data-ocid="contact-row"
    >
      <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-primary">
          {contact.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
          {contact.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {contact.email ?? "—"} {contact.company ? `· ${contact.company}` : ""}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end max-w-[200px]">
        {contact.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tagClass(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="hidden md:block text-xs text-muted-foreground w-24 text-right shrink-0">
        {contact.phone ?? "—"}
      </div>
    </Link>
  );
}

function ContactRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
    </div>
  );
}

export default function ContactsPage() {
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id ?? null;

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<ContactSortField | null>(null);
  const [sortAsc] = useState(true);

  const { data: contacts = [], isLoading } = useContacts(
    orgId,
    search,
    tagFilter,
    sortField,
    sortAsc,
  );
  const { data: role } = useMyRole(orgId);
  const exportCsv = useExportContactsCsv(orgId);

  const canWrite = role === "owner" || role === "admin" || role === "member";

  // Collect all unique tags from contacts
  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  function handleExport() {
    exportCsv.mutate(undefined, {
      onSuccess: (csv) => {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Contacts exported");
      },
      onError: () => toast.error("Export failed"),
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: "CRM" }, { label: "Contacts" }]} />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading…"
              : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportCsv.isPending}
            data-ocid="export-contacts-btn"
          >
            <Download className="size-3.5 mr-1.5" />
            Export CSV
          </Button>
          {canWrite && (
            <Link to="/crm/contacts/new">
              <Button size="sm" data-ocid="add-contact-btn">
                <Plus className="size-3.5 mr-1.5" />
                Add Contact
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
            data-ocid="contacts-search"
          />
        </div>
        <Select
          value={tagFilter ?? "all"}
          onValueChange={(v) => setTagFilter(v === "all" ? null : v)}
        >
          <SelectTrigger
            className="h-8 text-sm w-36"
            data-ocid="contacts-tag-filter"
          >
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortField ?? "default"}
          onValueChange={(v) =>
            setSortField(v === "default" ? null : (v as ContactSortField))
          }
        >
          <SelectTrigger className="h-8 text-sm w-36" data-ocid="contacts-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="createdAt">Date Added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex-1">
            Name / Email
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:block w-32">
            Tags
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:block w-24 text-right">
            Phone
          </span>
        </div>

        {isLoading ? (
          ["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
            <ContactRowSkeleton key={k} />
          ))
        ) : contacts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            data-ocid="contacts-empty"
          >
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No contacts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || tagFilter
                  ? "Try adjusting your search or filters"
                  : "Add your first contact to get started"}
              </p>
            </div>
            {canWrite && !search && !tagFilter && (
              <Link to="/crm/contacts/new">
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid="contacts-empty-cta"
                >
                  <Plus className="size-3.5 mr-1.5" />
                  Add Contact
                </Button>
              </Link>
            )}
          </div>
        ) : (
          contacts.map((c) => <ContactRow key={c.id.toString()} contact={c} />)
        )}
      </div>

      {contacts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="size-3.5" />
          <span>
            {
              Array.from(
                new Set(contacts.map((c) => c.company).filter(Boolean)),
              ).length
            }{" "}
            companies
          </span>
        </div>
      )}
    </div>
  );
}
