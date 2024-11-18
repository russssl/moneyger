'use client'
import { useState } from 'react'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
})

export default function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // Here you would typically call your password reset API
    // For demonstration, we'll just simulate an API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">Reset password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div  className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Email" />
              {/* <FieldErrorAlert  */}
            </div>
            <div className='mt-4'>
              <Button className="w-full" type="submit">Reset Password</Button>
            </div>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground mt-4">
                <Link href="/login" className="text-blue-500">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}