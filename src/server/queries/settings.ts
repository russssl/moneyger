import { eq } from 'drizzle-orm';
import { db } from '../db';
import { type InsertUserSettings, insertUserSettingsSchema, userSettings } from '../db/userSettings';
import { authenticate } from '../services/userService';

export async function getSettings(userId: string) {
  const authenticatedUser = await authenticate();
  if (!authenticatedUser) {
    throw new Error('Unauthorized');
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })

  if (!settings) {
    throw new Error('Settings not found');
  }
  if (settings.userId !== authenticatedUser.id) {
    throw new Error('Unauthorized');
  }

  return settings;
}

export async function updateSettings(userId: string, settings: InsertUserSettings) {
  const authenticatedUser = await authenticate();
  if (!authenticatedUser) {
    throw new Error('Unauthorized');
  }

  const settingsToUpdate = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })

  if (!settingsToUpdate) {
    throw new Error('Settings not found');
  }
  if (settingsToUpdate.userId !== authenticatedUser.id) {
    throw new Error('Unauthorized');
  }

  const res = insertUserSettingsSchema.safeParse(settings);
  if (!res.success) {
    throw new Error(res.error.errors.map((error) => error.message).join(', '));
  }

  await db.update(userSettings).set(settings).where(eq(userSettings.userId, userId));
}