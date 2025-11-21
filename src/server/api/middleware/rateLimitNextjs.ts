import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit as checkRateLimitInternal } from "./rateLimit";
import { recordRateLimitViolation, isUnderAttack } from "./attackDetection";
import { RATE_LIMITS } from "./rateLimit";
import { createHash } from "crypto";

/**
 * Get client identifier from NextRequest
 */
function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown";
  const sanitizedIp = ip.replace(/[^a-fA-F0-9.:]/g, "");
  return `auth:ip:${sanitizedIp}`;
}

/**
 * Generate Redis key for rate limiting
 */
function generateKey(identifier: string, path: string, method: string): string {
  const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const key = `ratelimit:${identifier}:${method}:${normalizedPath}`;
  
  if (key.length > 250) {
    const pathHash = createHash("sha256").update(normalizedPath).digest("hex").substring(0, 16);
    return `ratelimit:${identifier}:${method}:${pathHash}`;
  }
  
  return key;
}

/**
 * Rate limit check for Next.js route handlers
 */
export async function checkRateLimitForNextjs(
  req: NextRequest
): Promise<{ allowed: boolean; response?: NextResponse; headers?: Record<string, string> }> {
  // Check if under attack
  const underAttack = await isUnderAttack();
  if (underAttack) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          message: "App is not available now due to active attack. Please try again later.",
          error: "SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      ),
    };
  }

  const path = new URL(req.url).pathname;
  
  // get-session is called frequently by useSession hook and shouldn't be rate limited as strictly
  // Use more lenient limits for session checks
  if (path.includes("/get-session")) {
    const identifier = getClientIdentifier(req);
    const method = req.method;
    const key = generateKey(identifier, path, method);

    try {
      const result = await checkRateLimitInternal(
        key,
        RATE_LIMITS.authenticated.windowMs,
        RATE_LIMITS.authenticated.maxRequests
      );

      const headers: Record<string, string> = {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": Math.max(0, result.remaining).toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      };

      if (result.retryAfter !== undefined && result.retryAfter > 0) {
        headers["Retry-After"] = result.retryAfter.toString();
        void recordRateLimitViolation(identifier);
        console.warn(`Session rate limit exceeded: ${identifier} on ${method} ${path}`);

        return {
          allowed: false,
          response: NextResponse.json(
            {
              message: `Rate limit exceeded. Please try again in ${result.retryAfter || 1} seconds.`,
            },
            {
              status: 429,
              headers,
            }
          ),
          headers,
        };
      }

      return {
        allowed: true,
        headers,
      };
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Redis")
      )) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              message: "Rate limiting service is temporarily unavailable. Please try again later.",
            },
            { status: 503 }
          ),
        };
      }
      throw error;
    }
  }

  // Strict rate limiting for other auth endpoints (login, signup, etc.)
  const identifier = getClientIdentifier(req);
  const method = req.method;
  const key = generateKey(identifier, path, method);

  try {
    const result = await checkRateLimitInternal(
      key,
      RATE_LIMITS.auth.windowMs,
      RATE_LIMITS.auth.maxRequests
    );

    const headers: Record<string, string> = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": Math.max(0, result.remaining).toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    };

    // Check if rate limited
    if (result.retryAfter !== undefined && result.retryAfter > 0) {
      headers["Retry-After"] = result.retryAfter.toString();

      // Record violation for attack detection
      void recordRateLimitViolation(identifier);

      console.warn(`Auth rate limit exceeded: ${identifier} on ${method} ${path}`);

      return {
        allowed: false,
        response: NextResponse.json(
          {
            message: `Rate limit exceeded. Please try again in ${result.retryAfter || 1} seconds.`,
          },
          {
            status: 429,
            headers,
          }
        ),
        headers,
      };
    }

    return {
      allowed: true,
      headers,
    };
  } catch (error) {
    // If Redis is unavailable, fail closed for auth endpoints
    if (error instanceof Error && (
      error.message.includes("connect") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("Redis")
    )) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            message: "Rate limiting service is temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        ),
      };
    }
    throw error;
  }
}

