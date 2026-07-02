import { authClient, type AuthSession } from "./auth-client"
import type { ReactNode } from "react"

export type { AuthSession as Session }

export type SocialProvider = {
  provider: "github" | "google";
  name: string;
  icon: ReactNode;
}

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  getSession,
  requestPasswordReset,
  resetPassword,
  updateUser,
  getLastUsedLoginMethod,
  passkey,
} = authClient

export { useAuth } from "./use-auth"
