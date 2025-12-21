"use client"

import { Badge } from "@/components/ui/badge"

export function EnvironmentBadge() {
  const nodeEnv = process.env.NEXT_PUBLIC_NODE_ENV || "development"

  // Only show badge for non-production environments
  if (nodeEnv === "production") {
    return null
  }

  const isStaging = nodeEnv === "staging"
  const isDev = nodeEnv === "development"

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
      {isStaging ? "STAGING" : isDev ? "DEV" : nodeEnv.toUpperCase()}
    </Badge>
  )
}

