import { SettingsItemRow } from "@/components/settings/SettingsItemRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, Eye, EyeOff, Settings, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NumberSeries {
  doc: string;
  prefix: string;
  suffix: string;
  startAt: string;
}

interface OrgConfig {
  currency: string;
  dateFormat: string;
  numberSeries: NumberSeries[];
  enableBarcoding: boolean;
  enableBatches: boolean;
  enableSerialization: boolean;
  enableShelfLife: boolean;
  invoiceTemplate: string;
  roundingAdjustment: boolean;
  additionalCharges: string;
  trackInventory: boolean;
  orgDisplayName: string;
  logoDataUrl: string;
  gatewayType: string;
  gatewayApiKey: string;
  gatewaySecretKey: string;
}

const STORAGE_KEY = "bizcore_org_config";

const DEFAULT_CONFIG: OrgConfig = {
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  numberSeries: [
    { doc: "Invoice", prefix: "INV-", suffix: "", startAt: "001" },
    { doc: "Purchase Order", prefix: "PO-", suffix: "", startAt: "001" },
    { doc: "Sales Order", prefix: "SO-", suffix: "", startAt: "001" },
    { doc: "Challan", prefix: "DC-", suffix: "", startAt: "001" },
    { doc: "Receipt", prefix: "RCP-", suffix: "", startAt: "001" },
    { doc: "Credit Note", prefix: "CN-", suffix: "", startAt: "001" },
  ],
  enableBarcoding: true,
  enableBatches: false,
  enableSerialization: false,
  enableShelfLife: false,
  invoiceTemplate: "professional",
  roundingAdjustment: true,
  additionalCharges: "Freight, Insurance, Packaging",
  trackInventory: true,
  orgDisplayName: "Acme Enterprises Pvt. Ltd.",
  logoDataUrl: "",
  gatewayType: "stripe",
  gatewayApiKey: "",
  gatewaySecretKey: "",
};

function loadConfig(): OrgConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
      : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ─── Module Visibility Tab ────────────────────────────────────────────────────

const ALL_MODULES = [
  { key: "inventory", label: "Inventory" },
  { key: "accounting", label: "Accounting" },
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "reports", label: "Reports" },
  { key: "roles-permissions", label: "Roles & Permissions" },
  { key: "locations", label: "Locations" },
  { key: "groups", label: "Groups" },
  { key: "incentives", label: "Incentives" },
  { key: "finance", label: "Finance" },
  { key: "b2b-portals", label: "B2B Portals" },
];

function getModuleStorageKey(key: string) {
  return `module_visibility_${key.toLowerCase().replace(/\s+/g, "_")}`;
}

function loadAllModuleVisibility(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const m of ALL_MODULES) {
    try {
      const stored = localStorage.getItem(getModuleStorageKey(m.key));
      result[m.key] = stored === null ? true : stored === "true";
    } catch {
      result[m.key] = true;
    }
  }
  return result;
}

function ModuleVisibilityTab() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(
    loadAllModuleVisibility,
  );

  function toggle(key: string, value: boolean) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
    try {
      localStorage.setItem(getModuleStorageKey(key), String(value));
    } catch {
      // ignore
    }
  }

  function setAll(value: boolean) {
    const next: Record<string, boolean> = {};
    for (const m of ALL_MODULES) {
      next[m.key] = value;
      try {
        localStorage.setItem(getModuleStorageKey(m.key), String(value));
      } catch {
        // ignore
      }
    }
    setVisibility(next);
    toast.success(value ? "All modules enabled" : "All modules disabled");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Module Visibility</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Toggle modules ON or OFF. When OFF the module hides from the
              sidebar and data becomes read-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAll(true)}
              className="gap-1.5 text-xs h-8"
              data-ocid="modules-show-all-btn"
            >
              <Eye className="size-3.5" /> Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAll(false)}
              className="gap-1.5 text-xs h-8"
              data-ocid="modules-hide-all-btn"
            >
              <EyeOff className="size-3.5" /> Hide All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {ALL_MODULES.map(({ key, label }) => {
          const enabled = visibility[key] ?? true;
          return (
            <SettingsItemRow
              key={key}
              category="configuration"
              itemId={`module-${key}`}
              label={label}
              description={
                enabled
                  ? "Active — visible in sidebar"
                  : "Disabled — hidden from sidebar"
              }
            >
              <Switch
                checked={enabled}
                onCheckedChange={(v) => toggle(key, v)}
                data-ocid={`module-visibility-${key}`}
              />
            </SettingsItemRow>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfigurationPage() {
  const [config, setConfig] = useState<OrgConfig>(loadConfig);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const importConfigRef = useRef<HTMLInputElement>(null);

  const CAT = "configuration";

  const update = <K extends keyof OrgConfig>(key: K, value: OrgConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const updateSeries = (
    idx: number,
    field: keyof NumberSeries,
    value: string,
  ) => {
    const next = [...config.numberSeries];
    next[idx] = { ...next[idx], [field]: value };
    update("numberSeries", next);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("logoDataUrl", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast.success("Configuration saved successfully");
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizcore-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuration exported");
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as OrgConfig;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
        toast.success("Configuration imported successfully");
      } catch {
        toast.error("Invalid configuration file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" data-ocid="configuration-page">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <nav className="text-xs text-muted-foreground mb-1">
            Admin › Configuration
          </nav>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="size-6 text-primary" />
            Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure all system-wide settings for your organisation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => importConfigRef.current?.click()}
            data-ocid="import-config-btn"
          >
            <Upload className="size-3.5 mr-1.5" /> Import Config
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportConfig}
            data-ocid="export-config-btn"
          >
            <Download className="size-3.5 mr-1.5" /> Export Config
          </Button>
          <input
            ref={importConfigRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportConfig}
          />
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList
          className="flex-wrap h-auto gap-1 justify-start"
          data-ocid="config-tabs"
        >
          {[
            { value: "general", label: "General" },
            { value: "masters", label: "Masters" },
            { value: "invoicing", label: "Invoicing" },
            { value: "inventory", label: "Inventory" },
            { value: "branding", label: "Branding" },
            { value: "payment", label: "Payment Gateway" },
            { value: "modules", label: "Module Visibility" },
          ].map(({ value, label }) => (
            <TabsTrigger key={value} value={value} data-ocid={`tab-${value}`}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsItemRow
                category={CAT}
                itemId="currency"
                label="Currency"
                description="Default currency for all transactions"
              >
                <Select
                  value={config.currency}
                  onValueChange={(v) => update("currency", v)}
                >
                  <SelectTrigger data-ocid="currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "INR",
                      "USD",
                      "EUR",
                      "GBP",
                      "AED",
                      "SGD",
                      "JPY",
                      "CNY",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="date-format"
                label="Date Format"
                description="Display format for dates throughout the app"
              >
                <Select
                  value={config.dateFormat}
                  onValueChange={(v) => update("dateFormat", v)}
                >
                  <SelectTrigger data-ocid="date-format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="number-series"
                label="Number Series"
                description="Prefix/suffix and starting number for each document type"
              >
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">
                          Document
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Prefix
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Suffix
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Starts At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.numberSeries.map((s, i) => (
                        <tr key={s.doc} className="border-t border-border">
                          <td className="px-3 py-2 font-medium text-muted-foreground">
                            {s.doc}
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              value={s.prefix}
                              onChange={(e) =>
                                updateSeries(i, "prefix", e.target.value)
                              }
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              value={s.suffix}
                              onChange={(e) =>
                                updateSeries(i, "suffix", e.target.value)
                              }
                              className="h-7 text-xs"
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              value={s.startAt}
                              onChange={(e) =>
                                updateSeries(i, "startAt", e.target.value)
                              }
                              className="h-7 text-xs w-20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SettingsItemRow>

              <div className="flex justify-end">
                <Button onClick={handleSave} data-ocid="save-general-btn">
                  Save General
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Masters ── */}
        <TabsContent value="masters">
          <Card>
            <CardHeader>
              <CardTitle>Masters Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  itemId: "barcoding" as const,
                  key: "enableBarcoding" as const,
                  label: "Enable Barcoding",
                  desc: "Allow barcode scanning on items and inventory movements",
                },
                {
                  itemId: "batches" as const,
                  key: "enableBatches" as const,
                  label: "Enable Batches",
                  desc: "Track items by batch/lot numbers for traceability",
                },
                {
                  itemId: "serialization" as const,
                  key: "enableSerialization" as const,
                  label: "Enable Serialization",
                  desc: "Assign unique serial numbers to individual items",
                },
                {
                  itemId: "shelf-life" as const,
                  key: "enableShelfLife" as const,
                  label: "Enable Shelf Life",
                  desc: "Track expiry dates and shelf life for perishable items",
                },
              ].map(({ itemId, key, label, desc }) => (
                <SettingsItemRow
                  key={key}
                  category={CAT}
                  itemId={itemId}
                  label={label}
                  description={desc}
                >
                  <Switch
                    checked={config[key]}
                    onCheckedChange={(v) => update(key, v)}
                    data-ocid={`toggle-${key}`}
                  />
                </SettingsItemRow>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} data-ocid="save-masters-btn">
                  Save Masters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoicing ── */}
        <TabsContent value="invoicing">
          <Card>
            <CardHeader>
              <CardTitle>Invoicing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsItemRow
                category={CAT}
                itemId="invoice-template"
                label="Invoice Template"
                description="Default layout used when generating invoices"
              >
                <Select
                  value={config.invoiceTemplate}
                  onValueChange={(v) => update("invoiceTemplate", v)}
                >
                  <SelectTrigger data-ocid="invoice-template-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="rounding"
                label="Rounding Adjustment"
                description="Auto-round invoice totals to nearest rupee"
              >
                <Switch
                  checked={config.roundingAdjustment}
                  onCheckedChange={(v) => update("roundingAdjustment", v)}
                  data-ocid="toggle-rounding"
                />
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="additional-charges"
                label="Additional Charges"
                description="Comma-separated charge types shown when creating invoices"
              >
                <Input
                  value={config.additionalCharges}
                  onChange={(e) => update("additionalCharges", e.target.value)}
                  placeholder="Freight, Insurance, Packaging"
                />
              </SettingsItemRow>

              <div className="flex justify-end">
                <Button onClick={handleSave} data-ocid="save-invoicing-btn">
                  Save Invoicing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory ── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsItemRow
                category={CAT}
                itemId="track-inventory"
                label="Track Inventory"
                description="Deduct stock on invoice/sales order and add stock on purchase bills"
              >
                <Switch
                  checked={config.trackInventory}
                  onCheckedChange={(v) => update("trackInventory", v)}
                  data-ocid="toggle-track-inventory"
                />
              </SettingsItemRow>
              <div className="flex justify-end">
                <Button onClick={handleSave} data-ocid="save-inventory-btn">
                  Save Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branding ── */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding &amp; Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsItemRow
                category={CAT}
                itemId="org-display-name"
                label="Organisation Display Name"
                description="Name shown on invoices, reports, and the sidebar"
              >
                <Input
                  value={config.orgDisplayName}
                  onChange={(e) => update("orgDisplayName", e.target.value)}
                />
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="logo-upload"
                label="Organisation Logo"
                description="PNG, JPG, or SVG up to 2 MB"
              >
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                    data-ocid="logo-upload-area"
                  >
                    {config.logoDataUrl ? (
                      <img
                        src={config.logoDataUrl}
                        alt="Logo preview"
                        className="max-h-24 max-w-48 object-contain"
                      />
                    ) : (
                      <>
                        <Upload className="size-8 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Click to upload logo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, SVG (max 2MB)
                          </p>
                        </div>
                      </>
                    )}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  {config.logoDataUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update("logoDataUrl", "")}
                    >
                      Remove Logo
                    </Button>
                  )}
                </div>
              </SettingsItemRow>

              <div className="flex justify-end">
                <Button onClick={handleSave} data-ocid="save-branding-btn">
                  Save Branding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payment Gateway ── */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingsItemRow
                category={CAT}
                itemId="gateway-type"
                label="Gateway Type"
                description="Payment processor used for online transactions"
              >
                <Select
                  value={config.gatewayType}
                  onValueChange={(v) => update("gatewayType", v)}
                >
                  <SelectTrigger data-ocid="gateway-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="payu">PayU</SelectItem>
                    <SelectItem value="cashfree">Cashfree</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="gateway-api-key"
                label="API Key / Client ID"
                description="Public-facing API key for initiating payment sessions"
                secret
              >
                <Input
                  type="password"
                  placeholder="pk_live_..."
                  value={config.gatewayApiKey}
                  onChange={(e) => update("gatewayApiKey", e.target.value)}
                  data-ocid="gateway-api-key"
                />
              </SettingsItemRow>

              <SettingsItemRow
                category={CAT}
                itemId="gateway-secret-key"
                label="Secret Key"
                description="Server-side secret — never expose to clients"
                secret
              >
                <Input
                  type="password"
                  placeholder="sk_live_..."
                  value={config.gatewaySecretKey}
                  onChange={(e) => update("gatewaySecretKey", e.target.value)}
                  data-ocid="gateway-secret-key"
                />
              </SettingsItemRow>

              <div className="flex justify-end">
                <Button onClick={handleSave} data-ocid="save-payment-btn">
                  Save Payment Gateway
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Module Visibility ── */}
        <TabsContent value="modules">
          <ModuleVisibilityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
