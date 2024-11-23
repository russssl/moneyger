import { db } from '../db';
import { type InsertUser, insertUserSchema, users } from '../db/user';
import { eq } from 'drizzle-orm/expressions';
import { hashPassword } from '../auth/util';

export async function insertUser(User: InsertUser) {

  const user = await db.query.users.findFirst({
    where: eq(users.email, User.email),
  });

  if (user) {
    throw new Error('Email is already in use');
  }
  const res = insertUserSchema.safeParse(User);
  if (!res.success) {
    throw new Error(res.error.errors.map((error) => error.message).join(', '));
  }
  const { name, surname, email, password } = User;
  // Proceed with form submission
  if (password == null || password == undefined) {
    throw new Error('Password is required');
  }
  const hashedPassword = await hashPassword(password);
  return await db.insert(users).values({
    name,
    surname,
    email,
    password: hashedPassword,
  }).returning();
};