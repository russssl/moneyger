'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function PasswordResetForm() {
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