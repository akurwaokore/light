"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { Sparkles, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface MottoProps {
  variant: "hero" | "sidebar" | "dashboard"
  className?: string
}

export function Motto({ variant, className }: MottoProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (variant === "hero") {
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn("relative py-12 text-center", className)}
      >
        {/* Background ribbon */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <span className="text-sm uppercase tracking-[0.3em] text-white/60">Our Motto</span>
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>

          <h2
            className="font-belleza text-4xl tracking-wide text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-belleza), serif" }}
          >
            <span className="block">Once Students,</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-300 via-white to-blue-300 bg-clip-text text-transparent">
              Always Family
            </span>
          </h2>

          {/* Decorative underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mt-6 h-1 w-32 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-4 flex items-center justify-center gap-1 text-white/50"
          >
            <Heart className="h-4 w-4 fill-current" />
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  if (variant === "sidebar") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn("px-4 py-3 text-center", className)}
      >
        <p
          className="text-sm tracking-wide text-sidebar-foreground/70"
          style={{ fontFamily: "var(--font-belleza), serif" }}
        >
          
          <br />
          
        </p>
      </motion.div>
    )
  }

  if (variant === "dashboard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6",
          className,
        )}
      >
        {/* Subtle glow effect */}
        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <p
            className="text-center text-xl tracking-wide text-foreground md:text-2xl"
            style={{ fontFamily: "var(--font-belleza), serif" }}
          >
            <span className="text-foreground">Once Students, </span>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Always Family
            </span>
          </p>

          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-primary/50 text-primary" />
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}
