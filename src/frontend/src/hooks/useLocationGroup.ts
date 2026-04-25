import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

// ─── Locations ────────────────────────────────────────────────────────────────

export function useLocations() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listLocations(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLocation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createLocation"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createLocation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created");
    },
    onError: () => toast.error("Failed to create location"),
  });
}

export function useUpdateLocation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateLocation"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateLocation(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated");
    },
    onError: () => toast.error("Failed to update location"),
  });
}

export function useDeleteLocation() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteLocation(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted");
    },
    onError: () => toast.error("Failed to delete location"),
  });
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export function useGroups() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listGroups(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGroup() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createGroup"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createGroup(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created");
    },
    onError: () => toast.error("Failed to create group"),
  });
}

export function useUpdateGroup() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateGroup"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateGroup(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group updated");
    },
    onError: () => toast.error("Failed to update group"),
  });
}

export function useDeleteGroup() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteGroup(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group deleted");
    },
    onError: () => toast.error("Failed to delete group"),
  });
}
