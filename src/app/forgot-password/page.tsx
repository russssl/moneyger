import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SendResetPasswordEmailForm from "@/components/send-reset-password-email";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register_login");
  return {
    title: t("forgot_password"),
  };
}

export default async function ForgotPasswordPage() {

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
      <SendResetPasswordEmailForm />
    </div>
  )
}