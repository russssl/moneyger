import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/server/db";
import { createAuthMiddleware } from "better-auth/api";
import { userSettings } from "@/server/db/userSettings";

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
      currency: {
        type: "string",
        required: true,
        input: true,
      },
    }
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // after user is created, send a welcome email
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (!newSession) {
          return;
        }

        const userSetting = db.insert(userSettings).values({
          userId: newSession.user.id,
          currency: ctx.body.currency,
        });

        await userSetting.execute();

        
      }
    })
  }, 
});