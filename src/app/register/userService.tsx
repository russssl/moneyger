'use server';
import { insertUser} from '@/server/queries/users';
import { type SelectUser, type InsertUser } from '@/server/db/user';

export async function save(user: InsertUser): Promise<SelectUser | undefined | null> {
  'use server';
  const createdUser = await insertUser({
    name: user.name,
    surname: user.surname,
    email: user.email,
    password: user.password
  })
  return Array.isArray(createdUser) ? createdUser[0] : null;
}