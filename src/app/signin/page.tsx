import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SignInProviders from '@/components/sign-in-providers';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link'
import { type Metadata } from 'next';
import ThemeToggle from '@/components/theme-toggle';
export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
};
export default async function Page() {
  const session = await auth();
  if (session) {
    redirect('/');
  }
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            <div></div>
            Sign in to your account
            <ThemeToggle />
          </CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInProviders />
        </CardContent>
        <CardFooter className="text-sm text-center text-gray-500 flex flex-col space-y-2">
          <div>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
          <div>
            Don’t have an account? 
            <Link href="/signup" className="text-blue-500 ml-2">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
