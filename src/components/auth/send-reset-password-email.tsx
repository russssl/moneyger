"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import LoadingButton from "./loading-button"
import Link from "next/link"
import { useState } from "react"
import { forgetPassword } from "@/hooks/use-session"
import { ErrorAlert } from "@/components/common/error-alert"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export default function SendResetPasswordEmailForm() {
  const t = useTranslations("register_login");
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      // Basic email validation
      if (!email?.includes("@")) {
        setError("Please enter a valid email address")
        return
      }

      setIsLoading(true)
      setError(null) // Clear previous errors
      const { error } = await forgetPassword({
        email,
        redirectTo: "/reset-password",
      })
      if (error) {
        setError(error?.message ?? "An error occurred while sending the reset link")
        return
      }
      toast({
        title: "Reset link sent to your email",
        description: "Please check your email for the reset link",
        variant: "success",
      })
      router.push("/login")
    } catch (error) {
      console.error(error)
      setError("An error occurred while sending the reset link")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorAlert error={error} className="mb-4"/>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault()
            await handleSubmit()
          }}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                <Button variant="link" className="text-sm" asChild>
                  <Link href="/login" className="px-0">
                    <ArrowLeft className="h-4 w-4" />
                    {t("back_to_login")}
                  </Link>
                </Button>
              </div>
              <Input
                id="email"
                type="email"
                placeholder={t("enter_your_email")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <LoadingButton loading={isLoading} className="w-full" type="submit">
              {t("send_reset_link")}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}