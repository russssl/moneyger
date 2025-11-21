import { useQuery, useMutation as useTanstackMutation } from "@tanstack/react-query"
import { getSession } from "./use-session"
import { useState } from "react";

type ReqOptions = RequestInit & { query?: Record<string, any>; body?: string }

class APIError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function buildApiError(response: Response) {
  const defaultMessage = "Something went wrong. Please try again."
  let message = defaultMessage
  let details: unknown = null

  try {
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const errorData = await response.json()
      message = errorData?.message || errorData?.error || defaultMessage
      details = errorData
    } else {
      const text = await response.text()
      if (text) {
        message = text
      }
      details = text
    }
  } catch {
    message = defaultMessage
  }

  // If it's a 503 with attack message, dispatch event for attack mode banner
  if (response.status === 503 && typeof message === "string" && message.includes("not available")) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("api-error", {
          detail: { status: 503, message, details },
        })
      )
    }
  }

  return new APIError(message, response.status, details)
}
export async function fetchWithToken(
  url: string,
  options: ReqOptions = {}
) {
  try {
    const session = await getSession();
    const headers = new Headers(options.headers);
    if (session.data?.session.token) {
      headers.set("Authorization", `Bearer ${session.data.session.token}`);
    }

    // Handle query parameters
    let finalUrl = url;
    if (options.query && typeof options.query === "object") {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      if (Array.from(params).length > 0) {
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + params.toString();
      }
    }

    // Handle body
    const body = options.body;
    if (options.body) {
      headers.set("Content-Type", "application/json");
    }

    return await fetch(finalUrl, {
      method: options.method || "GET",
      headers,
      body,
    });
  } catch (error) {
    console.error(error)
    throw error
  }
}

export function useFetch<T>(
  url: string | null, 
) {
  const { data, isLoading, error, refetch } = useQuery<T | null>({
    queryKey: [url],
    queryFn: async () => {
      if (!url) {
        return null;
      }
      const response = await fetchWithToken(url)
      if (!response.ok) {
        throw await buildApiError(response)
      }
      return response.json() as Promise<T | null>
    },
    enabled: !!url,
  })

  return { 
    data, 
    isLoading, 
    error,
    refetch 
  }
}

export function useMutation<TInput = { id?: string } & Record<string, unknown>, TResponse = TInput>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST"
) {
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const { mutate, mutateAsync, isPending, error } = useTanstackMutation<TResponse, Error, TInput>({
    mutationFn: async (data: TInput) => {
      const finalUrl = url;
      const bodyData: TInput = data;

      const response = await fetchWithToken(finalUrl, {
        method,
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const apiError = await buildApiError(response)
        setMutationError(apiError);
        throw apiError;
      }
      setMutationError(null);
      return response.json() as Promise<TResponse>;
    },
  });

  return { mutate, mutateAsync, isPending, error: error ?? mutationError };
}