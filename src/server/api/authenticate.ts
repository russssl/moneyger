import { auth } from "@/lib/auth";
import { type AuthContext } from "better-auth";
import { type MiddlewareHandler, type Env, type Context } from "hono";

export type AuthVariables = { // TODO: do we need this type?
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
    context: AuthContext;
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
    username?: string | null | undefined;
    displayUsername?: string | null | undefined;
  };
  session: typeof auth.$Infer.Session.session;
  context: AuthContext;
  query: any;
  body: any;
  headers: any;
  method: string;
  url: string;
  params: any;
  raw: any;
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
    context: await c.get("context"),
    query: c.req.query(),
    body: c.req.raw.body,
    headers: c.req.raw.headers,
    method: c.req.raw.method,
    url: c.req.raw.url,
    params: c.req.param(),
    raw: c.req.raw,
  }
}