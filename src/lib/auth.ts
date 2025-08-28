import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { sendResetPasswordEmail } from "@/server/api/services/emails";
import { env } from "@/env";
import { haveIBeenPwned, username } from "better-auth/plugins"
import { userSettings } from "@/server/db/userSettings";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [haveIBeenPwned(), username({
    usernameValidator: (username) => {
      if (username === "admin") {
        return false;
      }
      return true;
    }
  })],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(userSettings).values({
            userId: user.id,
          });
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
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
