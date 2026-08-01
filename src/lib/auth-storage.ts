import Cookies from "js-cookie";
import type { AuthTokens, AuthUser, DecodedAccessToken } from "@/types/entities";

const ACCESS_TOKEN_KEY = "iris_access_token";
const REFRESH_TOKEN_KEY = "iris_refresh_token";
const USER_KEY = "iris_user";

const COOKIE_OPTIONS = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  expires: 7,
};

export function setTokens(tokens: AuthTokens) {
  Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, COOKIE_OPTIONS);
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, COOKIE_OPTIONS);
  Cookies.set(USER_KEY, JSON.stringify(tokens.user), COOKIE_OPTIONS);
}

export function setAccessToken(accessToken: string) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, COOKIE_OPTIONS);
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

/** Decodes a JWT payload without verifying the signature — used only to
 * check expiry client-side. The backend remains the source of truth for
 * authorization on every request. */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json))) as DecodedAccessToken;
  } catch {
    return null;
  }
}

export function isTokenExpired(decoded: DecodedAccessToken | null): boolean {
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 <= Date.now();
}
