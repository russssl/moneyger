
import { createFileRoute } from "@tanstack/react-router"
import SendResetPasswordEmailForm from "@/client/components/auth/send-reset-password-email"
import { PublicLayout } from "@/client/components/public-layout"

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <PublicLayout>
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
        <SendResetPasswordEmailForm />
      </div>
    </PublicLayout>
  )
}
