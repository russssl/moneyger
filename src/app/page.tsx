import { redirect } from "next/navigation";

export default async function Main() {
  redirect("/dashboard");
  return null;
}