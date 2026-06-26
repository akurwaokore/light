"use client"

import { useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ImagePlus, Loader2 } from "lucide-react"

/** Generic, schema-less editor for a page's `page:<slug>` content object.
 *  It recursively renders inputs for strings/numbers/booleans, image-upload
 *  fields for image keys, and add/remove list editors for arrays — so admins
 *  can fully edit any page's generated sections without bespoke forms. */

const humanize = (k: string) =>
  k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const isImageKey = (k: string) => /(^|_)(image|logo|photo|thumbnail|bg_image)(_url)?$/i.test(k) || /image_url$/i.test(k)
const isLongText = (k: string) => /(description|subtitle|body|quote|text)$/i.test(k)

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("path", "cms/page")
  const res = await fetch("/api/cms/upload", { method: "POST", body: fd })
  if (!res.ok) return null
  const data = await res.json()
  return data.url || null
}

function ImageField({ k, value, onChange }: { k: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-xs">
        <ImagePlus className="h-3.5 w-3.5" /> {humanize(k)}
      </Label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded border bg-muted">
          {value ? (
            <Image src={value} alt={k} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">None</div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <Input value={value || ""} placeholder="Image URL" onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
          <Input
            type="file"
            accept="image/*"
            disabled={busy}
            className="h-8 py-1 text-xs"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setBusy(true)
              const url = await uploadFile(file)
              setBusy(false)
              if (url) onChange(url)
            }}
          />
        </div>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}

function ValueEditor({ k, value, onChange }: { k: string; value: any; onChange: (v: any) => void }) {
  if (Array.isArray(value)) {
    return <ArrayEditor k={k} value={value} onChange={onChange} />
  }
  if (value !== null && typeof value === "object") {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{humanize(k)}</p>
        <ObjectEditor value={value} onChange={onChange} />
      </div>
    )
  }
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <Label className="text-xs">{humanize(k)}</Label>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    )
  }
  if (typeof value === "number") {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{humanize(k)}</Label>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 text-xs" />
      </div>
    )
  }
  // string
  if (isImageKey(k)) {
    return <ImageField k={k} value={value ?? ""} onChange={onChange} />
  }
  if (isLongText(k)) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{humanize(k)}</Label>
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="min-h-[60px] text-xs" />
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs">{humanize(k)}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
    </div>
  )
}

function ObjectEditor({ value, onChange }: { value: Record<string, any>; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      {Object.keys(value).map((key) => (
        <ValueEditor
          key={key}
          k={key}
          value={value[key]}
          onChange={(v) => onChange({ ...value, [key]: v })}
        />
      ))}
    </div>
  )
}

function blankLike(template: any): any {
  if (Array.isArray(template)) return []
  if (template && typeof template === "object") {
    return Object.fromEntries(Object.keys(template).map((k) => [k, blankLike(template[k])]))
  }
  if (typeof template === "number") return 0
  if (typeof template === "boolean") return false
  return ""
}

function ArrayEditor({ k, value, onChange }: { k: string; value: any[]; onChange: (v: any[]) => void }) {
  const setItem = (i: number, v: any) => onChange(value.map((it, idx) => (idx === i ? v : it)))
  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const addItem = () => onChange([...value, blankLike(value[value.length - 1] ?? "")])

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{humanize(k)} ({value.length})</p>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addItem}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {value.map((item, i) => (
        <div key={i} className="relative rounded-md border bg-background p-3 pr-9">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7 text-destructive"
            onClick={() => removeItem(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {item !== null && typeof item === "object" ? (
            <ObjectEditor value={item} onChange={(v) => setItem(i, v)} />
          ) : (
            <ValueEditor k={`Item ${i + 1}`} value={item} onChange={(v) => setItem(i, v)} />
          )}
        </div>
      ))}
      {value.length === 0 && <p className="text-xs text-muted-foreground">No items yet.</p>}
    </div>
  )
}

export function PageSectionEditor({ value, onChange }: { value: Record<string, any>; onChange: (v: any) => void }) {
  return <ObjectEditor value={value} onChange={onChange} />
}
