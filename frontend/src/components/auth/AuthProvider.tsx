"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { createContext, useContext } from "react";

interface AuthContextType {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    orgId: string;
    emailVerified: boolean;
  } | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

function AuthInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user
    ? {
        id: (session.user as Record<string, unknown>).id as string || "",
        name: session.user.name || "",
        email: session.user.email || "",
        role: (session.user as Record<string, unknown>).role as string || "VIEWER",
        orgId: (session.user as Record<string, unknown>).orgId as string || "",
        emailVerified: !!(session.user as Record<string, unknown>).emailVerified,
      }
    : null;

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthInner>{children}</AuthInner>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
