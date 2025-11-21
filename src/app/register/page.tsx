import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RegisterForm from "./register-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register_login");
  return {
    title: t("register"),
    description: t("register_modal_description"),
  };
}

export default async function Component() {
  const loggedInUser = await auth.api.getSession({
    headers: await headers(),
  });

  if (loggedInUser) {
    // redirect to home page
    redirect("/");
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center min-h-screen w-full overflow-hidden">
      <RegisterForm />
    </div>
  )
}