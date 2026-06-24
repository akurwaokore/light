import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/search?q=...&type=all|people|posts|jobs|products
// People come from the safe `public_profiles` view (no email/phone leakage).
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const raw = request.nextUrl.searchParams.get("q") || ""
    const type = request.nextUrl.searchParams.get("type") || "all"
    // Strip PostgREST filter metacharacters to prevent injection through ilike.
    const q = raw.replace(/[,()*:%\\]/g, " ").trim()
    if (q.length < 2) return NextResponse.json({ people: [], posts: [], jobs: [], products: [] })

    const want = (t: string) => type === "all" || type === t

    const [people, posts, jobs, products] = await Promise.all([
      want("people")
        ? supabase.from("public_profiles").select("id, display_name, photo_url, job_title, company")
            .or(`display_name.ilike.%${q}%,company.ilike.%${q}%,job_title.ilike.%${q}%`).limit(20)
        : Promise.resolve({ data: [] }),
      want("posts")
        ? supabase.from("posts").select("id, content, created_at, author:profiles(display_name, photo_url)")
            .eq("visibility", "public").eq("status", "active").ilike("content", `%${q}%`)
            .order("created_at", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] }),
      want("jobs")
        ? supabase.from("jobs").select("id, title, company, location, employment_type")
            .eq("status", "active").or(`title.ilike.%${q}%,company.ilike.%${q}%`).limit(20)
        : Promise.resolve({ data: [] }),
      want("products")
        ? supabase.from("products").select("id, title, price, currency, image_urls, category")
            .in("status", ["approved", "active"]).or(`title.ilike.%${q}%,description.ilike.%${q}%`).limit(20)
        : Promise.resolve({ data: [] }),
    ])

    return NextResponse.json({
      people: people.data || [],
      posts: posts.data || [],
      jobs: jobs.data || [],
      products: products.data || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
