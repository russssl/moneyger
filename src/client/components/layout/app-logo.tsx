import { useSidebar } from "@/client/components/ui/sidebar"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
export default function AppLogo() {
  const { state } = useSidebar()
  const navigate = useNavigate()
  const { t } = useTranslation("settings")
  const goHome = () => {
    void navigate({ to: "/" })
  }
  return (
    <div className="flex items-center justify-center">
      <div
        className="text-xl font-semibold text-foreground tracking-tight cursor-pointer transition-opacity duration-200 hover:opacity-70"
        onClick={goHome}
      >
        {state === "collapsed" ? t("app_name_short") : t("app_name")}
      </div>
    </div>
  )
}