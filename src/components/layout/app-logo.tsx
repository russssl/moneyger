import { useSidebar } from "@/components/ui/sidebar"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
export default function AppLogo() {
  const { state } = useSidebar()
  const navigate = useNavigate()
  const { t } = useTranslation("settings")
  const goHome = () => {
    navigate({ to: "/" })
  }
  return (
    <div className="flex items-center justify-center">
      <div className="text-2xl font-bold text-blue-600 tracking-wide cursor-pointer" onClick={goHome}>
        {state === "collapsed" ? t("app_name_short") : t("app_name")}
      </div>
    </div>
  )
}