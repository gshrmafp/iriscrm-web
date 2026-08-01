import { apiClient } from "@/lib/api-client";
import type { AuthTokens } from "@/types/entities";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", payload);
  return data;
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/refresh", {
    refreshToken,
  });
  return data;
}
