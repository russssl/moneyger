import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "dark" | "light" | "system"

export type ColorScheme = "atelier" | "midnight" | "forest" | "rose" | "ocean" | "slate"

export const COLOR_SCHEMES: { id: ColorScheme; label: string; accent: string; bg: string; bgDark: string }[] = [
  { id: "atelier", label: "Atelier", accent: "oklch(65% 0.12 70)", bg: "#faf6f1", bgDark: "#1a1612" },
  { id: "midnight", label: "Midnight", accent: "oklch(55% 0.14 265)", bg: "#f4f5f9", bgDark: "#111320" },
  { id: "forest", label: "Forest", accent: "oklch(50% 0.12 155)", bg: "#f5f8f4", bgDark: "#111a12" },
  { id: "rose", label: "Rose", accent: "oklch(60% 0.12 350)", bg: "#faf4f6", bgDark: "#1a1115" },
  { id: "ocean", label: "Ocean", accent: "oklch(55% 0.10 190)", bg: "#f4f9fb", bgDark: "#0f1a1d" },
  { id: "slate", label: "Slate", accent: "oklch(50% 0.06 250)", bg: "#f6f7f9", bgDark: "#121418" },
]

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

function getColorSchemeStorageKey(storageKey: string) {
  return `${storageKey}:color-scheme`
}

function applyColorScheme(scheme: ColorScheme) {
  const root = document.documentElement
  // atelier is the default (no class) — removing all ensures clean switch back to default
  root.classList.remove("theme-atelier", "theme-midnight", "theme-forest", "theme-rose", "theme-ocean", "theme-slate")
  if (scheme !== "atelier") {
    root.classList.add(`theme-${scheme}`)
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  disableTransitionOnChange = false,
  ..._props
}: ThemeProviderProps) {
  // Use default values for SSR to avoid hydration mismatch; sync from localStorage in useEffect
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("atelier")
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light")

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    if (storedTheme) setThemeState(storedTheme)
    // Support both new namespaced key and legacy "color-scheme" for migration
    const storedScheme =
      (localStorage.getItem(getColorSchemeStorageKey(storageKey)) as ColorScheme | null) ??
      (localStorage.getItem("color-scheme") as ColorScheme | null)
    if (storedScheme) setColorSchemeState(storedScheme)
  }, [storageKey])

  // Track resolved theme (handles system) and listen to system changes
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const compute = () => {
      const r = theme === "system" ? (media.matches ? "dark" : "light") : theme
      setResolvedTheme(r)
    }
    compute()
    if (theme === "system") {
      media.addEventListener("change", compute)
      return () => media.removeEventListener("change", compute)
    }
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const prev = disableTransitionOnChange ? root.classList.contains("no-transition") : false

    if (disableTransitionOnChange) {
      root.classList.add("no-transition")
    }

    root.classList.remove("light", "dark")

    const resolved = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme

    root.classList.add(resolved)

    if (disableTransitionOnChange && !prev) {
      requestAnimationFrame(() => {
        root.classList.remove("no-transition")
      })
    }
  }, [theme, disableTransitionOnChange])

  useEffect(() => {
    const root = document.documentElement
    const prev = disableTransitionOnChange ? root.classList.contains("no-transition") : false

    if (disableTransitionOnChange) {
      root.classList.add("no-transition")
    }

    applyColorScheme(colorScheme)

    if (disableTransitionOnChange && !prev) {
      requestAnimationFrame(() => {
        root.classList.remove("no-transition")
      })
    }
  }, [colorScheme, disableTransitionOnChange])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const setColorScheme = (newScheme: ColorScheme) => {
    localStorage.setItem(getColorSchemeStorageKey(storageKey), newScheme)
    setColorSchemeState(newScheme)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
