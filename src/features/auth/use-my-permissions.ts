import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/features/auth/AuthProvider";

// Permission keys from the backend's PERMISSIONS map (e.g. "hr.employee.manage").
// The server enforces every one of these on its own; this is only for showing
// or hiding UI the user can't use anyway.
export const HR_PERMISSIONS = {
  DASHBOARD_VIEW: "hr.dashboard.view",
  EMPLOYEE_VIEW: "hr.employee.view",
  EMPLOYEE_MANAGE: "hr.employee.manage",
  EMPLOYEE_SENSITIVE_VIEW: "hr.employee.sensitive.view",
  ORG_MANAGE: "hr.org.manage",
  SETTINGS_MANAGE: "hr.settings.manage",
} as const;

export function useMyPermissions() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["auth", "me", "permissions", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<string[]>("/auth/me/permissions");
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
  const keys = useMemo(() => new Set(query.data ?? []), [query.data]);
  const has = useCallback((key: string) => keys.has(key), [keys]);
  return { has, isLoading: query.isLoading };
}
