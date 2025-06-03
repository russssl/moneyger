import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

const { useSession, signIn, signOut, signUp, getSession, forgetPassword, resetPassword, updateUser } = createAuthClient({
  plugins: [usernameClient()],
});

export type Session = ReturnType<typeof createAuthClient>["$Infer"]["Session"];
export type Provider = "github" | "google";

export const useAuthSession = (): { data: Session | null; isPending: boolean; error: Error | null } => {
  return useSession();
};

export { signIn, signOut, signUp, getSession, forgetPassword, resetPassword, updateUser };
