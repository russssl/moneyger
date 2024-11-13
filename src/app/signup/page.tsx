'use client';
import { type Metadata } from 'next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { insertUserSchema } from '@/server/db/schema';
import Link from 'next/link'
import { useState } from 'react';


function FieldErrorAlert({ fieldErrors, name }: { fieldErrors: Record<string, string>, name: string }) {
  return (
    <>
      {fieldErrors[name] && (
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle size={16} />
          <span>{fieldErrors[name]}</span>
        </div>
      )}
    </>
  );
}
export default function Component() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({
      name: '',
      surname: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    const res = insertUserSchema.safeParse({
      name,
      surname,
      email,
      password
    });

    if (!res.success) {
      const errors = res.error.flatten().fieldErrors;
      setFieldErrors({
        name: errors.name?.[0] ?? '',
        surname: errors.surname?.[0] ?? '',
        email: errors.email?.[0] ?? '',
        password: errors.password?.[0] ?? '',
        confirmPassword: ''
      });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    // Proceed with form submission
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">Register</CardTitle>
          <CardDescription>Create a new account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={register}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input id="name" placeholder='Name' onChange={(e) => setName(e.target.value)}/>
                <FieldErrorAlert fieldErrors={fieldErrors} name="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Surname</Label>
                <Input id="lastName" placeholder='Surname' onChange={(e) => setSurname(e.target.value)}/>
                {fieldErrors.surname && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.surname}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" onChange={(e) => setEmail(e.target.value)}/>
              <FieldErrorAlert fieldErrors={fieldErrors} name="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password"  onChange={(e) => setPassword(e.target.value)}/>
              <FieldErrorAlert fieldErrors={fieldErrors} name="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" onChange={(e) => setConfirmPassword(e.target.value)}/>
              <FieldErrorAlert fieldErrors={fieldErrors} name="confirmPassword" />
            </div>
            <Button type="submit" className="w-full" >
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
          Already have an account?
            <Link href="/signin" className="text-blue-500 ml-2">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}