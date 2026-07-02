
import { createFileRoute, Navigate } from "@tanstack/react-router"
import RegisterForm from "@/components/auth/register-form"
import { PublicLayout } from "@/client/components/public-layout"
import { useAuth } from "@/hooks/use-auth"

export const Route = createFileRoute("/register")({
  component: RegisterPage,
})

function RegisterPage() {
  const { data: session, isLoading: isPending } = useAuth()

  if (isPending) return null
  if (session) return <Navigate to="/transactions" />

  return (
    <PublicLayout>
      <RegisterForm />
    </PublicLayout>
  )
}
