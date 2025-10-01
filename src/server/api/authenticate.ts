import { auth } from "@/lib/auth";
import { type MiddlewareHandler, type Env, type Context } from "hono";
export type AuthVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
    context: typeof auth.$context;
  };
} & Env;

export const authenticated: MiddlewareHandler<AuthVariables> = async (c, next) => {
  const sessionData = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!sessionData) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  c.set("user", sessionData.user)
  c.set("session", sessionData.session)

  return next()
}

export async function getUserData(c: Context<AuthVariables>) {
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