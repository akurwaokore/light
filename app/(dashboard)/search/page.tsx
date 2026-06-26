"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search as SearchIcon, Briefcase, ShoppingBag, FileText, Users } from "lucide-react"

export default function SearchPage() {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<any>({ people: [], posts: [], jobs: [], products: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ people: [], posts: [], jobs: [], products: [] })
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const counts = {
    people: results.people?.length || 0,
    jobs: results.jobs?.length || 0,
    products: results.products?.length || 0,
    posts: results.posts?.length || 0,
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold">Search</h1>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search people, jobs, marketplace, posts…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </div>

      {q.trim().length < 2 ? (
        <p className="text-muted-foreground">Type at least 2 characters to search.</p>
      ) : loading ? (
        <p className="text-muted-foreground">Searching…</p>
      ) : (
        <Tabs defaultValue="people">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="people"><Users className="mr-1 h-4 w-4" /> People ({counts.people})</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="mr-1 h-4 w-4" /> Jobs ({counts.jobs})</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="mr-1 h-4 w-4" /> Market ({counts.products})</TabsTrigger>
            <TabsTrigger value="posts"><FileText className="mr-1 h-4 w-4" /> Posts ({counts.posts})</TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-2 pt-4">
            {results.people.map((p: any) => (
              <Link key={p.id} href={`/members/${p.id}`}>
                <Card className="hover:shadow-md"><CardContent className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={p.photo_url || undefined} /><AvatarFallback>{p.display_name?.[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0"><p className="font-medium truncate">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[p.job_title, p.company].filter(Boolean).join(" · ")}</p></div>
                </CardContent></Card>
              </Link>
            ))}
            {counts.people === 0 && <p className="text-muted-foreground">No people found.</p>}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-2 pt-4">
            {results.jobs.map((j: any) => (
              <Link key={j.id} href={`/careers`}>
                <Card className="hover:shadow-md"><CardContent className="p-3">
                  <p className="font-medium">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{[j.company, j.location, j.employment_type].filter(Boolean).join(" · ")}</p>
                </CardContent></Card>
              </Link>
            ))}
            {counts.jobs === 0 && <p className="text-muted-foreground">No jobs found.</p>}
          </TabsContent>

          <TabsContent value="products" className="space-y-2 pt-4">
            {results.products.map((p: any) => (
              <Link key={p.id} href={`/marketplace`}>
                <Card className="hover:shadow-md"><CardContent className="p-3">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.category} · {p.currency || "KES"} {Number(p.price).toLocaleString()}</p>
                </CardContent></Card>
              </Link>
            ))}
            {counts.products === 0 && <p className="text-muted-foreground">No listings found.</p>}
          </TabsContent>

          <TabsContent value="posts" className="space-y-2 pt-4">
            {results.posts.map((p: any) => (
              <Link key={p.id} href={`/feed`}>
                <Card className="hover:shadow-md"><CardContent className="p-3">
                  <p className="line-clamp-2 text-sm">{p.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.author?.display_name} · {new Date(p.created_at).toLocaleDateString()}</p>
                </CardContent></Card>
              </Link>
            ))}
            {counts.posts === 0 && <p className="text-muted-foreground">No posts found.</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
