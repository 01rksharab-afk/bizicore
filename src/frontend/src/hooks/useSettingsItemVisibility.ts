import { useSettingsVisibility } from "@/context/SettingsVisibilityContext";
import { useCallback } from "react";

export interface SettingsItemVisibilityResult {
  hidden: boolean;
  secretMode: boolean;
  toggleHidden: () => void;
  toggleSecret: () => void;
  setHidden: (v: boolean) => void;
  setSecret: (v: boolean) => void;
}

/**
 * Per-item hook that reads and writes visibility/secret state.
 * - `hidden`: when true the row is collapsed (respects admin mode override).
 * - `secretMode`: when true the value should be masked with dots.
 */
export function useSettingsItemVisibility(
  category: string,
  itemId: string,
): SettingsItemVisibilityResult {
  const { isItemHidden, isItemSecret, setItemHidden, setItemSecret } =
    useSettingsVisibility();

  const hidden = isItemHidden(category, itemId);
  const secretMode = isItemSecret(category, itemId);

  const toggleHidden = useCallback(
    () => setItemHidden(category, itemId, !hidden),
    [category, itemId, hidden, setItemHidden],
  );

  const toggleSecret = useCallback(
    () => setItemSecret(category, itemId, !secretMode),
    [category, itemId, secretMode, setItemSecret],
  );

  const setHidden = useCallback(
    (v: boolean) => setItemHidden(category, itemId, v),
    [category, itemId, setItemHidden],
  );

  const setSecret = useCallback(
    (v: boolean) => setItemSecret(category, itemId, v),
    [category, itemId, setItemSecret],
  );

  return {
    hidden,
    secretMode,
    toggleHidden,
    toggleSecret,
    setHidden,
    setSecret,
  };
}
