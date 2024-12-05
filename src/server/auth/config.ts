import { type DefaultSession, type NextAuthConfig, CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "./util";

import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/user";
import { eq } from "drizzle-orm";

export class NoPasswordError extends CredentialsSignin {
  code = "no-password";
}

export class SignInError extends CredentialsSignin {
  code = "invalid-credentials";
}
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      surname?: string | null;
      currency?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  interface User {
    surname?: string | null;
    currency?: string;
  }
}

export const authConfig = {
  providers: [
    DiscordProvider,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials.email || !credentials.password) {
          return null;
        }
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) {
          return null;
        }
  
        if (user.password === null) {
          throw new SignInError({
            code: "no-password",
          });
        }

        // const userSettingsData = await db.query.userSettings.findFirst({
        //   where: eq(userSettings.userId, user.id),
        // });

        // if (!userSettings) {
        //   throw new Error('User settings not found');
        // }

        if (await verifyPassword(credentials.password as string, user.password)) {
          return {
            ...user,
            // currency: userSettingsData?.currency ?? undefined,
          };
        } else {
          throw new SignInError({
            code: "invalid-credentials",
          });
        }
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({session, token}) => {
      if (token?.email && token?.name && token?.sub) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.surname = token.surname as string | null | undefined;
        session.user.currency = token.currency as string | undefined;
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.surname = user.surname;
        token.currency = user.currency;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 24 * 60 * 60, // 15 days
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
