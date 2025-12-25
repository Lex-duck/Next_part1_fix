"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "owner" | "staff" | string;
  avatarUrl?: string | null;
  canViewFinance: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  company?: { id: string; name: string } | null;
};

const Ctx = createContext<{ user: SessionUser | null; refresh: () => Promise<void> }>({
  user: null,
  refresh: async () => {}
});

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/me");
    const j = await res.json();
    setUser(j.user || null);
  };

  useEffect(() => { refresh(); }, []);

  return <Ctx.Provider value={{ user, refresh }}>{children}</Ctx.Provider>;
}
