"use client"

import { useEffect } from "react"
import Link from "next/link"

// Segment-level error boundary for the app. Catches render/runtime errors in
// routes so users get a recoverable UI instead of a blank crash page.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[route-error]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        We hit an unexpected error loading this page. Please try again.
      </p>
      {error?.digest && <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full bg-primary px-6 py-2 text-primary-foreground transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border px-6 py-2 transition hover:bg-muted"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
