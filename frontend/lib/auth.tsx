"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  theme_preference: string;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  tenant_currency: string | null;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function storeTokens(tokens: AuthTokens) {
  window.localStorage.setItem("munshi_access_token", tokens.access_token);
  window.localStorage.setItem("munshi_refresh_token", tokens.refresh_token);
}

function clearTokens() {
  window.localStorage.removeItem("munshi_access_token");
  window.localStorage.removeItem("munshi_refresh_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchMe = React.useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/users/me");
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!window.localStorage.getItem("munshi_access_token")) {
      setIsLoading(false);
      return;
    }
    void fetchMe();
  }, [fetchMe]);

  const login = React.useCallback(
    async (tokens: AuthTokens) => {
      storeTokens(tokens);
      setIsLoading(true);
      await fetchMe();
    },
    [fetchMe]
  );

  const logout = React.useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
