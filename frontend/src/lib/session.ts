import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  emailVerified: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const u = session.user as Record<string, unknown>;
  return {
    id: (u.id as string) || "",
    name: (session.user.name as string) || "",
    email: (session.user.email as string) || "",
    role: (u.role as string) || "VIEWER",
    orgId: (u.orgId as string) || "",
    emailVerified: !!u.emailVerified,
  };
}

const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  FINANCE: 1,
  ADMIN: 2,
};

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError("Unauthorized");
  return user;
}

export async function requireRole(minRole: "VIEWER" | "FINANCE" | "ADMIN"): Promise<SessionUser> {
  const user = await requireAuth();
  const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  if (userLevel < requiredLevel) throw new AuthError("Forbidden");
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.status = message === "Forbidden" ? 403 : 401;
  }
}

export function handleAuthError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}
