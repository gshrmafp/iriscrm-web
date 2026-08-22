import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "@/lib/auth-storage";
import type { ApiErrorBody } from "@/types/entities";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{
      success: boolean;
      data: { accessToken: string };
    }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

// The API wraps every response body as { success: true, data } or
// { success: false, error }. Unwrap `data` here so the rest of the app can
// work with the plain payload instead of re-checking `success` everywhere.
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthRoute = originalRequest?.url?.includes("/auth/");
    const errorBody = error.response?.data as
      | { success: false; error: ApiErrorBody }
      | undefined;
    const errorCode = errorBody?.error?.code;

    // requireAuth re-checks live user/region status on every request (not
    // just login/refresh) — these two codes mean the *account* or *region*
    // was deactivated, not a routine expired-token 401, so they skip the
    // normal refresh-and-retry flow entirely (refreshing wouldn't help;
    // identityService.refresh re-checks the same status).
    if (errorCode === "ACCOUNT_INACTIVE") {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=inactive";
      }
      return Promise.reject(error);
    }
    if (errorCode === "REGION_INACTIVE") {
      // Tokens are kept (not cleared) — if the region is reactivated later,
      // the user shouldn't be forced to log back in.
      if (typeof window !== "undefined") {
        window.location.href = "/region-inactive";
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );
        return apiClient(originalRequest);
      }

      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | { success: false; error: ApiErrorBody }
      | undefined;
    if (body?.error?.message) {
      const fieldErrors = body.error.details?.fieldErrors;
      const fieldMessages = fieldErrors
        ? Object.entries(fieldErrors)
            .filter(([, msgs]) => msgs?.length)
            .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        : [];
      return fieldMessages.length
        ? `${body.error.message} — ${fieldMessages.join("; ")}`
        : body.error.message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
