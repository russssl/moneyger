import { redirect } from "next/navigation";

export default function Main() {
  redirect("/dashboard");
  return null;
}