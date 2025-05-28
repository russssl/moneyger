import { type Metadata } from "next";
import SendResetPasswordEmailForm from "@/components/send-reset-password-email";
export const metadata: Metadata = {
  title: "Forgot Password",
};

export default async function ForgotPasswordPage() {

  return (
    <SendResetPasswordEmailForm />
  )
}