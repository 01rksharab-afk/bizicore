import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "draft";
export type SidebarPanel =
  | "notebooks"
  | "calculator"
  | "notifications"
  | "background"
  | null;

const LS_THEME = "bizcore_theme";

function readLS<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "draft");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "draft") root.classList.add("draft");
}

export function useSidebarState() {
  const [theme, setThemeState] = useState<Theme>(() =>
    readLS<Theme>(LS_THEME, "dark"),
  );
  const [activePanel, setActivePanelState] = useState<SidebarPanel>(null);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    writeLS(LS_THEME, t);
    applyTheme(t);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme =
        prev === "dark" ? "light" : prev === "light" ? "draft" : "dark";
      writeLS(LS_THEME, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const togglePanel = useCallback((panel: SidebarPanel) => {
    setActivePanelState((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => {
    setActivePanelState(null);
  }, []);

  return {
    theme,
    setTheme,
    cycleTheme,
    activePanel,
    togglePanel,
    closePanel,
  };
}
