'use server';
import { type SelectUser, type InsertUser } from '@/server/db/user';
import { createUser } from '@/server/queries/users';
export async function save(user: InsertUser, currency: string): Promise<SelectUser | undefined | null> {
  'use server';
  return await createUser(user, currency);
}