import { createAuthClient } from "better-auth/react";
import { usernameClient, lastLoginMethodClient } from "better-auth/client/plugins";

const { useSession, signIn, signOut, signUp, getSession, forgetPassword, resetPassword, updateUser, getLastUsedLoginMethod  } = createAuthClient({
  plugins: [usernameClient(), lastLoginMethodClient()],
});

export type Session = ReturnType<typeof createAuthClient>["$Infer"]["Session"];

export type SocialProvider = {
  provider: "github" | "google";
  name: string;
  icon: React.ReactNode;
}

export const useAuthSession = (): { data: Session | null; isPending: boolean; error: Error | null } => {
  return useSession();
};

export { signIn, signOut, signUp, getSession, forgetPassword, resetPassword, updateUser, getLastUsedLoginMethod };
