import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="mb-8 flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="Light Alumni Association" width={80} height={80} className="object-contain" />
        <span className="font-serif text-2xl font-semibold">Light Alumni</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="font-serif text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in. The authentication code may have expired or been already used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            <p>Please try signing in again.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
