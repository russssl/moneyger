"use client"

import { Badge } from "@/components/ui/badge"
import { env } from "@/env"

export function EnvironmentBadge() {
  const environment = env.NEXT_PUBLIC_ENVIRONMENT

  // Only show badge for non-production environments
  if (environment === "production") {
    return null
  }

  const isStaging = environment === "staging"
  const isDev = environment === "development"

  const badgeText = isStaging ? "STAGING" : isDev ? "DEV" : (environment as string).toUpperCase()

  return (
    <Badge
      variant="outline"
      className={
        isStaging
          ? "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-semibold"
          : isDev
            ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
            : ""
      }
    >
      {badgeText}
    </Badge>
  )
}

