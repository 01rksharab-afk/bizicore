/**
 * Dashboard Background + Custom Report Widgets
 * Local-state hooks for dashboard customization.
 */
import { useCallback, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardBackground {
  bgColor: string;
  wallpaperUrl: string;
  wallpaperOpacity: number;
}

export type WidgetSize = "sm" | "md" | "lg" | "xl";
export type WidgetColor =
  | "default"
  | "accent"
  | "emerald"
  | "orange"
  | "purple";

export interface DashboardReportWidget {
  id: string;
  title: string;
  reportType: string;
  size: WidgetSize;
  color: WidgetColor;
  enabled: boolean;
  createdAt: number;
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const DASHBOARD_BG_KEY = "dashboard_background";
const REPORT_WIDGETS_KEY = "dashboard_report_widgets";

// ─── Dashboard Background hooks ───────────────────────────────────────────────

const DEFAULT_BG: DashboardBackground = {
  bgColor: "",
  wallpaperUrl: "",
  wallpaperOpacity: 0.95,
};

export function useGetDashboardBackground() {
  const [bg, setBg] = useState<DashboardBackground>(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_BG_KEY);
      return stored ? (JSON.parse(stored) as DashboardBackground) : DEFAULT_BG;
    } catch {
      return DEFAULT_BG;
    }
  });

  const setBackground = useCallback((next: Partial<DashboardBackground>) => {
    setBg((prev) => {
      const updated = { ...prev, ...next };
      localStorage.setItem(DASHBOARD_BG_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { bg, setBackground };
}

export function useSetDashboardBackground() {
  const { setBackground } = useGetDashboardBackground();
  return { mutate: setBackground, isPending: false };
}

// ─── Dashboard Report Widget hooks ────────────────────────────────────────────

const DEFAULT_WIDGETS: DashboardReportWidget[] = [
  {
    id: "drw-1",
    title: "Manufacturing Output by Line",
    reportType: "manufacturing-output",
    size: "md",
    color: "emerald",
    enabled: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "drw-2",
    title: "Inventory Turnover Rate",
    reportType: "inventory-turnover",
    size: "md",
    color: "accent",
    enabled: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: "drw-3",
    title: "Sales vs Purchase",
    reportType: "sales-purchase",
    size: "lg",
    color: "orange",
    enabled: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "drw-4",
    title: "GST Liability Summary",
    reportType: "gst-summary",
    size: "sm",
    color: "purple",
    enabled: true,
    createdAt: Date.now() - 86400000 * 2,
  },
];

export function useListDashboardReportWidgets() {
  const [widgets, setWidgets] = useState<DashboardReportWidget[]>(() => {
    try {
      const stored = localStorage.getItem(REPORT_WIDGETS_KEY);
      return stored
        ? (JSON.parse(stored) as DashboardReportWidget[])
        : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const save = (next: DashboardReportWidget[]) => {
    localStorage.setItem(REPORT_WIDGETS_KEY, JSON.stringify(next));
    setWidgets(next);
  };

  return { widgets, save };
}

export function useCreateDashboardReportWidget() {
  const { widgets, save } = useListDashboardReportWidgets();
  return {
    mutate: (input: Omit<DashboardReportWidget, "id" | "createdAt">) => {
      const next = [
        ...widgets,
        { ...input, id: `drw-${Date.now()}`, createdAt: Date.now() },
      ];
      save(next);
    },
    isPending: false,
  };
}

export function useUpdateDashboardReportWidget() {
  const { widgets, save } = useListDashboardReportWidgets();
  return {
    mutate: (input: DashboardReportWidget) => {
      save(widgets.map((w) => (w.id === input.id ? input : w)));
    },
    isPending: false,
  };
}

export function useDeleteDashboardReportWidget() {
  const { widgets, save } = useListDashboardReportWidgets();
  return {
    mutate: (id: string) => {
      save(widgets.filter((w) => w.id !== id));
    },
    isPending: false,
  };
}
