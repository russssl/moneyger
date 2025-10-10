import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { sendResetPasswordEmail } from "@/server/api/services/emails";
import { env } from "@/env";
import { haveIBeenPwned, username, lastLoginMethod } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [haveIBeenPwned(), lastLoginMethod(), passkey({
    rpID: process.env.NODE_ENV === "production" ? "your-domain.com" : "localhost",
    rpName: "Moneyger",
    origin: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
  }), username({
    usernameValidator: (username) => {
      if (username === "admin") {
        return false;
      }
      return true;
    }
  })],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
    }
  },
  user: {
    additionalFields: {
      currency: {
        type: "string",
        required: false,
        default: null,
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
