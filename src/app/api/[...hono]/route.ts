import { Hono } from "hono"
import { cors } from "hono/cors"
import { type NextRequest } from "next/server"
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
const api = new Hono<AuthVariables>();

// Configure CORS
api.use("*", cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  allowHeaders: ["Content-Type", "Authorization", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
  maxAge: 600,
  credentials: true,
}))

// Check if app is under attack - block all requests if so
api.use("*", async (c, next) => {
  const underAttack = await isUnderAttack();
  
  if (underAttack) {
    // Allow healthcheck to still work for monitoring
    const path = new URL(c.req.url).pathname;
    if (path === "/api/healthcheck") {
      return c.json({ 
        status: "unavailable", 
        message: "App is not available now due to active attack. Please try again later." 
      }, 503);
    }
    
    // Block all other requests
    return c.json({ 
      message: "App is not available now due to active attack. Please try again later.",
      error: "SERVICE_UNAVAILABLE"
    }, 503);
  }
  
  await next();
})

// Healthcheck endpoint - public rate limit
api.get("/api/healthcheck", createRateLimiter("public"), (c) => {
  return c.json({ status: "ok" });
});

// Mount auth handler with strict rate limiting
api.on(["GET", "POST"], "/auth/*", rateLimit({
  ...RATE_LIMITS.auth,
  keyGenerator: (c) => {
    // Use IP for auth endpoints to prevent brute force
    const forwarded = c.req.header("x-forwarded-for");
    const realIp = c.req.header("x-real-ip");
    const cfConnectingIp = c.req.header("cf-connecting-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";
    return `auth:ip:${ip}`;
  },
  skipIfRedisUnavailable: false, // Always enforce auth rate limits
  onLimitReached: (identifier, path) => {
    console.warn(`Auth rate limit exceeded: ${identifier} on ${path}`);
  },
}), (c) => {
  return auth.handler(c.req.raw);
});

// Apply authenticated rate limiting to protected routes
api.use("/api/stats/*", createRateLimiter("authenticated"));
api.use("/api/user/*", createRateLimiter("authenticated"));
api.use("/api/wallets/*", createRateLimiter("authenticated"));
api.use("/api/transactions/*", createRateLimiter("authenticated"));
api.use("/api/savings/*", createRateLimiter("authenticated"));
api.use("/api/categories/*", createRateLimiter("authenticated"));

api.route("/api/stats", statsRouter);
api.route("/api/user", userRouter);
api.route("/api/wallets", walletsRouter);
api.route("/api/transactions", transactionsRouter);
api.route("/api/savings", savingsRouter);
api.route("/api/categories", categoriesRouter);
api.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ message: err.message || "Something went wrong. Please try again." }, err.status);
  }

  return c.json({ message: "Something went wrong. Please try again." }, 500);
});

api.notFound((c) => c.json({ message: "The requested resource could not be found." }, 404));

export async function GET(req: NextRequest) { return api.fetch(req) }
export async function POST(req: NextRequest) { return api.fetch(req) }
export async function PUT(req: NextRequest) { return api.fetch(req) }
export async function DELETE(req: NextRequest) { return api.fetch(req) }
export async function OPTIONS(req: NextRequest) { return api.fetch(req) }