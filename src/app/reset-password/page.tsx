import ResetPasswordForm from "@/components/reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  if (!searchParams.token) {
    return <div>Invalid token</div>
  }


  return (
    <ResetPasswordForm token={searchParams.token} />
  )
}