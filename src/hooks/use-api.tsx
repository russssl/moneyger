import { useQuery, useMutation as useTanstackMutation } from "@tanstack/react-query"
import { getSession } from "./use-session"
import { useState } from "react";

type ReqOptions = RequestInit & { query?: Record<string, any>; body?: string }
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
        throw new Error(`HTTP error! status: ${response.status}`)
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

export function useMutation<TInput extends { id?: string }, TResponse = TInput>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST"
) {
  const [mutationError, setMutationError] = useState<Error | null>(null);

  const { mutate, mutateAsync, isPending, error } = useTanstackMutation<TResponse, Error, TInput>({
    mutationFn: async (data: TInput) => {
      let finalUrl = url;
      let bodyData: Record<string, unknown> = data as Record<string, unknown>;

      // If data has an id, use it as a path param and remove from body
      if (data && typeof data === "object" && "id" in data && data.id) {
        // Remove trailing slash if present
        finalUrl = finalUrl.replace(/\/$/, "");
        finalUrl = `${finalUrl}/${encodeURIComponent(String(data.id))}`;
        // Remove id from body
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = data;
        bodyData = rest;
      }

      const response = await fetchWithToken(finalUrl, {
        method,
        body: Object.keys(bodyData).length > 0 ? JSON.stringify(bodyData) : undefined,
      });

      if (!response.ok) {
        const errorObj = new Error(`HTTP error! status: ${response.status}`);
        setMutationError(errorObj);
      }
      setMutationError(null);
      return response.json() as Promise<TResponse>;
    },
  });

  return { mutate, mutateAsync, isPending, error: error ?? mutationError };
}