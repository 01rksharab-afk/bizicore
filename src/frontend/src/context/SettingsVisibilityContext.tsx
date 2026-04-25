import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SettingsMode = "public" | "admin" | "secret";

const GLOBAL_MODE_KEY = "settings_visibility_mode";

function hiddenKey(category: string, itemId: string) {
  return `setting_hidden_${category}_${itemId}`;
}
function secretKey(category: string, itemId: string) {
  return `setting_secret_${category}_${itemId}`;
}

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

interface SettingsVisibilityContextValue {
  settingsMode: SettingsMode;
  setGlobalMode: (mode: SettingsMode) => void;
  isItemHidden: (category: string, itemId: string) => boolean;
  isItemSecret: (category: string, itemId: string) => boolean;
  setItemHidden: (category: string, itemId: string, hidden: boolean) => void;
  setItemSecret: (category: string, itemId: string, secret: boolean) => void;
  hideAllSensitive: (category: string, itemIds: string[]) => void;
  showAllHidden: (category: string, itemIds: string[]) => void;
  // force re-render token
  _rev: number;
}

const SettingsVisibilityContext =
  createContext<SettingsVisibilityContextValue | null>(null);

export function SettingsVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settingsMode, setSettingsModeState] = useState<SettingsMode>(() => {
    try {
      const v = localStorage.getItem(GLOBAL_MODE_KEY);
      if (v === "public" || v === "admin" || v === "secret") return v;
    } catch {
      // ignore
    }
    return "admin";
  });
  const [_rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((r) => r + 1), []);

  const setGlobalMode = useCallback(
    (mode: SettingsMode) => {
      setSettingsModeState(mode);
      writeBool(GLOBAL_MODE_KEY, false);
      try {
        localStorage.setItem(GLOBAL_MODE_KEY, mode);
      } catch {
        // ignore
      }
      bump();
    },
    [bump],
  );

  const isItemHidden = useCallback(
    (category: string, itemId: string) => {
      void _rev; // depend on _rev so updates propagate
      if (settingsMode === "admin") return false;
      return readBool(hiddenKey(category, itemId));
    },
    [settingsMode, _rev],
  );

  const isItemSecret = useCallback(
    (category: string, itemId: string) => {
      void _rev; // depend on _rev so updates propagate
      if (settingsMode === "secret") return true;
      return readBool(secretKey(category, itemId));
    },
    [settingsMode, _rev],
  );

  const setItemHidden = useCallback(
    (category: string, itemId: string, hidden: boolean) => {
      writeBool(hiddenKey(category, itemId), hidden);
      bump();
    },
    [bump],
  );

  const setItemSecret = useCallback(
    (category: string, itemId: string, secret: boolean) => {
      writeBool(secretKey(category, itemId), secret);
      bump();
    },
    [bump],
  );

  const hideAllSensitive = useCallback(
    (category: string, itemIds: string[]) => {
      for (const id of itemIds) writeBool(secretKey(category, id), true);
      bump();
    },
    [bump],
  );

  const showAllHidden = useCallback(
    (category: string, itemIds: string[]) => {
      for (const id of itemIds) writeBool(hiddenKey(category, id), false);
      bump();
    },
    [bump],
  );

  // Sync mode from storage on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem(GLOBAL_MODE_KEY);
      if (v === "public" || v === "admin" || v === "secret") {
        setSettingsModeState(v);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <SettingsVisibilityContext.Provider
      value={{
        settingsMode,
        setGlobalMode,
        isItemHidden,
        isItemSecret,
        setItemHidden,
        setItemSecret,
        hideAllSensitive,
        showAllHidden,
        _rev,
      }}
    >
      {children}
    </SettingsVisibilityContext.Provider>
  );
}

export function useSettingsVisibility() {
  const ctx = useContext(SettingsVisibilityContext);
  if (!ctx)
    throw new Error(
      "useSettingsVisibility must be used inside SettingsVisibilityProvider",
    );
  return ctx;
}
