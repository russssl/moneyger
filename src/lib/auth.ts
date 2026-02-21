import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { sendResetPasswordEmail } from "@/server/api/services/emails";
import { env } from "@/env";
import { haveIBeenPwned, username, lastLoginMethod } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  experimental: {
    joins: true, // fewer DB round-trips on 50+ endpoints (re-run CLI generate/migrate if needed)
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min – reduces DB hits for getSession/useSession
    },
  },
  plugins: [haveIBeenPwned(), lastLoginMethod(), passkey({
    rpID: process.env.NODE_ENV === "production" ? new URL(env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname : "localhost",
    rpName: "Moneyger",
    origin: process.env.NODE_ENV === "production" ? new URL(env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin : "http://localhost:3000",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
  }), username({
    usernameValidator: (username) => {
      return username !== "admin" && username !== "demo";
    }
  })],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    }
  },
  trustedOrigins: [
    process.env.NODE_ENV === "production" ? new URL(env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").origin : "http://localhost:3000",
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
  emailAndPassword: {
    enabled: true,
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
