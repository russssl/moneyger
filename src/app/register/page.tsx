import { type Metadata } from "next";
import RegisterForm from "./register-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for a new account",
};

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