'use server';
import { insertUser} from '@/server/queries/users';
import { type SelectUser, type InsertUser } from '@/server/db/schema';

export async function save(user: InsertUser): Promise<Array<SelectUser | null>> {
  'use server';
  const createdUser = await insertUser({
    name: user.name,
    surname: user.surname,
    email: user.email,
    password: user.password
  })
  return createdUser;
}