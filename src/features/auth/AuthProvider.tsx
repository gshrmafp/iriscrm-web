"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest, type LoginPayload } from "@/features/auth/api";
import {
  clearTokens,
  decodeAccessToken,
  getAccessToken,
  getStoredUser,
  isTokenExpired,
  setTokens,
} from "@/lib/auth-storage";
import type { AuthUser } from "@/types/entities";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // One-time hydration from the auth cookies on mount — not a derived-state
  // anti-pattern, there is no prop/state this could be computed from instead.
  useEffect(() => {
    const token = getAccessToken();
    const decoded = token ? decodeAccessToken(token) : null;
    const storedUser = getStoredUser();
    if (decoded && !isTokenExpired(decoded) && storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(storedUser);
    } else if (token) {
      clearTokens();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await loginRequest(payload);
      setTokens(tokens);
      setUser(tokens.user);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
