"use client"

import { Reveal } from "@/components/landing/reveal"
import { EditableText } from "@/components/cms/editable-text"

/**
 * SectionHeading — the shared eyebrow + title + subtitle block used at the top
 * of every page section, with the home page's reveal-on-scroll motion. When
 * `onChange` handlers are supplied the title/subtitle become inline-editable
 * for admins.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  onTitleChange,
  onSubtitleChange,
  onEyebrowChange,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  align?: "center" | "left"
  onTitleChange?: (v: string) => void
  onSubtitleChange?: (v: string) => void
  onEyebrowChange?: (v: string) => void
}) {
  const alignment = align === "center" ? "mx-auto text-center items-center" : "text-left items-start"
  return (
    <Reveal className={`mb-12 flex max-w-3xl flex-col gap-4 md:mb-16 ${alignment}`}>
      {eyebrow && (
        <EditableText
          as="span"
          value={eyebrow}
          onChange={onEyebrowChange}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm"
        />
      )}
      <EditableText
        as="h2"
        value={title}
        onChange={onTitleChange}
        className="font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
      />
      {subtitle !== undefined && (
        <EditableText
          as="p"
          multiline
          value={subtitle}
          onChange={onSubtitleChange}
          className="text-lg font-light leading-relaxed tracking-wide text-white/75 md:text-xl"
        />
      )}
    </Reveal>
  )
}
