import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "@/lib/auth"
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
import { join, extname } from "path"

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
})

// CORS
app.use("*", cors({
  origin: process.env.NODE_ENV === "production"
    ? (env.PUBLIC_APP_URL || "http://localhost:3000")
    : ["http://localhost:5173", "http://localhost:3000"],
  allowHeaders: ["Content-Type", "Authorization", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  maxAge: 600,
  credentials: true,
}))

// Attack detection
app.use("*", async (c, next) => {
  const underAttack = await isUnderAttack()
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

// Healthcheck
app.get("/api/healthcheck", createRateLimiter("public"), (c) => {
  return c.json({ status: "ok" })
})

// Auth handler with rate limiting
app.on(["GET", "POST"], "/api/auth/*", rateLimit({
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

// Serve static files in production
const distDir = join(process.cwd(), "dist")
const indexHtml = join(distDir, "index.html")

// SPA fallback - serve index.html for all non-API, non-auth routes
app.get("*", async (c) => {
  const path = new URL(c.req.url).pathname

  // Skip API and auth routes
  if (path.startsWith("/api/") || path.startsWith("/auth/")) {
    return c.notFound()
  }

  try {
    const filePath = join(distDir, path === "/" ? "index.html" : path)
    const ext = extname(filePath)

    // If it has a file extension, try to serve the static file
    if (ext) {
      const data = readFileSync(filePath)
      const contentType = getContentType(ext)
      return c.body(data, 200, { "Content-Type": contentType })
    }

    // Otherwise serve index.html for SPA routing
    const html = readFileSync(indexHtml, "utf-8")
    return c.html(html)
  } catch {
    // Fallback to index.html for SPA
    try {
      const html = readFileSync(indexHtml, "utf-8")
      return c.html(html)
    } catch {
      return c.notFound()
    }
  }
})

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
  }
  return map[ext] ?? "application/octet-stream"
}

app.onError((err, c) => {
  console.error(err)
  if (err instanceof HTTPException) {
    return c.json({ message: err.message || "Something went wrong. Please try again." }, err.status)
  }
  return c.json({ message: "Something went wrong. Please try again." }, 500)
})

app.notFound((c) => c.json({ message: "The requested resource could not be found." }, 404))

const port = Number(env.PORT) || 3000

console.log(`Server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
