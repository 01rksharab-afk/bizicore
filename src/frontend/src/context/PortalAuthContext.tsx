import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortalCompany {
  id: string;
  name: string;
  type: string;
  logo?: string;
}

export interface PortalAdminSession {
  role: "portalAdmin";
  adminId: string;
  name: string;
  email: string;
  designation: string;
  company: PortalCompany;
}

export interface PortalEmployeeSession {
  role: "portalEmployee";
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  companyId: string;
  companyName: string;
  permissions: string[];
}

export type PortalSession = PortalAdminSession | PortalEmployeeSession;
export type PortalRole = "portalAdmin" | "portalEmployee" | null;

// ─── Context ──────────────────────────────────────────────────────────────────

interface PortalAuthContextValue {
  portalSession: PortalSession | null;
  portalRole: PortalRole;
  isPortalInitializing: boolean;
  loginAsAdmin: (session: PortalAdminSession) => void;
  loginAsEmployee: (session: PortalEmployeeSession) => void;
  logoutPortal: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

const STORAGE_KEY = "portalSession";

// ─── Session validation ────────────────────────────────────────────────────────

function isValidAdminSession(s: PortalSession): s is PortalAdminSession {
  return (
    s.role === "portalAdmin" &&
    typeof (s as PortalAdminSession).adminId === "string" &&
    (s as PortalAdminSession).adminId.length > 0 &&
    typeof (s as PortalAdminSession).email === "string"
  );
}

function isValidEmployeeSession(s: PortalSession): s is PortalEmployeeSession {
  return (
    s.role === "portalEmployee" &&
    typeof (s as PortalEmployeeSession).employeeId === "string" &&
    (s as PortalEmployeeSession).employeeId.length > 0
  );
}

function isValidSession(s: PortalSession): boolean {
  return isValidAdminSession(s) || isValidEmployeeSession(s);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortalAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [portalSession, setPortalSession] = useState<PortalSession | null>(
    null,
  );
  const [isPortalInitializing, setIsPortalInitializing] = useState(true);

  // Hydrate from localStorage on mount; validate before restoring
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PortalSession;
        if (isValidSession(parsed)) {
          setPortalSession(parsed);
        } else {
          // Corrupted or incomplete session — clear it
          console.warn("[BizCore] PortalAuthContext: invalid session cleared");
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsPortalInitializing(false);
    }
  }, []);

  const loginAsAdmin = useCallback((session: PortalAdminSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setPortalSession(session);
  }, []);

  const loginAsEmployee = useCallback((session: PortalEmployeeSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setPortalSession(session);
  }, []);

  const logoutPortal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPortalSession(null);
  }, []);

  const portalRole: PortalRole = portalSession?.role ?? null;

  return (
    <PortalAuthContext.Provider
      value={{
        portalSession,
        portalRole,
        isPortalInitializing,
        loginAsAdmin,
        loginAsEmployee,
        logoutPortal,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) {
    throw new Error("usePortalAuth must be used within PortalAuthProvider");
  }
  return ctx;
}
