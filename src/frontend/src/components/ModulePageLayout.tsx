import { ControlGroup } from "@/components/ui/ControlGroup";
import { AlertTriangle } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";

interface ModulePageLayoutProps {
  title: string;
  moduleName: string;
  children: ReactNode;
  /**
   * ReactNode slot for action buttons (Import, Export, Report, New, etc.).
   * Rendered to the right of the ON/OFF ControlGroup — only shown when module is enabled.
   */
  actions?: ReactNode;
  /**
   * When true, renders the ON/OFF module toggle in the header.
   * Defaults to false — individual module pages should NOT show the toggle.
   * Only Console page and Admin-level pages should pass showModuleToggle={true}.
   */
  showModuleToggle?: boolean;
}

function getStorageKey(moduleName: string) {
  return `module_visibility_${moduleName.toLowerCase().replace(/\s+/g, "_")}`;
}

export function useModuleVisibility(moduleName: string) {
  const key = getStorageKey(moduleName);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const setModuleVisibility = useCallback(
    (value: boolean) => {
      setEnabled(value);
      try {
        localStorage.setItem(key, String(value));
      } catch {
        // ignore
      }
    },
    [key],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      setEnabled(stored === null ? true : stored === "true");
    } catch {
      // ignore
    }
  }, [key]);

  return { enabled, setModuleVisibility };
}

export function ModulePageLayout({
  title,
  moduleName,
  children,
  actions,
  showModuleToggle = false,
}: ModulePageLayoutProps) {
  const { enabled, setModuleVisibility } = useModuleVisibility(moduleName);

  // When toggle is hidden, treat the module as always enabled (no read-only banner)
  const isEnabled = showModuleToggle ? enabled : true;

  return (
    <div
      className="space-y-4"
      data-ocid={`module-page-${moduleName.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-display font-semibold text-foreground">
          {title}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ON/OFF ControlGroup — only shown when showModuleToggle is true */}
          {showModuleToggle && (
            <ControlGroup
              enabled={enabled}
              onToggle={setModuleVisibility}
              toggleLabel="Module"
              showToggle={true}
            />
          )}
          {/* Action buttons — only shown when module is enabled */}
          {isEnabled && actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      </div>

      {/* Disabled banner — only shown when toggle is visible and module is off */}
      {showModuleToggle && !enabled && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span>
            <span className="font-medium text-foreground">{title}</span> is
            disabled. Data is read-only. Enable the module to make changes.
          </span>
        </div>
      )}

      {/* Page content */}
      <div
        className={
          showModuleToggle && !enabled
            ? "pointer-events-none opacity-60 select-none"
            : ""
        }
      >
        {children}
      </div>
    </div>
  );
}
