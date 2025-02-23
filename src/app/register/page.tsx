import { type Metadata } from "next";
import RegisterForm from "./register-form";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for a new account",
};

export default async function Component() {
  const loggedInUser = await auth();

  if (loggedInUser) {
    // redirect to home page
    redirect("/");
  }
  return (
    <RegisterForm />
  )
}