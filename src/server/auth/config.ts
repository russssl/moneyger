import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { CredentialsSignin, type DefaultSession, type NextAuthConfig } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm/expressions';
import { db } from '@/server/db';
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from '@/server/db/schema';
import { verifyPassword } from './util';
// import { verifyPassword } from "./util";

export class NoPasswordError extends CredentialsSignin {
  code = 'no-password';
}
/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    DiscordProvider,
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
        console.log('user exists', user)
        if (user.password === null) {
          throw new NoPasswordError();
        }
        console.log('has password')
        if (await verifyPassword(credentials.password as string, user.password)) {
          return user;
        } else {
          throw new CredentialsSignin({
            message: 'Invalid password',
          });
        }
        return null;
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
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/signin',
  },
} satisfies NextAuthConfig;
