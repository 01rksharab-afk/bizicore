import { AuthMethod } from "@/hooks/useGoogleAuth";
import type { LinkedIdentity } from "@/hooks/useGoogleAuth";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhoneAuthState =
  | { step: "enterPhone" }
  | { step: "enterOtp"; phone: string }
  | { step: "verifying"; phone: string }
  | { step: "success" }
  | { step: "error"; message: string };

// Re-export for consumers that import from this file
export type { LinkedIdentity };
export { AuthMethod };

const COMING_SOON_MSG =
  "Phone number linking will be available in a future update. Sign in with Internet Identity to continue.";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for phone number OTP linking.
 *
 * NOTE: The backend auth-linking methods (sendPhoneOtp, verifyPhoneOtp,
 * getLinkedIdentities, unlinkIdentity) are not yet available in the current
 * backend version. All operations return a "coming soon" state. The UI is
 * preserved so this can be wired up when the backend is upgraded.
 */
export function usePhoneAuth() {
  const [state, setState] = useState<PhoneAuthState>({ step: "enterPhone" });

  function comingSoon() {
    setState({ step: "error", message: COMING_SOON_MSG });
  }

  return {
    state,
    isReady: false,
    isSendingOtp: false,
    isVerifying: false,
    isUnlinking: false,
    sendOtp: (_phone: string) => comingSoon(),
    verifyOtp: (_phone: string, _code: string) => comingSoon(),
    resendOtp: (_phone: string) => comingSoon(),
    unlinkPhone: comingSoon,
    reset: () => setState({ step: "enterPhone" }),
    error: state.step === "error" ? state.message : null,
  };
}
