import { RouterProvider, createRouter } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { I18nextProvider } from "react-i18next"
import { ThemeProvider } from "@/components/common/theme-provider"
import { PostHogProvider } from "./providers"
import i18n from "@/i18n/client"
import { routeTree } from "./routeTree.gen"

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PostHogProvider>
            <RouterProvider router={router} />
          </PostHogProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}
