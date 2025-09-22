// app/providers.tsx
"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { type ReactNode, useEffect, memo } from "react"

const POSTHOG_KEY = null; // no posthog for now

function PostHogProviderComponent({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!posthog.__loaded && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        capture_pageview: false,
        capture_pageleave: false,
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        loaded: () => {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "%c[PostHog]%c Loaded successfully",
              "color: #f7a501; font-weight: bold;",
              "color: #00ff00;"
            )
          }
        },
      })
    }
  }, [])

  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

export const PostHogProvider = memo(PostHogProviderComponent)