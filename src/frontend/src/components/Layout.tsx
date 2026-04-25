import { useAuth } from "@/hooks/useAuth";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useTrafficCapture } from "@/hooks/useTraffic";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

// ─── Traffic capture runner ────────────────────────────────────────────────────

function TrafficCaptureRunner() {
  useTrafficCapture();
  return null;
}

// ─── Error boundary for individual sections ───────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class SectionErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[BizCore] Section error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="bg-card border border-destructive/30 rounded-xl p-6 flex flex-col items-center gap-3 text-center"
          data-ocid="section-error-boundary"
        >
          <AlertTriangle className="size-6 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {this.props.label ?? "This section"} couldn't load
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {this.state.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Connection error banner ───────────────────────────────────────────────────

function ConnectionBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center justify-between gap-3"
      data-ocid="connection-error-banner"
    >
      <div className="flex items-center gap-2 text-sm text-destructive">
        <WifiOff className="size-4 shrink-0" />
        <span>
          Having trouble connecting to BizCore services. Some data may not load.
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-xs font-medium text-destructive hover:underline shrink-0 flex items-center gap-1"
        data-ocid="connection-retry-btn"
      >
        <RefreshCw className="size-3" />
        Refresh
      </button>
    </div>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isInitializing, isConnecting } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, activePanel, togglePanel, closePanel } =
    useSidebarState();

  // Track prolonged connection failure: show banner if isConnecting for >8s after auth
  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const connectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAuthenticated && isConnecting) {
      connectingTimerRef.current = setTimeout(() => {
        setBackendUnreachable(true);
      }, 8_000);
    } else {
      if (connectingTimerRef.current) clearTimeout(connectingTimerRef.current);
      if (!isConnecting) setBackendUnreachable(false);
    }
    return () => {
      if (connectingTimerRef.current) clearTimeout(connectingTimerRef.current);
    };
  }, [isAuthenticated, isConnecting]);

  // Timeout: if still initializing after 20s, show "taking longer than usual"
  const [initTimedOut, setInitTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInitializing) {
      setInitTimedOut(false);
      timeoutRef.current = setTimeout(() => {
        setInitTimedOut(true);
      }, 20_000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isInitializing]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  // Show a full-screen loader while II is still checking the session
  if (isInitializing) {
    if (initTimedOut) {
      return (
        <div
          className="min-h-screen bg-background flex items-center justify-center p-6"
          data-ocid="init-timeout-screen"
        >
          <div className="bg-card border border-amber-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="size-14 rounded-full bg-amber-500/10 mx-auto flex items-center justify-center">
              <AlertTriangle className="size-7 text-amber-500" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground text-lg">
                Taking longer than usual
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Unable to connect to BizCore services. Please check your
                connection and try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              data-ocid="init-timeout-retry-btn"
            >
              <RefreshCw className="size-4" />
              Retry connection
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="init-loading-screen"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm">Loading BizCore…</p>
        </div>
      </div>
    );
  }

  // While unauthenticated (after init): render nothing — the redirect effect fires
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        setTheme={setTheme}
        activePanel={activePanel}
        togglePanel={togglePanel}
        closePanel={closePanel}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuOpen={() => setSidebarOpen(true)} />

        {/* Connection error banner — shown when backend is unreachable after auth */}
        <ConnectionBanner visible={backendUnreachable} />

        <main
          className="flex-1 overflow-y-auto bg-background"
          data-ocid="main-content"
        >
          <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
            <SectionErrorBoundary label="This page">
              <Outlet />
            </SectionErrorBoundary>
          </div>
        </main>
      </div>

      {/* Traffic capture — fires on every page navigation */}
      <TrafficCaptureRunner />
    </div>
  );
}
