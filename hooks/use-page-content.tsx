"use client"

import { useCallback, useEffect, useState } from "react"

/** Deep-merge stored CMS content over the page defaults so newly added default
 *  fields still appear even if a section was saved before they existed. */
function deepMerge<T>(base: T, override: any): T {
  if (Array.isArray(override)) return override as T
  if (override && typeof override === "object" && base && typeof base === "object" && !Array.isArray(base)) {
    const out: any = { ...base }
    for (const key of Object.keys(override)) {
      out[key] = deepMerge((base as any)[key], override[key])
    }
    return out
  }
  return (override === undefined ? base : override) as T
}

/** Immutably set a deep value by dot/array path, e.g. setPath(obj, "gallery.items.0.image_url", url). */
function setPath(obj: any, path: string, value: any): any {
  const keys = path.split(".")
  const root = Array.isArray(obj) ? [...obj] : { ...obj }
  let cursor = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const existing = cursor[k]
    cursor[k] = Array.isArray(existing) ? [...existing] : { ...(existing ?? {}) }
    cursor = cursor[k]
  }
  cursor[keys[keys.length - 1]] = value
  return root
}

/**
 * usePageContent — loads the editable content for a public page from the
 * `page:<slug>` row of cms_sections, merged over local defaults so the page
 * renders instantly. Admins can persist edits via `update` (single field) or
 * `save` (whole object). Persistence hits PATCH /api/cms/sections which is
 * admin-gated server-side, so non-admins simply get a 403 and the UI stays
 * optimistic only for admins.
 */
export function usePageContent<T extends Record<string, any>>(slug: string, defaults: T) {
  const sectionName = `page:${slug}`
  const [content, setContent] = useState<T>(defaults)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/cms/sections?name=${encodeURIComponent(sectionName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((row) => {
        if (active && row?.content) setContent((prev) => deepMerge(prev, row.content))
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [sectionName])

  const persist = useCallback(
    (next: T) => {
      fetch(`/api/cms/sections?name=${encodeURIComponent(sectionName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: next }),
      }).catch(() => {})
    },
    [sectionName],
  )

  const update = useCallback(
    (path: string, value: any) => {
      setContent((prev) => {
        const next = setPath(prev, path, value)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const save = useCallback(
    (next: T) => {
      setContent(next)
      persist(next)
    },
    [persist],
  )

  return { content, update, save, loaded }
}
