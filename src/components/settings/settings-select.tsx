"use client"
import { User, Bell, Palette, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select"
// Settings sections
const settingsSections = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
]

export default function SettingsSelect({ ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Initialize state based on current param or default to 'account'
  const [activeSection, setActiveSection] = useState(searchParams.get("category") || "account")

  useEffect(() => {
    if (!searchParams.has("category")) {
      router.replace("?category=account", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentSection = searchParams.get("category");
    if (currentSection && currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [searchParams, activeSection]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    router.push(`?category=${sectionId}`, { scroll: false });
  };

  return (
    <div className="w-full" {...props}>
      {/* Mobile View - Dropdown */}
      <div className="md:hidden w-full mb-4 mt-2 px-3">
        <Select
          onValueChange={(value) => handleSectionChange(value)}
          value={activeSection ?? undefined}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {settingsSections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop View - Compact Chips */}
      <div className="hidden md:flex flex-wrap gap-2 mb-4">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
              activeSection === section.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
            )}
            onClick={() => handleSectionChange(section.id)}
          >
            <section.icon className="h-3.5 w-3.5" />
            {section.label}
          </button>
        ))}
      </div>
    </div>
  )
}
