import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

// ─── Item Masters ─────────────────────────────────────────────────────────────

export function useItemMasters(searchText?: string) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["itemMasters", searchText ?? ""],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listItemMasters(
        getOrgId(),
        searchText ?? null,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useItemMaster(id: bigint | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["itemMaster", id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return (actor as backendInterface).getItemMaster(getOrgId(), id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateItemMaster() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createItemMaster"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createItemMaster(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itemMasters"] });
      toast.success("Item created");
    },
    onError: () => toast.error("Failed to create item"),
  });
}

export function useUpdateItemMaster() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateItemMaster"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateItemMaster(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itemMasters"] });
      toast.success("Item updated");
    },
    onError: () => toast.error("Failed to update item"),
  });
}

export function useDeleteItemMaster() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteItemMaster(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itemMasters"] });
      toast.success("Item deleted");
    },
    onError: () => toast.error("Failed to delete item"),
  });
}

// ─── Units of Measure ────────────────────────────────────────────────────────

export function useUoms() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["uoms"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listUoms(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateUom() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<backendInterface["createUom"]>[1]) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createUom(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uoms"] });
      toast.success("UOM created");
    },
    onError: () => toast.error("Failed to create UOM"),
  });
}

export function useDeleteUom() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteUom(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uoms"] });
      toast.success("UOM deleted");
    },
    onError: () => toast.error("Failed to delete UOM"),
  });
}

// ─── Stock Levels ─────────────────────────────────────────────────────────────

export function useStockLevels(locationId?: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["stockLevels", locationId?.toString() ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listStockLevels(
        getOrgId(),
        locationId ?? null,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertStockLevel() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["upsertStockLevel"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).upsertStockLevel(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stockLevels"] });
      toast.success("Stock level updated");
    },
    onError: () => toast.error("Failed to update stock level"),
  });
}

// ─── Item Attributes ─────────────────────────────────────────────────────────

export function useItemAttributes() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["itemAttributes"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listItemAttributes(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateItemAttribute() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createItemAttribute"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createItemAttribute(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itemAttributes"] });
      toast.success("Attribute created");
    },
    onError: () => toast.error("Failed to create attribute"),
  });
}

export function useDeleteItemAttribute() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteItemAttribute(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itemAttributes"] });
      toast.success("Attribute deleted");
    },
    onError: () => toast.error("Failed to delete attribute"),
  });
}
