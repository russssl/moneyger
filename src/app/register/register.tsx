"use server"

import { api } from "@/trpc/server";


export async function save({ name, surname, email, password }: { name: string, surname: string, email: string, password: string }, currency: string) {
  "use server";
  const res = await api.user.createUser({
    name,
    surname,
    email,
    password,
  });

  if (res) {
    await api.user.createUserSettings({
      userId: res.id,
      currency,
    });
  }
  return res;
}