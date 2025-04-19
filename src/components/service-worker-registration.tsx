"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/public/service-worker.js").catch(err => {
          console.error("Service Worker registration failed:", err)
        })
      })
    }
  }, [])

  return null
}