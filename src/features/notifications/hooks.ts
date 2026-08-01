import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import * as api from "@/features/notifications/api";

export const notificationsKeys = {
  all: ["notifications"] as const,
};

// Polling, no push — 30s matches the app-wide React Query staleTime
// convention and keeps the bell feeling live without hammering the API.
export function useNotifications() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: notificationsKeys.all,
    queryFn: () => api.listNotifications(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.items.filter((n) => !n.readAt).length ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
