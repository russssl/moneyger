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

// Verification helpers — via authClient proxy (covers /send-verification-email and /verify-email)
export const sendVerificationEmail = (opts: { email: string; callbackURL?: string }) =>
  (authClient as unknown as { sendVerificationEmail: (opts: { email: string; callbackURL?: string }) => Promise<{ data?: unknown; error?: { message?: string; code?: string } }> }).sendVerificationEmail(opts)

export const verifyEmail = (opts: { query: { token: string; callbackURL?: string } }) =>
  (authClient as unknown as { verifyEmail: (opts: { query: { token: string; callbackURL?: string } }) => Promise<{ data?: unknown; error?: { message?: string; code?: string } }> }).verifyEmail(opts)

export { useAuth } from "./use-auth"
