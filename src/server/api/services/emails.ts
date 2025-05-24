import db from "@/server/db";
import { ResetPasswordEmailTemplate } from "../../../components/email-template";
import { and, eq, gt } from "drizzle-orm";
import { user } from "@/server/db/user";
import { passwordReset } from "@/server/db/passwordReset";
import { Resend } from "resend";
import { DateTime } from "luxon";

export async function sendResetPasswordEmail(
  email: string,
  token: string,
  firstName: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const userToReset = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!userToReset) {
    throw new Error("User not found");
  }

  const existingResetCode = await db.query.passwordReset.findFirst({
    where: and(
      eq(passwordReset.userId, userToReset.id),
      gt(passwordReset.expiresAt, DateTime.now().minus({ minutes: 30 }).toJSDate())
    ),
  });

  if (existingResetCode) {
    return existingResetCode;
  }

  // delete all previous reset codes for the user
  await db.delete(passwordReset).where(eq(passwordReset.userId, userToReset.id));

  const resetCode = await db.insert(passwordReset).values({
    userId: userToReset.id,
    token: Math.random().toString(36).substring(2, 10),
    expiresAt: DateTime.now().plus({ minutes: 30 }).toJSDate(),
  }).returning({
    id: passwordReset.id,
    userId: passwordReset.userId,
    token: passwordReset.token,
    expiresAt: passwordReset.expiresAt,
  }).execute();

  if (!resetCode || resetCode.length === 0) {
    throw new Error("Failed to create reset password code");
  }

  const resetPasswordCode = resetCode[0];

  if (!resetPasswordCode) {
    throw new Error("Failed to create reset password code");
  }
  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password",
      react: ResetPasswordEmailTemplate({
        firstName,
        code: resetPasswordCode.token,
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