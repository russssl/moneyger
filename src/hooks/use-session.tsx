import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

const { useSession, signIn, signOut, signUp, getSession } = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export type Session = ReturnType<typeof createAuthClient>["$Infer"]["Session"] & { user: { surname: string}}; // workaround for missing user.surname

export const useAuthSession = (): { data: Session | null; isPending: boolean; error: Error | null } => {
  return useSession();
};

export { signIn, signOut, signUp, getSession };
