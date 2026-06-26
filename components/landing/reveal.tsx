"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

const EASE = [0.21, 0.47, 0.32, 0.98] as const

/**
 * Reveal — a single element that fades + slides into view on scroll.
 * Mirrors the home page's "subtle on-scroll" content motion so every page
 * shares the same feel.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
}

/**
 * RevealGroup — staggers the reveal of its RevealItem children, reproducing
 * the staggered card entrance used in the home page feature grid.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.12,
  once = true,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={revealItemVariants}>
      {children}
    </motion.div>
  )
}
