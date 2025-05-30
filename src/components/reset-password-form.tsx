"use client"
import { useState } from "react";
import PasswordsInput from "./passwords-input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import LoadingButton from "./loading-button";
import { resetPassword } from "@/hooks/use-session";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {ErrorAlert} from "@/components/error-alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast();
  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      const { error } = await resetPassword({
        newPassword: password,
        token,
      })
      if (error) {
        setError(error?.message ?? "An error occurred while resetting your password")
        return;
      }
      toast({
        title: "Password reset successfully",
        description: "You can now login with your new password",
        variant: "success",
      })
      router.push("/login")
    } catch (error) {
      console.error(error)
      setError("An error occurred while resetting your password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>Reset Password</div>
            <Button variant="link" className="text-sm px-0" asChild>
              <Link href="/login" className="px-0">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorAlert error={error} className="mb-4"/>
          <PasswordsInput setPassword={setPassword} />
          <LoadingButton variant="success" loading={isLoading} className="w-full mt-4" type="submit" onClick={handleSubmit}>
            Reset Password
          </LoadingButton>
        </CardContent>
      </Card>
    </div>
  )
}