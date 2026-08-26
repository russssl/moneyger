import { User, Palette, Tag } from "lucide-react"
import { cn } from "@/client/lib/utils"
import { useEffect } from "react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/client/components/ui/select"
import { useTranslation } from "react-i18next"

export default function SettingsSelect({ ...props }) {
  const { t } = useTranslation("settings");
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = (location.search as Record<string, string>)?.category || "account";

  const settingsSections = [
    { id: "account", label: t("account"), icon: User },
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "categories", label: t("categories"), icon: Tag },
  ];

  useEffect(() => {
    if (!(location.search as Record<string, string>)?.category) {
      void navigate({ to: location.pathname, search: { category: "account" }, replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSectionChange = (sectionId: string) => {
    void navigate({ to: location.pathname, search: { category: sectionId } });
  };

  return (
    <div className="w-full" {...props}>
      {/* Mobile View - Dropdown */}
      <div className="md:hidden w-full mb-4 mt-2">
        <Select
          onValueChange={(value) => handleSectionChange(value)}
          value={activeSection ?? undefined}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("select_section")} />
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
