import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { createActor } from "@/backend";
import type { backendInterface } from "@/backend";

export function useBackendActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCaffeineActor(createActor) as {
    actor: backendInterface | null;
    isFetching: boolean;
  };
}
