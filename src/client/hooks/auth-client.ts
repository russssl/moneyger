import { createAuthClient } from "better-auth/react"
import { usernameClient, lastLoginMethodClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  baseURL: "",
  plugins: [usernameClient(), lastLoginMethodClient(), passkeyClient()],
})

export type AuthSession = typeof authClient.$Infer.Session
