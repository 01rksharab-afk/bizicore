import { useBackendActor } from "@/lib/backend";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useAuth() {
  const {
    identity,
    login: iiLogin,
    clear,
    loginStatus,
  } = useInternetIdentity();
  const { actor, isFetching } = useBackendActor();
  const [loginError, setLoginError] = useState<string | null>(null);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  // True while II is still initializing — never redirect during this window
  const isInitializing = loginStatus === "initializing";
  // True while the actor is still connecting to the backend
  const isConnecting = isFetching;

  const profileQuery = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 1,
    meta: {
      onError: () => {
        toast.error("Failed to load user profile");
      },
    },
  });

  const queryClient = useQueryClient();

  // Wrapped login that catches errors and exposes them
  const login = async () => {
    setLoginError(null);
    try {
      await iiLogin();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      console.error("[BizCore] Login error:", e);
      const msg =
        raw.includes("UserInterrupt") ||
        raw.includes("closed") ||
        raw.includes("cancel")
          ? "Login was cancelled. Please try again."
          : `Login failed: ${raw}`;
      setLoginError(msg);
      throw new Error(msg);
    }
  };

  const saveProfile = useMutation({
    mutationFn: async (profile: { name: string; email?: string }) => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile saved successfully");
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to save profile");
    },
  });

  return {
    identity,
    isAuthenticated,
    isInitializing,
    isConnecting,
    login,
    logout: clear,
    loginStatus,
    loginError,
    profile: profileQuery.data ?? null,
    isProfileLoading: profileQuery.isLoading,
    saveProfile: saveProfile.mutate,
    isSavingProfile: saveProfile.isPending,
  };
}
