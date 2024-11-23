import { auth } from '../auth';

type User = {
  id: string;
  name?: string | null | undefined;
  surname?: string | null | undefined;
  email?: string | null | undefined;
};

export async function authenticate(): Promise<User> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user;
}