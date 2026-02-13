"use client"

import { Badge } from "@/components/ui/badge"
import { env } from "@/env"

export function EnvironmentBadge() {
  const environment = env.NEXT_PUBLIC_ENVIRONMENT

  // Only show badge for non-production environments
  if (environment === "production") {
    return null
  }

  const envStr = String(environment)
  const isStaging = envStr === "staging" || envStr.startsWith("staging-")
  const isDev = environment === "development"

  const badgeText = isStaging ? envStr : isDev ? "DEV" : envStr

  return (
    <Badge
      variant="outline"
      className={
        isStaging
          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
          : isDev
            ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
            : ""
      }
    >
      {badgeText}
    </Badge>
  )
}

