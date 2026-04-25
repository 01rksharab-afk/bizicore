import {
  type CreateShipmentInput,
  type Shipment,
  ShipmentStatus,
  type TrackingInfo,
  type UpdateShipmentInput,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export { ShipmentStatus };

export function useShipments(
  orgId: bigint | null,
  statusFilter: ShipmentStatus | null = null,
) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Shipment[]>({
    queryKey: ["shipments", orgId?.toString(), statusFilter],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listShipments(orgId, statusFilter, null, null);
    },
    enabled: !!actor && !isFetching && !!orgId,
  });
}

export function useShipment(orgId: bigint | null, id: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Shipment | null>({
    queryKey: ["shipment", orgId?.toString(), id.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return actor.getShipment(orgId, id);
    },
    enabled: !!actor && !isFetching && !!orgId && id > 0n,
  });
}

export function useTrackShipment(orgId: bigint | null, id: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery<TrackingInfo | null>({
    queryKey: ["shipment-tracking", orgId?.toString(), id.toString()],
    queryFn: async () => {
      if (!actor || !orgId) return null;
      return actor.trackShipment(orgId, id);
    },
    enabled: !!actor && !isFetching && !!orgId && id > 0n,
  });
}

export function useCreateShipment(orgId: bigint | null) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<Shipment, Error, CreateShipmentInput>({
    mutationFn: async (input) => {
      if (!actor || !orgId) throw new Error("No actor");
      return actor.createShipment(orgId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shipments", orgId?.toString()],
      });
    },
  });
}

export function useUpdateShipment(orgId: bigint | null) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    Shipment | null,
    Error,
    { id: bigint; input: UpdateShipmentInput }
  >({
    mutationFn: async ({ id, input }) => {
      if (!actor || !orgId) throw new Error("No actor");
      return actor.updateShipment(orgId, id, input);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["shipments", orgId?.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["shipment", orgId?.toString(), id.toString()],
      });
    },
  });
}

export function useUpdateShipmentStatus(orgId: bigint | null) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<
    Shipment | null,
    Error,
    { id: bigint; status: ShipmentStatus }
  >({
    mutationFn: async ({ id, status }) => {
      if (!actor || !orgId) throw new Error("No actor");
      return actor.updateShipmentStatus(orgId, id, status);
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["shipments", orgId?.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["shipment", orgId?.toString(), id.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["shipment-tracking", orgId?.toString(), id.toString()],
      });
    },
  });
}

export function useDeleteShipment(orgId: bigint | null) {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, bigint>({
    mutationFn: async (id) => {
      if (!actor || !orgId) throw new Error("No actor");
      return actor.deleteShipment(orgId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shipments", orgId?.toString()],
      });
    },
  });
}
