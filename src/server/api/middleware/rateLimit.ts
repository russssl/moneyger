import { type MiddlewareHandler } from "hono";
import { type AuthVariables } from "../authenticate";
import { redis, isRedisAvailable } from "@/server/api/cache/cache";
import { HTTPException } from "hono/http-exception";
import { createHash } from "crypto";
import { recordRateLimitViolation, isUnderAttack } from "./attackDetection";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (c: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  onLimitReached?: (identifier: string, path: string) => void; // Callback when limit is reached
  skipIfRedisUnavailable?: boolean; // Allow requests if Redis is unavailable (fail open)
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until retry
  requestTimestamp?: number; // Timestamp of the added request (for removal if needed)
}

// Default rate limit configurations - TIGHTENED SECURITY
export const RATE_LIMITS = {
  // Very strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // 3 requests per 15 minutes (reduced from 5)
  },
  // Stricter limits for authenticated endpoints
  authenticated: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute (reduced from 60)
  },
  // Stricter limits for public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 requests per minute (reduced from 100)
  },
  // Very strict limits for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 requests per hour (reduced from 10)
  },
} as const;

/**
 * Get client identifier for rate limiting
 * Uses user ID if authenticated, otherwise IP address
 */
function getClientIdentifier(c: any): string {
  try {
    const user = c.get("user");
    if (user?.id) {
      return `user:${user.id}`;
    }
  } catch {
    // User not available, fall through to IP
  }
  
  // Get IP address from headers
  const forwarded = c.req.header("x-forwarded-for");
  const realIp = c.req.header("x-real-ip");
  const cfConnectingIp = c.req.header("cf-connecting-ip"); // Cloudflare
  const ip = forwarded?.split(",")[0]?.trim() || 
             realIp || 
             cfConnectingIp || 
             "unknown";
  
  // Sanitize IP to prevent key injection
  const sanitizedIp = ip.replace(/[^a-fA-F0-9.:]/g, "");
  
  return `ip:${sanitizedIp}`;
}

/**
 * Generate Redis key for rate limiting
 * Limits key length to prevent Redis issues
 */
function generateKey(identifier: string, path: string, method: string): string {
  const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const key = `ratelimit:${identifier}:${method}:${normalizedPath}`;
  
  // Redis key length limit is 512MB, but we'll limit to 250 chars for safety
  if (key.length > 250) {
    // Use a hash of the path if it's too long
    const pathHash = createHash("sha256").update(normalizedPath).digest("hex").substring(0, 16);
    return `ratelimit:${identifier}:${method}:${pathHash}`;
  }
  
  return key;
}

/**
 * Sliding window rate limiting using Redis
 * Uses individual Redis commands (no scripts)
 */
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
    // Remove old entries outside the window
    await client.zRemRangeByScore(key, 0, windowStart);

    // Count current requests in the window
    const count = await client.zCard(key);

    if (count >= maxRequests) {
      // Get the oldest request timestamp to calculate retry after
      const oldest = await client.zRange(key, 0, 0);
      const oldestTimestamp = oldest.length > 0 
        ? parseInt(oldest[0] as string) 
        : now;
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return {
        limit: maxRequests,
        remaining: 0,
        reset: Math.ceil((oldestTimestamp + windowMs) / 1000),
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Add current request
    await client.zAdd(key, [
      {
        score: now,
        value: requestId,
      },
    ]);

    // Set expiration for the key (window + 1 minute buffer)
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

/**
 * Rate limiting middleware factory
 */
export function rateLimit(config: RateLimitConfig): MiddlewareHandler<AuthVariables> {
  return async (c, next) => {
    // Validate config
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

    // Try to check rate limit (will connect to Redis if needed)
    // We'll catch errors below if Redis is truly unavailable


    let requestTimestamp: number | undefined;
    let shouldRemoveRequest = false;

    try {
      const result = await checkRateLimit(
        key,
        config.windowMs,
        config.maxRequests
      );

      requestTimestamp = result.requestTimestamp;

      // Set rate limit headers
      c.header("X-RateLimit-Limit", result.limit.toString());
      c.header("X-RateLimit-Remaining", Math.max(0, result.remaining).toString());
      c.header("X-RateLimit-Reset", result.reset.toString());

      // Check if we're at or over the limit (remaining should be >= 0 if allowed)
      // If retryAfter is set, it means we hit the limit
      if (result.retryAfter !== undefined && result.retryAfter > 0) {
        if (result.retryAfter) {
          c.header("Retry-After", result.retryAfter.toString());
        }

        // Record violation for attack detection
        await recordRateLimitViolation(identifier).catch(() => {
          // Silently fail - don't break rate limiting if attack detection fails
        });

        // Callback for monitoring
        if (config.onLimitReached) {
          config.onLimitReached(identifier, path);
        }

        // Log rate limit violation
        console.warn(`Rate limit exceeded: ${identifier} on ${method} ${path}`);

        throw new HTTPException(429, {
          message: `Rate limit exceeded. Please try again in ${result.retryAfter || 1} seconds.`,
        });
      }

      // Execute the handler
      await next();

      // Check if we should skip counting successful requests
      if (config.skipSuccessfulRequests && c.res.status >= 200 && c.res.status < 300) {
        shouldRemoveRequest = true;
      }
    } catch (error) {
      // Handle Redis connection errors
      if (error instanceof Error && (
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Redis")
      )) {
        // Redis is unavailable
        if (config.skipIfRedisUnavailable) {
          // Fail open: allow the request if Redis is unavailable
          console.warn(`[RateLimit] Redis unavailable, skipping rate limit check for ${path}`);
          await next();
          return;
        } else {
          // Fail closed: reject requests if Redis is unavailable
          throw new HTTPException(503, {
            message: "Rate limiting service is temporarily unavailable. Please try again later.",
          });
        }
      }

      // Check if we should skip counting failed requests
      if (config.skipFailedRequests && error instanceof HTTPException && error.status !== 429) {
        shouldRemoveRequest = true;
      }

      // Re-throw rate limit errors
      if (error instanceof HTTPException && error.status === 429) {
        throw error;
      }

      // For other errors, if skipFailedRequests is enabled, remove the request
      if (shouldRemoveRequest && requestTimestamp) {
        try {
          const client = await redis();
          await client.zRem(key, requestTimestamp.toString());
        } catch (redisError) {
          // Log but don't fail the request if we can't remove from Redis
          console.error("Failed to remove request from rate limit:", redisError);
        }
      }

      throw error;
    } finally {
      // Remove request if needed (for successful requests)
      if (shouldRemoveRequest && requestTimestamp) {
        try {
          const client = await redis();
          await client.zRem(key, requestTimestamp.toString());
        } catch (redisError) {
          // Log but don't fail the request if we can't remove from Redis
          console.error("Failed to remove request from rate limit:", redisError);
        }
      }
    }
  };
}

/**
 * Convenience function for common rate limit configurations
 */
export function createRateLimiter(
  preset: keyof typeof RATE_LIMITS,
  options?: Partial<RateLimitConfig>
) {
  return rateLimit({
    ...RATE_LIMITS[preset],
    // Default to fail-open for non-auth endpoints (allow requests if Redis is down)
    skipIfRedisUnavailable: preset !== "auth",
    ...options,
  });
}

