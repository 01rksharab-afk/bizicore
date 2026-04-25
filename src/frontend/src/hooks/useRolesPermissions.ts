import type { backendInterface } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function getOrgId(): bigint {
  return BigInt(sessionStorage.getItem("activeOrgId") ?? "0");
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export function useRoles() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listRoles(getOrgId());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["createRole"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).createRole(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created");
    },
    onError: () => toast.error("Failed to create role"),
  });
}

export function useUpdateRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["updateRole"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).updateRole(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });
}

export function useDeleteRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).deleteRole(getOrgId(), id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted");
    },
    onError: () => toast.error("Failed to delete role"),
  });
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export function usePermissions(roleId?: bigint) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["permissions", roleId?.toString() ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listPermissions(
        getOrgId(),
        roleId ?? null,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPermission() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["setPermission"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).setPermission(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permission updated");
    },
    onError: () => toast.error("Failed to update permission"),
  });
}

// ─── User Role Assignments ────────────────────────────────────────────────────

export function useUserRoleAssignments() {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: ["userRoleAssignments"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as backendInterface).listUserRoleAssignments(
        getOrgId(),
        null,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<backendInterface["assignUserRole"]>[1],
    ) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).assignUserRole(getOrgId(), input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRoleAssignments"] });
      toast.success("Role assigned");
    },
    onError: () => toast.error("Failed to assign role"),
  });
}

export function useRevokeUserRole() {
  const { actor } = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: bigint) => {
      if (!actor) throw new Error("Not ready");
      return (actor as backendInterface).revokeUserRole(
        getOrgId(),
        assignmentId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRoleAssignments"] });
      toast.success("Role revoked");
    },
    onError: () => toast.error("Failed to revoke role"),
  });
}
