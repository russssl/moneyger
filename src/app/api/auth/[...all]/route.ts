import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { checkRateLimitForNextjs } from "@/server/api/middleware/rateLimitNextjs";

const authHandler = toNextJsHandler(auth);

async function handleWithRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Check rate limit
    const rateLimitCheck = await checkRateLimitForNextjs(req);
    
    // If rate limited or under attack, return the error response
    if (!rateLimitCheck.allowed && rateLimitCheck.response) {
      return rateLimitCheck.response;
    }

    // Proceed with auth handler
    const response = await handler(req);
    
    // Clone response to add rate limit headers (Response headers are immutable)
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    // Add rate limit headers to the response
    if (rateLimitCheck.headers) {
      Object.entries(rateLimitCheck.headers).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });
    }

    return newResponse;
  } catch (error) {
    console.error("[Auth RateLimit] Error:", error);
    // If rate limiting fails, still allow the request (fail open for now)
    return handler(req);
  }
}

export async function POST(req: NextRequest) {
  return handleWithRateLimit(req, authHandler.POST);
}

export async function GET(req: NextRequest) {
  return handleWithRateLimit(req, authHandler.GET);
}