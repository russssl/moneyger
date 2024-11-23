'use client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Check, Eye, EyeOff, X  } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import Link from 'next/link'
import { useState, useMemo } from 'react';
import { save } from './userService';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import LoadingButton from '@/components/loading-button';
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

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);

  const toggleVisibility = (isConfirmationField?: boolean) => isConfirmationField ? setIsConfirmVisible((prev) => !prev) : setIsVisible((prev) => !prev);

  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });


  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: 'At least 8 characters' },
      { regex: /[0-9]/, text: 'At least 1 number' },
      { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
      { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };


  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-border';
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score === 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return 'Enter a password';
    if (score <= 2) return 'Weak password';
    if (score === 3) return 'Medium password';
    return 'Strong password';
  };

  const strength = checkStrength(password);

  const strengthScore = useMemo(() => {
    return strength.filter((req) => req.met).length;
  }, [strength]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({
      name: '',
      surname: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setIsSubmitting(true)
    try {
      const newUser = await save({name, surname, email, password});
      if (newUser == null) {
        setError('An error occurred. Please try again.');
        return;
      }

      // this shit does not work since password here is hashed
      const res = await signIn('credentials', {
        email: newUser.email,
        password: newUser.password,
        redirect: false,
      });

      if (!res) {
        setError('An error occurred');
        return;
      }

      if (res.error) {
        setError('An error occurred');
        return;
      }

      if (res.ok) {
        router.push('/');        
      }
    } catch (error: unknown) {
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">Register</CardTitle>
          <CardDescription>Create a new account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          {
            error &&
            <Alert variant="destructive" className='mb-2'>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          }

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
            <div className="relative">
              <Input
                id="input-51"
                className="pe-9"
                placeholder="Password"
                type={isVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={strengthScore < 4}
                aria-describedby="password-strength"
              />
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={() => toggleVisibility()}
                aria-label={isVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isVisible}
                aria-controls="password"
              >
                {isVisible ? (
                  <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Eye size={16} strokeWidth={2} aria-hidden="true" />
                )}
              </button>
              <FieldErrorAlert fieldErrors={fieldErrors} name="password" />
            </div>
            <div className="relative">
              <Input
                id="input-51"
                className="pe-9"
                placeholder="Confirm Password"
                type={isConfirmVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={() => toggleVisibility(true)}
                aria-label={isConfirmVisible ? 'Hide password confirmation' : 'Show password confirmation'}
                aria-pressed={isConfirmVisible}
              >
                {isConfirmVisible ? (
                  <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Eye size={16} strokeWidth={2} aria-hidden="true" />
                )}
              </button>
              
            </div>
            <div
              className="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={strengthScore}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label="Password strength"
            >
              <div
                className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
                style={{ width: `${(strengthScore / 4) * 100}%` }}
              ></div>
            </div>
            <p id="password-strength" className="mb-2 text-sm font-medium text-foreground">
              {getStrengthText(strengthScore)}. Must contain:
            </p>

            <ul className="space-y-1.5" aria-label="Password requirements">
              {strength.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <Check size={16} className="text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X size={16} className="text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {req.text}
                    <span className="sr-only">
                      {req.met ? ' - Requirement met' : ' - Requirement not met'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <LoadingButton loading={isSubmitting} className="w-full">
              Register
            </LoadingButton>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
          Already have an account?
            <Link href="/login" className="text-blue-500 ml-2">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}