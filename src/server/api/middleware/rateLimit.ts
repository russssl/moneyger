import { type MiddlewareHandler } from "hono";
import { type AuthVariables } from "../authenticate";
import { redis } from "@/server/api/cache/cache";
import { HTTPException } from "hono/http-exception";
import { createHash } from "crypto";
import { recordRateLimitViolation } from "./attackDetection";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string, path: string) => void;
  skipIfRedisUnavailable?: boolean;
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  requestTimestamp?: number;
}
const isProduction = process.env.NODE_ENV === "production";
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: isProduction ? 30 : 1000, // Lenient in dev so a few register/login attempts don't trigger
  },
  authenticated: {
    windowMs: 60 * 1000,
    maxRequests: isProduction ? 60 : 1000, // Lenient in dev so a few requests don't trigger
  },
  public: {
    windowMs: 60 * 1000,
    maxRequests: isProduction ? 100 : 1000, // Lenient in dev so a few requests don't trigger
  },
  sensitive: {
    windowMs: 60 * 60 * 1000,
    maxRequests: isProduction ? 5 : 1000, // Lenient in dev so a few requests don't trigger
  },
} as const;

function getClientIdentifier(c: any): string {
  try {
    const user = c.get("user");
    if (user?.id) {
      return `user:${user.id}`;
    }
  } catch {
    // User not available, fall through to IP
  }
  
  const forwarded = c.req.header("x-forwarded-for");
  const realIp = c.req.header("x-real-ip");
  const cfConnectingIp = c.req.header("cf-connecting-ip");
  const ip = forwarded?.split(",")[0]?.trim() || 
             realIp || 
             cfConnectingIp || 
             "unknown";
  
  const sanitizedIp = ip.replace(/[^a-fA-F0-9.:]/g, "");
  
  return `ip:${sanitizedIp}`;
}

function generateKey(identifier: string, path: string, method: string): string {
  const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const key = `ratelimit:${identifier}:${method}:${normalizedPath}`;
  
  if (key.length > 250) {
    const pathHash = createHash("sha256").update(normalizedPath).digest("hex").substring(0, 16);
    return `ratelimit:${identifier}:${method}:${pathHash}`;
  }
  
  return key;
}

export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const client = await redis();
  const now = Date.now();
  const windowStart = now - windowMs;
  const requestId = `${now}-${Math.random().toString(36).substring(7)}`;

  try {
    await client.zRemRangeByScore(key, 0, windowStart);
    const count = await client.zCard(key);

    if (count >= maxRequests) {
      const oldest = await client.zRange(key, 0, 0);
      const oldestTimestamp = oldest.length > 0 
        ? parseInt(oldest[0]!) 
        : now;
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return {
        limit: maxRequests,
        remaining: 0,
        reset: Math.ceil((oldestTimestamp + windowMs) / 1000),
        retryAfter: Math.max(1, retryAfter),
      };
    }

    await client.zAdd(key, [
      {
        score: now,
        value: requestId,
      },
    ]);
    await client.expire(key, Math.ceil((windowMs + 60000) / 1000));

    return {
      limit: maxRequests,
      remaining: maxRequests - count - 1,
      reset: Math.ceil((now + windowMs) / 1000),
      requestTimestamp: now,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    throw error;
  }
}

export function rateLimit(config: RateLimitConfig): MiddlewareHandler<AuthVariables> {
  return async (c, next) => {
    if (config.windowMs <= 0 || config.maxRequests <= 0) {
      console.error("Invalid rate limit configuration");
      await next();
      return;
    }

    const identifier = config.keyGenerator
      ? config.keyGenerator(c)
      : getClientIdentifier(c);

    const path = new URL(c.req.url).pathname;
    const method = c.req.method;
    const key = generateKey(identifier, path, method);

    let requestTimestamp: number | undefined;
    let shouldRemoveRequest = false;

    try {
      const result = await checkRateLimit(
        key,
        config.windowMs,
        config.maxRequests
      );

      requestTimestamp = result.requestTimestamp;

      c.header("X-RateLimit-Limit", result.limit.toString());
      c.header("X-RateLimit-Remaining", Math.max(0, result.remaining).toString());
      c.header("X-RateLimit-Reset", result.reset.toString());

      if (result.retryAfter !== undefined && result.retryAfter > 0) {
        if (result.retryAfter) {
          c.header("Retry-After", result.retryAfter.toString());
        }

        void recordRateLimitViolation(identifier);

        if (config.onLimitReached) {
          config.onLimitReached(identifier, path);
        }

        console.warn(`Rate limit exceeded: ${identifier} on ${method} ${path}`);

        throw new HTTPException(429, {
          message: `Rate limit exceeded. Please try again in ${result.retryAfter || 1} seconds.`,
        });
      }

      await next();

      if (config.skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 300) {
        shouldRemoveRequest = true;
      }
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Redis")
      )) {
        if (config.skipIfRedisUnavailable) {
          console.warn(`[RateLimit] Redis unavailable, skipping rate limit check for ${path}`);
          await next();
          return;
        } else {
          throw new HTTPException(503, {
            message: "Rate limiting service is temporarily unavailable. Please try again later.",
          });
        }
      }

      if (config.skipFailedRequests && error instanceof HTTPException && error.status !== 429) {
        shouldRemoveRequest = true;
      }

      if (error instanceof HTTPException && error.status === 429) {
        throw error;
      }

      if (shouldRemoveRequest && requestTimestamp) {
        try {
          const client = await redis();
          await client.zRem(key, requestTimestamp.toString());
        } catch (redisError) {
          console.error("Failed to remove request from rate limit:", redisError);
        }
      }

      throw error;
    } finally {
      if (shouldRemoveRequest && requestTimestamp) {
        try {
          const client = await redis();
          await client.zRem(key, requestTimestamp.toString());
        } catch (redisError) {
          console.error("Failed to remove request from rate limit:", redisError);
        }
      }
    }
  };
}

export function createRateLimiter(
  preset: keyof typeof RATE_LIMITS,
  options?: Partial<RateLimitConfig>
) {
  return rateLimit({
    ...RATE_LIMITS[preset],
    skipIfRedisUnavailable: preset !== "auth",
    ...options,
  });
}