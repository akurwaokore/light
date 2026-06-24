"use client"

import { useEffect } from "react"

// Catches errors thrown in the root layout / during root rendering. Without
// this, Next.js shows the bare "Application error: a server-side exception has
// occurred" page with only a digest. This renders its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error]", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "10vh auto" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            We hit an unexpected error. Please try again.
          </p>
          {error?.digest && (
            <p style={{ color: "#999", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "9999px",
              border: "none",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
