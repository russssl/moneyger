import { type ReactNode } from "react"
import { EnvironmentBadge } from "@/components/layout/environment-badge"

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-hidden">
      <div className="fixed top-2 right-2 z-50 md:top-4 md:right-4">
        <EnvironmentBadge />
      </div>
      {children}
    </div>
  )
}
