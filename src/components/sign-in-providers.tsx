'use client';
import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';

import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
type ClientSafeProvider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

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

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      redirectTo: '/',
    })
    if (res?.ok) {
      setError('')
    } else {
      setError('Invalid credentials')
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
  
  if (!providers) {
    return (
      <div>
        Loading...
      </div>
    ) 
  }

  return (
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
            <Button key={credentialsProvider.name} onClick={() => handleSubmit} className='w-full mt-5'>
              Sign in
            </Button>
          </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {Object.values(providers).map((provider: ClientSafeProvider) => (
            <Button key={provider.name} onClick={() => signIn(provider.id)} className='w-full'>
              Sign in with {provider.name}
            </Button>
          ))}
        </form>
  );
}