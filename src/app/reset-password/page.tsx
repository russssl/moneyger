import { type Metadata } from "next";
import ResetPasswordForm from "@/components/reset-password-form";
export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
};

export default async function Component() {

  return (
    <ResetPasswordForm />
  )
}