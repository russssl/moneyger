import { type Metadata } from 'next';
import SignUpForm from './sign-up-form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Sign up for a new account',
};

export default function Component() {
  return (
    <SignUpForm />
  )
}