import { useQuery, useMutation as useTanstackMutation } from "@tanstack/react-query"
import { getSession } from "./use-session"


export async function fetchWithToken(
  url: string,
  options: RequestInit & { query?: Record<string, any>; body?: string } = {}
) {
  const session = await getSession();
  const headers = new Headers(options.headers);
  const reqOptions = options as RequestInit & { query?: Record<string, any>; body?: string };
  if (session.data?.session.token) {
    headers.set("Authorization", `Bearer ${session.data.session.token}`);
  }

  // Handle query parameters
  let finalUrl = url;
  if (reqOptions.query && typeof reqOptions.query === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(reqOptions.query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    if (Array.from(params).length > 0) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + params.toString();
    }
  }

  // Handle body
  const body = reqOptions.body;
  if (reqOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  return await fetch(finalUrl, {
    method: options.method || "GET",
    headers,
    body,
  });
}

export function useFetch<T>(
  url: string, 
) {
  const { data, isLoading, error, refetch } = useQuery<T>({
    queryKey: [url],
    queryFn: async () => {
      const response = await fetchWithToken(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<T>
    },
  })

  return { 
    data, 
    isLoading, 
    error,
    refetch 
  }
}

export function useMutation<TInput, TResponse = TInput>(url: string) {
  const { mutate, mutateAsync, isPending, error } = useTanstackMutation({
    mutationFn: async (data: TInput) => {
      const response = await fetchWithToken(url, {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json() as Promise<TResponse>
    },
  });

  return { mutate, mutateAsync, isPending, error };
}