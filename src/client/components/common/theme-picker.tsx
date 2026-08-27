import { useTheme, COLOR_SCHEMES } from "@/client/components/common/theme-provider"
import { cn } from "@/client/lib/utils"

function ThemePreview({ scheme, isDark }: { scheme: typeof COLOR_SCHEMES[number]; isDark: boolean }) {
  const bg = isDark ? scheme.bgDark : scheme.bg
  return (
    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-black/5 flex flex-col">
      {/* Header bar */}
      <div
        className="h-6 flex items-center gap-1 px-2 pt-0.5"
        style={{ backgroundColor: bg }}
      >
        <div className="h-1.5 w-1.5 rounded-full opacity-40" style={{ backgroundColor: scheme.accent }} />
        <div className="h-1 w-8 rounded-full bg-current opacity-10" />
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-1.5 p-2" style={{ backgroundColor: bg }}>
        {/* Mini sidebar */}
        <div className="w-3 rounded-sm flex flex-col gap-1 pt-1" style={{ backgroundColor: scheme.accent, opacity: 0.12 }}>
          <div className="h-1 mx-auto w-2 rounded-full bg-current opacity-60" />
          <div className="h-1 mx-auto w-2 rounded-full bg-current opacity-30" />
          <div className="h-1 mx-auto w-2 rounded-full bg-current opacity-30" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Title line */}
          <div className="h-1.5 w-2/3 rounded-full bg-current opacity-[0.10]" />

          {/* Mini card */}
          <div className="rounded-md p-1.5" style={{ backgroundColor: scheme.accent, opacity: 0.08 }}>
            <div className="h-1 w-full rounded-full bg-current opacity-40" />
            <div className="h-1 w-3/4 rounded-full bg-current opacity-25 mt-1" />
          </div>

          {/* List rows */}
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: scheme.accent, opacity: 0.5 }} />
            <div className="h-1 flex-1 rounded-full bg-current opacity-[0.07]" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-[0.10]" />
            <div className="h-1 flex-1 rounded-full bg-current opacity-[0.07]" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-[0.10]" />
            <div className="h-1 w-2/3 rounded-full bg-current opacity-[0.07]" />
          </div>

          {/* Accent button */}
          <div className="mt-auto flex justify-end">
            <div
              className="h-1.5 w-7 rounded-full"
              style={{ backgroundColor: scheme.accent }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ThemePicker() {
  const { colorScheme, setColorScheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="grid grid-cols-3 gap-3">
      {COLOR_SCHEMES.map((scheme) => (
        <button
          key={scheme.id}
          type="button"
          onClick={() => setColorScheme(scheme.id)}
          aria-pressed={colorScheme === scheme.id}
          aria-label={`Select ${scheme.label} color scheme`}
          className="group flex flex-col items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          {/* Preview card */}
          <div
            className={cn(
              "w-full rounded-xl p-1 transition-all duration-200",
              colorScheme === scheme.id
                ? "ring-2 ring-foreground shadow-sm"
                : "ring-1 ring-border hover:ring-foreground/30"
            )}
          >
            <div className="rounded-lg overflow-hidden">
              <ThemePreview scheme={scheme} isDark={isDark} />
            </div>
          </div>

          {/* Label */}
          <span
            className={cn(
              "text-xs font-medium transition-colors",
              colorScheme === scheme.id ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {scheme.label}
          </span>
        </button>
      ))}
    </div>
  )
}
