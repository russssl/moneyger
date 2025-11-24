"use client"
import { useSidebar } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
export default function AppLogo() {
  const { state } = useSidebar()
  const router = useRouter()
  const t = useTranslations("settings")
  const goHome = () => {
    router.push("/")
  }
  return (
    <div className="flex items-center justify-center">
      <div className="text-2xl font-bold text-blue-600 tracking-wide cursor-pointer" onClick={goHome}>
        {state === "collapsed" ? t("app_name_short") : t("app_name")}
      </div>
    </div>
  )
}