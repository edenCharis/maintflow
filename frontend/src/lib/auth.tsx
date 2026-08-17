"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiJson, getTokens, setTokens } from "@/lib/api";
import { MeUser } from "@/lib/types";

interface AuthContextValue {
  user: MeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const tokens = getTokens();
      if (!tokens) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiJson<MeUser>("/me/");
        setUser(me);
      } catch {
        setTokens(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const data = await apiJson<{ access: string; refresh: string; user: MeUser }>(
      "/auth/login/",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setTokens({ access: data.access, refresh: data.refresh });
    setUser(data.user);
  }

  function logout() {
    setTokens(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
