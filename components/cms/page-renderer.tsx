import Image from "next/image"
import Link from "next/link"

// Renders a CMS page-builder tree: sections -> rows -> columns(12-grid) -> blocks.
// Pure/presentational so it works in server components.

const spanClass: Record<number, string> = {
  1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
  5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
  9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
}

function Block({ block }: { block: any }) {
  const c = block.content || {}
  switch (block.type) {
    case "heading":
      return <h2 className="font-serif text-2xl font-bold md:text-3xl" style={{ textAlign: c.align }}>{c.text}</h2>
    case "text":
      return <p className="leading-relaxed text-muted-foreground" style={{ textAlign: c.align }}>{c.text}</p>
    case "image":
      return c.url ? (
        <div className="relative overflow-hidden rounded-lg">
          <Image src={c.url} alt={c.alt || ""} width={c.width || 800} height={c.height || 500} className="h-auto w-full object-cover" unoptimized />
        </div>
      ) : null
    case "button":
      return c.label ? (
        <Link href={c.href || "#"} className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90">
          {c.label}
        </Link>
      ) : null
    case "video":
      return c.url ? (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe src={c.url} className="h-full w-full" allowFullScreen title={c.title || "video"} />
        </div>
      ) : null
    case "card":
      return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {c.title && <h3 className="mb-2 font-semibold">{c.title}</h3>}
          {c.body && <p className="text-sm text-muted-foreground">{c.body}</p>}
        </div>
      )
    case "divider":
      return <hr className="border-border" />
    case "spacer":
      return <div style={{ height: c.height || 32 }} />
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: c.html || "" }} />
    default:
      return null
  }
}

export function CmsPageRenderer({ tree }: { tree: any[] }) {
  if (!tree || tree.length === 0) return null
  return (
    <div className="w-full">
      {tree.filter((s) => s.is_visible !== false).map((section) => {
        const ss = section.settings || {}
        return (
          <section key={section.id} className="w-full" style={{ background: ss.background, padding: ss.padding }}>
            <div className="container mx-auto space-y-8 px-4 py-10 md:py-16">
              {(section.rows || []).map((row: any) => (
                <div key={row.id} className="grid grid-cols-1 gap-6 md:grid-cols-12">
                  {(row.columns || []).map((col: any) => (
                    <div key={col.id} className={`space-y-4 ${spanClass[col.span] || "md:col-span-12"}`}>
                      {(col.blocks || []).map((block: any) => (
                        <Block key={block.id} block={block} />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
