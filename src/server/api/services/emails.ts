import { ResetPasswordEmailTemplate } from "../../../components/email-template";
import { Resend } from "resend";

export async function sendResetPasswordEmail(
  email: string,
  firstName: string,
  url: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password",
      react: ResetPasswordEmailTemplate({
        firstName,
        url,
      }),
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send reset password email");
    }

    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset password email");
  }
}