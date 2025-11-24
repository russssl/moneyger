import ResetPasswordForm from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage(
  props: {
    searchParams: Promise<{ token: string }>;
  }
) {
  const searchParams = await props.searchParams;
  if (!searchParams.token) {
    return (
      <div className="h-screen flex items-center justify-center overflow-hidden">
        Invalid token
      </div>
    );
  }

  return (
    <ResetPasswordForm token={searchParams.token} />
  )
}
