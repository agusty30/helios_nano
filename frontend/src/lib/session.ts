import { auth } from "@/lib/auth";

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
