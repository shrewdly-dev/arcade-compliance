import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";

// Auth types
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

// Server-side auth utilities
export const getServerAuthSession = async () => {
  return await getServerSession(authOptions);
};

export const getUser = async (): Promise<AuthUser | null> => {
  const session = await getServerAuthSession();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name || undefined,
    role: session.user.role,
  };
};

// Client-side utilities (to be used with useSession hook)
export const signOut = async () => {
  const { signOut } = await import("next-auth/react");
  return signOut();
};
