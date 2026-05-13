import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="mb-8 flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Light Alumni Association" width={80} height={80} className="object-contain" />
        <span className="font-serif text-2xl font-semibold">Light Alumni</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link. Please check your email to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            <p>Click the link in the email to verify your account.</p>
            <p className="mt-2">If you don&apos;t see the email, check your spam folder.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Back to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
