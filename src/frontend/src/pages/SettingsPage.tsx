import { BillingTab } from "@/components/settings/BillingTab";
import { OrgSettingsTab } from "@/components/settings/OrgSettingsTab";
import { TeamManagementTab } from "@/components/settings/TeamManagementTab";
import { UserProfileSection } from "@/components/settings/UserProfileSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useOrg";
import { useSearch } from "@tanstack/react-router";
import { Building2, CreditCard, User, Users } from "lucide-react";

const TABS = [
  { value: "profile", label: "Profile", icon: User },
  { value: "org", label: "Organization", icon: Building2 },
  { value: "team", label: "Team", icon: Users },
  { value: "billing", label: "Billing", icon: CreditCard },
];

const VALID_TABS = TABS.map((t) => t.value);

export function SettingsPage() {
  const { activeOrg } = useActiveOrg();
  const { isAuthenticated } = useAuth();
  const search = useSearch({ strict: false }) as { tab?: string };
  const activeTab =
    search.tab && VALID_TABS.includes(search.tab) ? search.tab : "profile";

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Please sign in to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-ocid="settings-page">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, organization, team, and billing
        </p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList
          className="bg-card border border-border h-auto p-1 flex flex-wrap gap-1 w-full justify-start"
          data-ocid="settings-tabs"
        >
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 px-4 py-2 text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-smooth"
              data-ocid={`settings-tab-${value}`}
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile" className="mt-0">
            <UserProfileSection />
          </TabsContent>

          <TabsContent value="org" className="mt-0">
            {activeOrg ? <OrgSettingsTab org={activeOrg} /> : <EmptyOrgState />}
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            {activeOrg ? (
              <TeamManagementTab
                orgId={activeOrg.id}
                myRole={activeOrg.myRole}
              />
            ) : (
              <EmptyOrgState />
            )}
          </TabsContent>

          <TabsContent value="billing" className="mt-0">
            {activeOrg ? (
              <BillingTab orgId={activeOrg.id} myRole={activeOrg.myRole} />
            ) : (
              <EmptyOrgState />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function EmptyOrgState() {
  return (
    <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
        <Building2 className="size-5 text-muted-foreground" />
      </div>
      <p className="font-display font-semibold text-foreground">
        No organization selected
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Select or create an organization to manage its settings.
      </p>
    </div>
  );
}
