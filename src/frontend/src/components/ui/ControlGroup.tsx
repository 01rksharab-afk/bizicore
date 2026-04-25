/**
 * ControlGroup — unified ON/OFF toggle + Swift/Switch segmented button + Custom Action Buttons
 * in one bordered, pill-shaped horizontal bar.
 *
 * Usage:
 *   <ControlGroup
 *     enabled={moduleEnabled}
 *     onToggle={setModuleEnabled}
 *     toggleLabel="Module"
 *     swiftOptions={[{ value: 'b2b', label: 'B2B' }, { value: 'b2c', label: 'B2C' }]}
 *     swiftValue={tab}
 *     onSwiftChange={setTab}
 *     buttons={[
 *       { label: 'New', icon: <PlusCircle />, onClick: handleNew },
 *       { label: 'Export', icon: <Download />, onClick: handleExport, variant: 'outline' },
 *     ]}
 *   />
 */

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ControlGroupButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
  "data-ocid"?: string;
}

export interface ControlGroupProps {
  // ON/OFF Toggle
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  toggleLabel?: string;
  showToggle?: boolean;

  // Swift/Switch segmented button
  swiftOptions?: { value: string; label: string }[];
  swiftValue?: string;
  onSwiftChange?: (value: string) => void;
  showSwift?: boolean;

  // Custom action buttons
  buttons?: ControlGroupButton[];

  // Container
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: {
    bar: "h-7",
    divider: "h-4",
    toggleSection: "px-2 gap-1.5",
    swiftSection: "px-1.5",
    buttonSection: "px-1.5 gap-1",
    badge: "text-[10px] px-1.5 py-0 min-w-[28px]",
    label: "text-[11px]",
    switchClass: "scale-75 origin-left",
    toggleItemClass: "h-5 px-2 text-[11px] rounded-sm",
    btnSize: "sm" as const,
    btnClass: "h-5 px-2 text-[11px] gap-1 [&_svg]:size-3",
  },
  md: {
    bar: "h-9",
    divider: "h-5",
    toggleSection: "px-3 gap-2",
    swiftSection: "px-2",
    buttonSection: "px-2 gap-1.5",
    badge: "text-xs px-2 py-0.5 min-w-[32px]",
    label: "text-xs",
    switchClass: "",
    toggleItemClass: "h-6 px-2.5 text-xs rounded",
    btnSize: "sm" as const,
    btnClass: "h-7 px-3 text-xs gap-1.5 [&_svg]:size-3.5",
  },
  lg: {
    bar: "h-11",
    divider: "h-6",
    toggleSection: "px-4 gap-2.5",
    swiftSection: "px-2.5",
    buttonSection: "px-2.5 gap-2",
    badge: "text-xs px-2 py-0.5 min-w-[34px]",
    label: "text-sm",
    switchClass: "scale-110 origin-left",
    toggleItemClass: "h-7 px-3 text-sm rounded-md",
    btnSize: "default" as const,
    btnClass: "h-8 px-4 text-sm gap-2 [&_svg]:size-4",
  },
};

function Divider({ className }: { className?: string }) {
  return (
    <span
      className={cn("w-px bg-border shrink-0", className)}
      aria-hidden="true"
    />
  );
}

export function ControlGroup({
  enabled = true,
  onToggle,
  toggleLabel = "Module",
  showToggle = true,
  swiftOptions,
  swiftValue,
  onSwiftChange,
  showSwift,
  buttons,
  className,
  size = "md",
}: ControlGroupProps) {
  const s = SIZE_MAP[size];

  const hasSwift =
    (showSwift ?? (swiftOptions != null && swiftOptions.length > 0)) &&
    swiftOptions &&
    swiftOptions.length > 0;
  const hasButtons = buttons && buttons.length > 0;

  // Nothing to render
  if (!showToggle && !hasSwift && !hasButtons) return null;

  return (
    <fieldset
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background shadow-sm overflow-hidden m-0 p-0",
        s.bar,
        className,
      )}
      aria-label="Module controls"
      data-ocid="control-group"
    >
      {/* ── ON/OFF Toggle section ─────────────────────────────── */}
      {showToggle && (
        <>
          <div
            className={cn("flex items-center shrink-0", s.toggleSection, s.bar)}
          >
            <span className={cn("font-medium text-muted-foreground", s.label)}>
              {toggleLabel}
            </span>

            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              aria-label={`Toggle ${toggleLabel}`}
              data-ocid="control-group-toggle"
              className={s.switchClass}
            />

            <span
              className={cn(
                "rounded-full font-semibold text-center leading-none flex items-center justify-center transition-colors",
                s.badge,
                enabled
                  ? "bg-primary/10 text-primary border border-primary/25"
                  : "bg-muted text-muted-foreground border border-border",
              )}
              aria-live="polite"
            >
              {enabled ? "ON" : "OFF"}
            </span>
          </div>

          {(hasSwift || hasButtons) && (
            <Divider className={cn("self-center my-auto", s.divider)} />
          )}
        </>
      )}

      {/* ── Swift/Switch segmented section ───────────────────── */}
      {hasSwift && (
        <>
          <div
            className={cn("flex items-center shrink-0", s.swiftSection, s.bar)}
          >
            <ToggleGroup
              type="single"
              value={swiftValue}
              onValueChange={(val) => {
                // Prevent deselecting — keep current value if user clicks active item
                if (val) onSwiftChange?.(val);
              }}
              variant="outline"
              className="gap-0 rounded-md border border-border overflow-hidden"
              aria-label="Swift switch"
              data-ocid="control-group-swift"
            >
              {swiftOptions!.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  aria-label={opt.label}
                  className={cn(
                    s.toggleItemClass,
                    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
                    "data-[state=off]:bg-background data-[state=off]:text-muted-foreground",
                    "border-0 font-medium transition-colors",
                    "first:border-r first:border-border last:border-l last:border-border",
                  )}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {hasButtons && (
            <Divider className={cn("self-center my-auto", s.divider)} />
          )}
        </>
      )}

      {/* ── Custom action buttons section ────────────────────── */}
      {hasButtons && (
        <div
          className={cn("flex items-center shrink-0", s.buttonSection, s.bar)}
        >
          {buttons!.map((btn, i) => (
            <Button
              key={`${btn.label}-${i}`}
              variant={btn.variant ?? "ghost"}
              size={s.btnSize}
              onClick={btn.onClick}
              disabled={btn.disabled}
              data-ocid={
                btn["data-ocid"] ??
                `control-group-btn-${btn.label.toLowerCase().replace(/\s+/g, "-")}`
              }
              className={cn(s.btnClass)}
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
