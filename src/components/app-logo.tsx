"use client"
import { useSidebar } from "./ui/sidebar"
import { useRouter } from "next/navigation"
export default function AppLogo() {
  const { state } = useSidebar()
  const router = useRouter()
  const goHome = () => {
    router.push("/")
  }
  return (
    <div className="flex items-center justify-center">
      <div className="text-2xl font-bold text-blue-600 tracking-wide cursor-pointer" onClick={goHome}>
        {state === "collapsed" ? "MG" : "Moneyger"}
      </div>
    </div>
  )
}