
import { createFileRoute, useLocation } from "@tanstack/react-router"
import ResetPasswordForm from "@/components/auth/reset-password-form"
import { PublicLayout } from "@/client/components/public-layout"

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get("token")

  if (!token) {
    return (
      <PublicLayout>
        <div className="h-screen flex items-center justify-center overflow-hidden">
          Invalid token
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        <ResetPasswordForm token={token} />
      </div>
    </PublicLayout>
  )
}
