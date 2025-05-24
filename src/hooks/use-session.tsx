import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

const { useSession, signIn, signOut, signUp, getSession, forgetPassword } = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export type Session = ReturnType<typeof createAuthClient>["$Infer"]["Session"];
export type Provider = "github" | "google" | "facebook" | "twitter";

export const useAuthSession = (): { data: Session | null; isPending: boolean; error: Error | null } => {
  return useSession();
};

export { signIn, signOut, signUp, getSession, forgetPassword };
