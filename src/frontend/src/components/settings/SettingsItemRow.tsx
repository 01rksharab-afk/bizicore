/**
 * SettingsItemRow — universal settings row wrapper with ON/OFF hide and Secret mode.
 *
 * Visual behaviour:
 *  - ON  (default):   normal display; children visible and interactive.
 *  - OFF (hidden):    row is dimmed/collapsed; children replaced with "--Hidden--".
 *  - Secret mode:     children replaced by ●●●●●● with an eye icon to reveal for 5 s.
 *
 * Admin mode (from context): hidden items are still shown but dimmed with dashed border.
 *
 * Right-hand controls use the compact ControlGroup (size=sm) so they match
 * the unified control pattern used across all BizCore modules.
 */

import { ControlGroup } from "@/components/ui/ControlGroup";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useSettingsVisibility } from "@/context/SettingsVisibilityContext";
import { useSettingsItemVisibility } from "@/hooks/useSettingsItemVisibility";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SettingsItemRowProps {
  category: string;
  itemId: string;
  label: string;
  description?: string;
  /** When true, an eye-icon secret toggle is shown and values can be masked */
  secret?: boolean;
  children: React.ReactNode;
  readOnly?: boolean;
}

export function SettingsItemRow({
  category,
  itemId,
  label,
  description,
  secret = false,
  children,
  readOnly = false,
}: SettingsItemRowProps) {
  const { settingsMode } = useSettingsVisibility();
  const { hidden, secretMode, setHidden, toggleSecret } =
    useSettingsItemVisibility(category, itemId);

  // Temporary reveal: show real value for 5 s then re-mask
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setRevealed(false), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const isAdminMode = settingsMode === "admin";
  const effectivelyHidden = hidden && !isAdminMode;

  // Secret eye button definition for ControlGroup
  const secretButton = secret
    ? [
        {
          label: secretMode ? (revealed ? "Re-mask in 5s" : "Reveal") : "Mask",
          icon: secretMode ? (
            <Eye className="size-3" />
          ) : (
            <EyeOff className="size-3" />
          ),
          onClick: secretMode && !revealed ? handleReveal : toggleSecret,
          variant: "ghost" as const,
          "data-ocid": `settings-secret-toggle-${itemId}`,
        },
      ]
    : undefined;

  if (effectivelyHidden) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 opacity-50 transition-all"
        data-ocid={`settings-row-hidden-${itemId}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <EyeOff className="size-3.5 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium text-muted-foreground truncate">
            {label}
          </p>
          <Badge
            variant="secondary"
            className="text-xs bg-muted text-muted-foreground shrink-0"
          >
            Hidden
          </Badge>
        </div>

        {/* Compact ControlGroup: just the ON/OFF toggle to re-enable */}
        <ControlGroup
          size="sm"
          enabled={false}
          onToggle={(v) => setHidden(!v)}
          toggleLabel="Show"
          showToggle={true}
        />
      </div>
    );
  }

  const showMasked = secret && secretMode && !revealed;

  return (
    <div
      className={`rounded-lg border transition-all ${
        hidden && isAdminMode
          ? "border-dashed border-border/60 bg-muted/5 opacity-60"
          : "border-border bg-card hover:bg-muted/10"
      } p-3`}
      data-ocid={`settings-row-${itemId}`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {readOnly && (
              <Lock
                className="size-3.5 text-muted-foreground"
                aria-label="Read-only"
              />
            )}
            {hidden && isAdminMode && (
              <Badge
                variant="secondary"
                className="text-xs bg-muted text-muted-foreground"
              >
                Hidden (Admin View)
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Right: compact ControlGroup (size=sm) with ON/OFF + optional secret eye */}
        <ControlGroup
          size="sm"
          enabled={!hidden}
          onToggle={(v) => !readOnly && setHidden(!v)}
          toggleLabel=""
          showToggle={true}
          buttons={secretButton}
        />
      </div>

      {/* Content area */}
      <div className="mt-3">
        {showMasked ? (
          <div className="flex items-center gap-2">
            <span className="text-lg tracking-widest text-muted-foreground select-none">
              ● ● ● ● ● ●
            </span>
            <button
              type="button"
              onClick={handleReveal}
              className="text-xs text-primary hover:underline"
            >
              Reveal
            </button>
          </div>
        ) : (
          <div
            className={readOnly ? "pointer-events-none opacity-60" : undefined}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export Switch for convenience — some settings pages import it from here
export { Switch };
