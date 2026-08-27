import { createAuthClient } from "better-auth/react"
import { lastLoginMethodClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  baseURL: "",
  plugins: [lastLoginMethodClient(), passkeyClient(), twoFactorClient({
    onTwoFactorRedirect() {
      // handled manually in login flow via twoFactorRedirect response; no auto redirect
    },
  })],
})

export type AuthSession = typeof authClient.$Infer.Session
