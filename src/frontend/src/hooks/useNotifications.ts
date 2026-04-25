import type { NotifType, Notification } from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveOrg } from "./useOrg";

export type { Notification, NotifType };

export function useNotifications() {
  const { actor, isFetching } = useBackendActor();
  const { activeOrg } = useActiveOrg();
  const orgId = activeOrg?.id?.toString() ?? "";
  const enabled = !!actor && !isFetching && !!orgId;
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery<Notification[]>({
    queryKey: ["notifications", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return [];
      return actor.listNotifications(orgId);
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const unreadCountQuery = useQuery<bigint>({
    queryKey: ["notifications-unread", orgId],
    queryFn: async () => {
      if (!actor || !orgId) return BigInt(0);
      return actor.getUnreadCount(orgId);
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected to backend");
      return actor.markNotificationRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", orgId],
      });
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to mark notification read");
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!actor || !orgId) throw new Error("Not connected to backend");
      return actor.markAllNotificationsRead(orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", orgId],
      });
      toast.success("All notifications marked as read");
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to mark all notifications read");
    },
  });

  const createNotification = useMutation({
    mutationFn: async ({
      notifType,
      title,
      message,
    }: {
      notifType: NotifType;
      title: string;
      message: string;
    }) => {
      if (!actor || !orgId) throw new Error("Not connected to backend");
      return actor.publishNotification(orgId, notifType, title, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", orgId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread", orgId],
      });
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "Failed to create notification");
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    unreadCount: Number(unreadCountQuery.data ?? BigInt(0)),
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingAllRead: markAllRead.isPending,
    createNotification: createNotification.mutate,
  };
}

// Group notifications by type
export function groupNotifications(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {
    System: [],
    B2BSyncNotif: [],
    Invoice: [],
    GSTFiling: [],
  };
  for (const n of notifications) {
    const key = n.notifType as unknown as string;
    if (key in groups) {
      groups[key].push(n);
    }
  }
  return groups;
}
