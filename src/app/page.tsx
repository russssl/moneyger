import { auth } from '@/server/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect('/signin');
  }
  return (
    <>
      {session ? (
        <div>
          <h1>Welcome {session.user.name}</h1>
          <div>
            If you want to sign out,{'\n'}
            <Link href="/auth/signout">
              Sign out
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <h1>Sign in</h1>
          <p>
            You are not signed in.{' '}
            <Link href="/signin">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
