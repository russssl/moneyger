import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { sendResetPasswordEmail } from "@/server/api/services/emails";
import { env } from "@/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({user, url, token}, request) => {
      await sendResetPasswordEmail(
        user.email,
        token,
        user.name ?? user.email.split("@")[0]  // Fallback to email prefix if firstName is not available
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
