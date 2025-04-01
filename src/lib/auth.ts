import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { createAuthMiddleware } from "better-auth/api";
import { userSettings } from "@/server/db/userSettings";

const userCurrencies = new Map();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
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
      },
    }
  },
  // hooks: {
  //   before: createAuthMiddleware(async (ctx) => {
  //     if (ctx.path.startsWith("/sign-up")) {
  //       const currency = ctx.body.currency;
  //       if (currency) {
  //         // Store currency in map
  //         userCurrencies.set(ctx.body.username, currency);
  //         delete ctx.body.currency; // Remove currency from body
  //       }
  //     }
  //   }),

  //   after: createAuthMiddleware(async (ctx) => {
  //     if (ctx.path.startsWith("/sign-up")) {
  //       const newSession = ctx.context.newSession;
  //       if (!newSession) {
  //         return;
  //       }

  //       const currency = userCurrencies.get(newSession.user.username);

  //       // Check if currency is defined, otherwise throw an error
  //       if (!currency) {
  //         console.error("Currency is missing in afterCreate hook");
  //         throw new Error("Currency is required for userSettings");
  //       } else {
  //         // Remove currency from map
  //         userCurrencies.delete(newSession.user.username);
  //       }

  //       // Create userSettings entry with currency
  //       await db.insert(userSettings).values({
  //         userId: newSession.user.id,
  //         currency: currency, // use currency stored in context
  //       }).execute();

  //       console.log("UserSettings created with currency for user:", newSession.user.id);
  //       ctx.redirect("/"); // Redirect after user settings are created
  //     }
  //   }),
  // },
});
