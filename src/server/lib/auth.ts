import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { sendResetPasswordEmail, sendVerificationEmail } from "@/server/api/services/emails";
import { env } from "@/env";
import { haveIBeenPwned, lastLoginMethod, twoFactor, genericOAuth } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey";

const isHttpsUrl = (url?: string) => {
  try {
    return !!url && new URL(url).protocol === "https:"
  } catch {
    return false
  }
}
const isDev = env.NODE_ENV !== "production"
const oidcConfigs: Parameters<typeof genericOAuth>[0]["config"] = []
if (env.OIDC_DISCOVERY_URL && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET) {
  if (!isDev && !isHttpsUrl(env.OIDC_DISCOVERY_URL)) {
    console.warn("[OIDC] OIDC_DISCOVERY_URL must be https in production — OIDC disabled")
  } else {
    oidcConfigs.push({
      providerId: "oidc",
      clientId: env.OIDC_CLIENT_ID,
      clientSecret: env.OIDC_CLIENT_SECRET,
      discoveryUrl: env.OIDC_DISCOVERY_URL,
      issuer: env.OIDC_ISSUER || undefined,
      scopes: env.OIDC_SCOPES ? env.OIDC_SCOPES.split(",").map((s) => s.trim()) : ["openid", "email", "profile"],
      pkce: true,
    })
  }
}
if (!isDev && !isHttpsUrl(env.PUBLIC_APP_URL)) {
  console.warn("[auth] PUBLIC_APP_URL should be https in production")
}

const requiresEmailConfirmation = env.REQUIRES_EMAIL_CONFIRMATION

if (requiresEmailConfirmation && !env.SMTP_HOST) {
  console.warn("[auth] REQUIRES_EMAIL_CONFIRMATION is enabled but no email provider is configured (SMTP_HOST). Verification emails will fail — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM to allow account activation.")
}

export const auth = betterAuth({
  baseURL: env.PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  experimental: {
    joins: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    haveIBeenPwned(),
    lastLoginMethod(),
    passkey({
      rpID: process.env.NODE_ENV === "production" ? new URL(env.PUBLIC_APP_URL || "http://localhost:3000").hostname : "localhost",
      rpName: "Moneyger",
      origin: process.env.NODE_ENV === "production" ? new URL(env.PUBLIC_APP_URL || "http://localhost:3000").origin : "http://localhost:3000",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
    twoFactor({
      issuer: "Moneyger",
    }),
    ...(oidcConfigs.length > 0 ? [genericOAuth({ config: oidcConfigs })] : []),
  ],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google", ...(oidcConfigs.length > 0 ? ["oidc"] : [])],
    }
  },
  trustedOrigins: [
    process.env.NODE_ENV === "production"
      ? new URL(env.PUBLIC_APP_URL || "http://localhost:3000").origin
      : "http://localhost:3000",
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173", "http://localhost:5174"] : []),
  ],
  user: {
    additionalFields: {
      currency: {
        type: "string",
        required: false,
        defaultValue: "USD",
      }
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(
        user.email,
        user.name ?? user.email.split("@")[0],
        url
      );
    },
    sendOnSignUp: requiresEmailConfirmation,
    sendOnSignIn: requiresEmailConfirmation,
    autoSignInAfterVerification: true,
    expiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN ?? 3600,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: requiresEmailConfirmation,
    sendResetPassword: async ({user, url}) => {
      await sendResetPasswordEmail(
        user.email, 
        user.name ?? user.email.split("@")[0],
        url
      );
    },
  },
  socialProviders: {
    ...(env?.GITHUB_CLIENT_ID && env?.GITHUB_CLIENT_SECRET ? {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    } : {}),
    ...(env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET ? {
      google: { 
        clientId: env.GOOGLE_CLIENT_ID, 
        clientSecret: env.GOOGLE_CLIENT_SECRET, 
      },
    } : {}),
  },
});
