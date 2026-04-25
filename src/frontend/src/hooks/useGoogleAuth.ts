import { useState } from "react";

// ─── Auth method constants ─────────────────────────────────────────────────────
export const AuthMethod = {
  internetIdentity: "internetIdentity",
  google: "google",
  phone: "phone",
} as const;
export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoogleCredential {
  credential: string; // JWT ID token
}

export type GoogleAuthState =
  | { status: "idle" }
  | { status: "awaitingII" }
  | { status: "pending" }
  | { status: "success" }
  | { status: "error"; message: string };

export interface LinkedIdentity {
  method: AuthMethod;
  externalId: string;
  linkedAt: bigint;
}

/**
 * Hook for Google account linking.
 *
 * NOTE: The backend auth-linking methods (linkGoogleAccount, getLinkedIdentities,
 * unlinkIdentity) are not yet available in the current backend version.
 * All operations return a "coming soon" state. The UI is preserved so this
 * can be wired up when the backend is upgraded.
 */
export function useGoogleAuth() {
  const [state, setState] = useState<GoogleAuthState>({ status: "idle" });
  const [isLoading] = useState(false);
  const [isUnlinking] = useState(false);

  function comingSoon() {
    setState({
      status: "error",
      message:
        "Google account linking will be available in a future update. Sign in with Internet Identity to continue.",
    });
  }

  return {
    state,
    isReady: false,
    /** Link Google account — coming soon */
    linkGoogle: comingSoon,
    /** Legacy alias used on login page */
    signInWithGoogle: comingSoon,
    unlinkGoogle: comingSoon,
    isLoading,
    isUnlinking,
    error: state.status === "error" ? state.message : null,
    reset: () => setState({ status: "idle" }),
  };
}
