import { useQuery } from "@tanstack/react-query"
import { authClient } from "./auth-client"

export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: session } = await authClient.getSession()
      return session ?? null
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })

  return {
    data,
    user: data?.user ?? null,
    session: data?.session ?? null,
    isAuthenticated: !!data,
    isLoading,
    isPending: isLoading,
    error,
    refetch,
  }
}
