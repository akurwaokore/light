import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner" // Import Toaster for toast notifications
import "./globals.css"

export const metadata: Metadata = {
  title: "Light Alumni Connect",
  description:
    "Connect with fellow alumni from Light Group of Schools. Network, grow, and give back to your community.",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased"
        style={
          {
            "--font-belleza": "Georgia",
            "--font-alegreya": "Palatino Linotype",
          } as React.CSSProperties
        }
      >
        {children}
        <Analytics />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
