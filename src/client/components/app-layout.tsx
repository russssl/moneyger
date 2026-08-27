import { type ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/client/components/ui/sidebar"
import { AppSidebar } from "@/client/components/layout/app-sidebar"
import { BottomBar } from "@/client/components/layout/bottom-bar"
import { EnvironmentBadge } from "@/client/components/layout/environment-badge"
import PersistentModals from "@/client/components/common/persistent-modals"
import { useAuth } from "@/client/hooks/use-auth"

export function AppLayout({ children }: { children: ReactNode }) {
  const { data: session } = useAuth()

  return (
    <>
      <div className="fixed top-2 right-2 z-50 md:top-4 md:right-4">
        <EnvironmentBadge />
      </div>
      {session ? (
        <SidebarProvider defaultOpen={true}>
          <AppSidebar session={session} className="hidden md:flex" />
          <SidebarInset>
            <div className="pb-safe-area md:pb-12">{children}</div>
          </SidebarInset>
          <div className="md:hidden fixed bottom-0 left-0 w-full">
            <BottomBar updateList={() => window.location.reload()} />
          </div>
          <PersistentModals />
        </SidebarProvider>
      ) : (
        <div className="pb-safe-area md:pb-12">{children}</div>
      )}
    </>
  )
}
