
import { Badge } from "@/client/components/ui/badge"

function getEnvironment(): string {
  if (typeof window !== "undefined" && "ENV" in window) {
    return (window as any).ENV?.PUBLIC_ENVIRONMENT || "development"
  }
  try {
    return String(process.env.PUBLIC_ENVIRONMENT || "development")
  } catch {
    return "development"
  }
}

export function EnvironmentBadge() {
  const environment = getEnvironment()

  if (environment === "production") {
    return null
  }

  const isStaging = environment === "staging" || environment.startsWith("staging-")
  const isDev = environment === "development"

  const badgeText = isStaging ? environment : isDev ? "DEV" : environment

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
