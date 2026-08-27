import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "@/server/lib/auth"
import { type AuthVariables } from "@/server/api/authenticate"
import userRouter from "@/server/api/routers/userRouter"
import walletsRouter from "@/server/api/routers/walletsRouter"
import transactionsRouter from "@/server/api/routers/transactionsRouter"
import categoriesRouter from "@/server/api/routers/categoriesRouter"
import statsRouter from "@/server/api/routers/statsRouter"
import savingsRouter from "@/server/api/routers/savingsRouter"
import { HTTPException } from "hono/http-exception"
import { rateLimit, createRateLimiter, RATE_LIMITS } from "@/server/api/middleware/rateLimit"
import { isUnderAttack } from "@/server/api/middleware/attackDetection"
import { env } from "@/env"
import { readFileSync } from "fs"
import { join } from "path"

const app = new Hono<AuthVariables>()

// Security headers
app.use("*", async (c, next) => {
  await next()
  c.header("X-DNS-Prefetch-Control", "on")
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  c.header("X-Frame-Options", "SAMEORIGIN")
  c.header("X-Content-Type-Options", "nosniff")
  c.header("X-XSS-Protection", "1; mode=block")
  c.header("Referrer-Policy", "strict-origin-when-cross-origin")
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  c.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'")
})

// CORS
app.use("*", cors({
  origin: process.env.NODE_ENV === "production"
    ? (env.PUBLIC_APP_URL || "http://localhost:3000")
    : (origin) => {
      if (!origin) return "http://localhost:3000";
      try {
        const url = new URL(origin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
      } catch {}
      return "http://localhost:3000";
    },
  allowHeaders: ["Content-Type", "Authorization", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  maxAge: 600,
  credentials: true,
}))

// Attack detection - per-IP block (not global)
app.use("*", async (c, next) => {
  const forwarded = c.req.header("x-forwarded-for")
  const realIp = c.req.header("x-real-ip")
  const cfConnectingIp = c.req.header("cf-connecting-ip")
  const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown"
  const identifier = `ip:${ip.replace(/[^a-fA-F0-9.:]/g, "")}`
  const underAttack = await isUnderAttack(identifier)
  if (underAttack) {
    const path = new URL(c.req.url).pathname
    if (path === "/api/healthcheck") {
      return c.json({
        status: "unavailable",
        message: "App is not available now due to active attack. Please try again later.",
      }, 503)
    }
    return c.json({
      message: "App is not available now due to active attack. Please try again later.",
      error: "SERVICE_UNAVAILABLE",
    }, 503)
  }
  await next()
})

function getOidcConfig() {
  const isHttps = (url?: string) => {
    try {
      return !!url && new URL(url).protocol === "https:"
    } catch {
      return false
    }
  }
  const isDev = env.NODE_ENV !== "production"
  const enabled = !!env.OIDC_DISCOVERY_URL && !!env.OIDC_CLIENT_ID && !!env.OIDC_CLIENT_SECRET && (isDev || isHttps(env.OIDC_DISCOVERY_URL))
  const name =
    env.OIDC_NAME && env.OIDC_NAME !== "OIDC"
      ? env.OIDC_NAME
      : (() => {
        const raw = env.OIDC_ISSUER || env.OIDC_DISCOVERY_URL
        if (raw)
          try {
            return new URL(raw).hostname
          } catch {}
        return "OIDC"
      })()
  return { enabled, name, providerId: "oidc" as const }
}
function injectOidcConfig(html: string) {
  const json = JSON.stringify(getOidcConfig()).replace(/</g, "\\u003c")
  const script = `<script id="oidc-config">window.__OIDC_CONFIG__=${json}</script>`
  return html.includes("</head>") ? html.replace("</head>", `${script}</head>`) : script + html
}

// OIDC config for login UI
app.get("/api/oidc-config", (c) => c.json(getOidcConfig()))

// Auth config for client UI (email verification requirement)
app.get("/api/auth-config", (c) => {
  return c.json({
    requiresEmailConfirmation: env.REQUIRES_EMAIL_CONFIRMATION,
  })
})

// Healthcheck
app.get("/api/healthcheck", createRateLimiter("public"), (c) => {
  return c.json({ status: "ok" })
})

// Revoke session cooldown — prevent attacker who just logged in from immediately revoking legitimate sessions
const REVOKE_MIN_AGE_MS = 5 * 60 * 1000
app.use("/api/auth/*", async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (c.req.method !== "POST" || !path.startsWith("/api/auth/revoke")) return next()
  try {
    const sessionData = await auth.api.getSession({ headers: c.req.raw.headers })
    const session = (sessionData as unknown as { session?: { createdAt?: string | Date } } | null)?.session
    if (session?.createdAt) {
      const age = Date.now() - new Date(session.createdAt).getTime()
      if (age < REVOKE_MIN_AGE_MS) {
        const waitSec = Math.ceil((REVOKE_MIN_AGE_MS - age) / 1000)
        return c.json(
          { message: `For security, please wait ${Math.ceil(waitSec / 60)} minute(s) after sign-in before revoking sessions.`, code: "REVOKE_COOLDOWN" },
          403
        )
      }
    }
  } catch {
    // if we can't determine session, let auth handler decide (e.g. 401)
  }
  await next()
})

// Auth handler with rate limiting
app.on(["GET", "POST", "PUT", "DELETE"], "/api/auth/*", rateLimit({
  ...RATE_LIMITS.auth,
  keyGenerator: (c) => {
    const forwarded = c.req.header("x-forwarded-for")
    const realIp = c.req.header("x-real-ip")
    const cfConnectingIp = c.req.header("cf-connecting-ip")
    const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown"
    return `auth:ip:${ip}`
  },
  skipIfRedisUnavailable: false,
  onLimitReached: (identifier, path) => {
    console.warn(`Auth rate limit exceeded: ${identifier} on ${path}`)
  },
}), (c) => {
  return auth.handler(c.req.raw)
})

// Apply authenticated rate limiting to API routes
app.use("/api/stats/*", createRateLimiter("authenticated"))
app.use("/api/user/*", createRateLimiter("authenticated"))
app.use("/api/wallets/*", createRateLimiter("authenticated"))
app.use("/api/transactions/*", createRateLimiter("authenticated"))
app.use("/api/savings/*", createRateLimiter("authenticated"))
app.use("/api/categories/*", createRateLimiter("authenticated"))

// Mount API routes
app.route("/api/stats", statsRouter)
app.route("/api/user", userRouter)
app.route("/api/wallets", walletsRouter)
app.route("/api/transactions", transactionsRouter)
app.route("/api/savings", savingsRouter)
app.route("/api/categories", categoriesRouter)

// Serve static assets in production
const distDir = join(process.cwd(), "dist")
const indexHtmlPath = join(distDir, "index.html")
let cachedIndexHtml: string | null = null
try {
  const raw = readFileSync(indexHtmlPath, "utf-8")
  cachedIndexHtml = injectOidcConfig(raw)
} catch {
  // dist not built yet (dev mode) — will be read lazily
}

app.use("/assets/*", serveStatic({ root: distDir }))
app.use("/favicon.ico", serveStatic({ root: distDir }))
app.use("/favicon.svg", serveStatic({ root: distDir }))
app.use("/icons/*", serveStatic({ root: distDir }))

// SPA fallback - serve index.html for all non-API, non-auth routes
app.get("*", async (c) => {
  const path = new URL(c.req.url).pathname

  if (path.startsWith("/api/") || path.startsWith("/auth/")) {
    return c.notFound()
  }

  try {
    if (cachedIndexHtml) return c.html(cachedIndexHtml)
    const raw = readFileSync(indexHtmlPath, "utf-8")
    const html = injectOidcConfig(raw)
    cachedIndexHtml = html
    return c.html(html)
  } catch {
    return c.notFound()
  }
})

app.onError((err, c) => {
  console.error(err)
  if (err instanceof HTTPException) {
    return c.json({ message: err.message || "Something went wrong. Please try again." }, err.status)
  }
  return c.json({ message: "Something went wrong. Please try again." }, 500)
})

app.notFound((c) => c.json({ message: "The requested resource could not be found." }, 404))

const port = Number(env.PORT)

console.log(`Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
