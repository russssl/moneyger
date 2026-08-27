import { auth } from "@/server/lib/auth";
import { type MiddlewareHandler, type Env, type Context } from "hono";

export type AuthVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
} & Env;

type UserData = {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
    currency?: string | null | undefined;
  };
  session: typeof auth.$Infer.Session.session;
  query: Record<string, string>;
  headers: Headers;
  method: string;
  url: string;
  params: Record<string, string>;
}
export const authenticated: MiddlewareHandler<AuthVariables> = async (c, next) => {
  const sessionData = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!sessionData) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("user", {
    ...sessionData.user,
    currency: sessionData.user.currency ?? null,
  })
  c.set("session", sessionData.session)
  return next()
}

export async function getUserData(c: Context<AuthVariables>): Promise<UserData> {
  return {
    user: c.get("user"),
    session: c.get("session"),
    query: c.req.query(),
    headers: c.req.raw.headers,
    method: c.req.raw.method,
    url: c.req.raw.url,
    params: c.req.param(),
  }
}