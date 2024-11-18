import { type Metadata } from 'next';
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Register for a new account',
};

export default function Component() {
  return (
    <RegisterForm />
  )
}