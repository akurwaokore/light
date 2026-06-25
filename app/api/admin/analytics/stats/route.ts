import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Build the last 6 month buckets (oldest -> newest) keyed YYYY-M.
function lastSixMonths(now: Date) {
  const buckets: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] })
  }
  return buckets
}

function bucketByMonth(
  rows: any[],
  dateField: string,
  valueField: string | null,
  buckets: { key: string; label: string }[],
) {
  const map: Record<string, number> = {}
  for (const b of buckets) map[b.key] = 0
  for (const r of rows || []) {
    const d = new Date(r[dateField])
    if (isNaN(d.getTime())) continue
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (key in map) map[key] += valueField ? Number(r[valueField]) || 0 : 1
  }
  return buckets.map((b) => ({ month: b.label, value: map[b.key] }))
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const now = new Date()
    const day = 24 * 60 * 60 * 1000
    const last30 = new Date(now.getTime() - 30 * day).toISOString()
    const prev30 = new Date(now.getTime() - 60 * day).toISOString()
    const buckets = lastSixMonths(now)

    const count = async (table: string, build?: (q: any) => any) => {
      let q = supabase.from(table).select("*", { count: "exact", head: true })
      if (build) q = build(q)
      const { count } = await q
      return count || 0
    }

    const [
      totalMembers,
      activeUsers,
      eventRSVPs,
      totalPosts,
      totalProducts,
      totalJobs,
      totalClubs,
      totalEvents,
      newMembers30,
      newMembersPrev30,
    ] = await Promise.all([
      count("profiles"),
      count("profiles", (q) => q.eq("status", "active")),
      count("event_registrations"),
      count("posts"),
      count("products"),
      count("jobs"),
      count("clubs"),
      count("events"),
      count("profiles", (q) => q.gte("created_at", last30)),
      count("profiles", (q) => q.gte("created_at", prev30).lt("created_at", last30)),
    ])

    // Donations (completed-ish statuses) — sum + time series + growth.
    const { data: donationRows } = await supabase.from("donations").select("amount, status, created_at")
    const completed = (donationRows || []).filter((d: any) =>
      ["completed", "succeeded", "paid", "success"].includes(String(d.status || "").toLowerCase()),
    )
    const totalDonations = completed.reduce((s: number, d: any) => s + (Number(d.amount) || 0), 0)
    const donations30 = completed
      .filter((d: any) => d.created_at >= last30)
      .reduce((s: number, d: any) => s + (Number(d.amount) || 0), 0)
    const donationsPrev30 = completed
      .filter((d: any) => d.created_at >= prev30 && d.created_at < last30)
      .reduce((s: number, d: any) => s + (Number(d.amount) || 0), 0)

    // Time series for charts.
    const { data: memberRows } = await supabase.from("profiles").select("created_at")
    const { data: postRows } = await supabase.from("posts").select("created_at")
    const memberGrowth = bucketByMonth(memberRows || [], "created_at", null, buckets)
    const donationTrend = bucketByMonth(completed, "created_at", "amount", buckets)
    const engagement = bucketByMonth(postRows || [], "created_at", null, buckets)

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0

    return NextResponse.json({
      totalMembers,
      activeUsers,
      eventRSVPs,
      totalDonations,
      totalPosts,
      totalProducts,
      totalJobs,
      totalClubs,
      totalEvents,
      memberGrowthPct: pct(newMembers30, newMembersPrev30),
      donationGrowthPct: pct(donations30, donationsPrev30),
      memberGrowth,
      donationTrend,
      engagement,
      topSections: [
        { name: "Feed (Posts)", count: totalPosts },
        { name: "Events", count: totalEvents },
        { name: "Marketplace", count: totalProducts },
        { name: "Careers (Jobs)", count: totalJobs },
        { name: "Clubs", count: totalClubs },
      ].sort((a, b) => b.count - a.count),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
