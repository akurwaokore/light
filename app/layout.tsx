import type React from "react"
import type { Metadata } from "next"
import { Belleza, Alegreya } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner" // Import Toaster for toast notifications
import "./globals.css"

const belleza = Belleza({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-belleza",
})

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
})

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
      <body className={`${belleza.variable} ${alegreya.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
