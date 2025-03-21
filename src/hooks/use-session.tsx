import { type BetterFetchError, createAuthClient } from "better-auth/react";
import { type createAuthClient as createServerAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

const { useSession, signIn, signOut, signUp } = createAuthClient({
  plugins: [inferAdditionalFields({
    user: {
      username: {
        type: "string",
        required: true,
        unique: true,
        input: true,
      },
      surname: {
        type: "string",
        required: true,
        input: true,
      }
    }
  })],
});

export type Session = ReturnType<typeof createServerAuthClient>["$Infer"]["Session"];

export const useAuthSession = (): { data: Session | null, isPending: boolean, error: BetterFetchError | null } => {
  return useSession();
};

export { signIn, signOut, signUp };

//FIXME: better-auth, figure out not to use createAuthClient twice
