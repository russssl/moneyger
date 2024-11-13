'use client';
import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';

import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './ui/loading';
import { redirect } from 'next/navigation';
type ClientSafeProvider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

function getErrorMessage(error: string) {
  console.log(error);
  switch (error) {
  case 'invalid-credentials':
    return 'Invalid email or password';
  case 'no-password':
    return 'No password set';
  default:
    return 'An error occurred';
  }
}
export default function SignInProviders() {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [credentialsProvider, setCredentialsProvider] = useState<ClientSafeProvider | null>(null);
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      // if (result.code == 'no-password') {
      //   setError('No password set');
      // } else if({
      //   setError('Invalid email or password');
      // }
      setError(getErrorMessage(result.error));
    } else {
      redirect('/');
    }
  }
  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await getProviders();
        if (res) {
          const credentialsProvider = Object.values(res).find((provider: ClientSafeProvider) => provider.id === 'credentials') ?? null;
          setCredentialsProvider(credentialsProvider);
          setProviders(Object.fromEntries(Object.entries(res).filter(([_, provider]) => provider.id !== 'credentials')));
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    }
    void fetchProviders();
  }, []);
  
  if (!providers || !credentialsProvider) {
    return (
      <div className='flex justify-center font-bold text-pretty align-middle'>
        <div className='me-2'>
          Loading
        </div>
        <div>
          <LoadingSpinner />
        </div>
      </div>
    ) 
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {credentialsProvider && (
          <div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="email"
                placeholder="Username"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive" className='mt-3'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button key={credentialsProvider.name} onClick={() => handleSubmit} className='w-full mt-5'>
              Sign in
            </Button>
            <div className='text-center mt-3'>
              <a href="/password-reset" className="text-blue-500">
              Forgot password?
              </a>
            </div>
          </div>
        )}
      </form>
        
      {Object.keys(providers).length > 0 && (
        <div>
          <div className='flex justify-center items-center mt-3'>
            <div className='border-t border-gray-300 flex-grow mr-3'></div>
            <span className='text-gray-500'>or</span>
            <div className='border-t border-gray-300 flex-grow ml-3'></div>
          </div>
          <div className='mt-5'>
            {Object.values(providers).map((provider: ClientSafeProvider) => (
              <Button key={provider.name} onClick={() => signIn(provider.id)} className='w-full mb-3'>
              Sign in with {provider.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}