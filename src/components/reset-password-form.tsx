"use client"

import { useReducer } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Mail, Lock } from "lucide-react"
import { ErrorAlert } from "@/components/error-alert"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { forgetPassword } from "@/hooks/use-session"
import { api } from "@/trpc/react"
import LoadingButton from "./loading-button"

export default function PasswordReset() {
  // const checkCodeMutation = api.user.checkCode.useMutation<boolean>()
  type Step = "email" | "code" | "password" | "success"

  type State = {
    step: Step
    email: string
    otp: string
    error: string | null
  }

  type Action =
    | { type: "SET_STEP"; payload: Step }
    | { type: "SET_EMAIL"; payload: string }
    | { type: "SET_OTP"; payload: string }
    | { type: "SET_ERROR"; payload: string | null }

  const initialState: State = {
    step: "email",
    email: "",
    otp: "",
    error: null
  }

  function reducer(state: State, action: Action): State {
    switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload }
    case "SET_EMAIL":
      return { ...state, email: action.payload }
    case "SET_OTP":
      return { ...state, otp: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    default:
      return state
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)
  const handleOtpComplete = (value: string) => {
    dispatch({ type: "SET_OTP", payload: value })
  }

  const checkCodeQuery = api.user.checkCode.useQuery({
    email: state.email,
    code: state.otp,
  }, {
    enabled: false,
    retry: false
  })

  const checkCode = async () => {
    try {
      const result = await checkCodeQuery.refetch();
      console.log("Verification result:", result)
      if (result.data === true) {
        dispatch({ type: "SET_STEP", payload: "password" })
      } else {
        dispatch({ type: "SET_ERROR", payload: "Invalid verification code" })
      }
    } catch (error) {
      console.error("Error checking verification code:", error)
      dispatch({ type: "SET_ERROR", payload: "Error verifying code. Please try again." })
    }
  }

  const sendResetPasswordEmail = async () => {
    try {
      await forgetPassword({ email: state.email })
      dispatch({ type: "SET_EMAIL", payload: state.email })
      dispatch({ type: "SET_STEP", payload: "code" })
    } catch (error) {
      console.error("Error sending reset password email:", error)
    }

  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {state.step === "email" && "Reset your password"}
            {state.step === "code" && "Enter verification code"}
            {state.step === "password" && "Create new password"}
            {state.step === "success" && "Password reset successful"}
          </CardTitle>
          <ErrorAlert error={state.error} />
          <CardDescription>
            {state.step === "email" && "Enter your email to receive a verification code"}
            {state.step === "code" && "Enter the 6-digit code sent to your email"}
            {state.step === "password" && "Create a new secure password for your account"}
            {state.step === "success" && "Your password has been successfully reset"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.step === "email" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={state.email}
                    onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === "code" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="code">Verification code</Label>
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => dispatch({ type: "SET_STEP", payload: "email" })}>
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to email
                  </Button>
                </div>
                <InputOTP maxLength={8} onComplete={handleOtpComplete}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-sm text-gray-500 mt-2">
                  We sent a code to <span className="font-medium">{state.email}</span>
                </p>
              </div>
              <Button variant="link" className="p-0 h-auto text-sm">
                Didn&apos;t receive a code? Resend
              </Button>
            </div>
          )}

          {state.step === "password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-password">New password</Label>
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => dispatch({ type: "SET_STEP", payload: "code" })}>
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to code
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="new-password" type="password" placeholder="••••••••" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="confirm-password" type="password" placeholder="••••••••" className="pl-10" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Password requirements:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• At least 8 characters</li>
                  <li>• At least one uppercase letter</li>
                  <li>• At least one number</li>
                  <li>• At least one special character</li>
                </ul>
              </div>
            </div>
          )}

          {state.step === "success" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center text-gray-600">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {state.step === "email" && (
            <Button className="w-full" onClick={() => sendResetPasswordEmail()} disabled={!state.email}>
              Send reset code
            </Button>
          )}
          {state.step === "code" && (
            <LoadingButton
              className="w-full"
              onClick={() => checkCode()}
              loading={checkCodeQuery.isLoading}
              disabled={state.otp.length !== 8}
            >
              Verify code
            </LoadingButton>
          )}
          {state.step === "password" && (
            <Button className="w-full" onClick={() => dispatch({ type: "SET_STEP", payload: "success" })}>
              Reset password
            </Button>
          )}
          {state.step === "success" && (
            <Button className="w-full" onClick={() => (window.location.href = "/login")}>
              Return to login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}