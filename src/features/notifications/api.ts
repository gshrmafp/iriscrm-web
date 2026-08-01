import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/types/entities";

export interface ListNotificationsResult {
  items: Notification[];
  total: number;
}

export async function listNotifications(
  unreadOnly = false,
): Promise<ListNotificationsResult> {
  const { data } = await apiClient.get<Notification[]>("/notifications", {
    params: { unreadOnly, pageSize: 50 },
  });
  return { items: data, total: data.length };
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await apiClient.post<Notification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}
