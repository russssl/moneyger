import { db } from '../db';
import { type InsertUser, insertUserSchema, type SelectUser, users } from '../db/user';
import { userSettings } from '../db/userSettings';
import { eq } from 'drizzle-orm/expressions';
import { hashPassword } from '../auth/util';

export async function createUser(User: InsertUser, currency = 'USD'): Promise<SelectUser> {

  return await db.transaction(async (db) => {
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
    if (password == null || password == undefined) {
      throw new Error('Password is required');
    }
    const hashedPassword = await hashPassword(password);
    const createdUserArr =  await db.insert(users).values({
      name,
      surname,
      email,
      password: hashedPassword,
    }).returning();

    if (!createdUserArr) {
      throw new Error('Error creating user');
    }

    const createdUser = createdUserArr[0];

    if (!createdUser) {
      throw new Error('Error creating user');
    }
    await db.insert(userSettings).values({
      userId: createdUser.id,
      currency: currency,
    });
    return Array.isArray(createdUser) ? createdUser[0] : null;
  });

};