import { createRootRoute, Outlet } from "@tanstack/react-router"
import { Toaster } from "@/client/components/ui/sonner"
import { AttackModeBanner } from "@/client/components/layout/attack-mode-banner"

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
