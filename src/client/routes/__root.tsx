import { createRootRoute, Outlet } from "@tanstack/react-router"
import { Toaster } from "@/components/ui/sonner"
import { AttackModeBanner } from "@/components/layout/attack-mode-banner"
import { EnvironmentBadge } from "@/components/layout/environment-badge"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <AttackModeBanner />
      <Toaster richColors invert closeButton />
      <Outlet />
    </>
  )
}
