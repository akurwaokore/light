// Live DB introspection via Supabase REST (service role). Run: node scripts/introspect-live-db.mjs
import { createClient } from "@supabase/supabase-js"
import fs from "fs"

// minimal .env parser
const env = {}
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim()
}
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
console.log("URL:", url)
const supabase = createClient(url, key, { auth: { persistSession: false } })

const TABLES = [
  "profiles", "user_roles", "roles", "role_permissions", "system_settings", "notifications",
  // marketplace
  "products", "marketplace_products", "marketplace_transactions", "transactions",
  "product_comments", "product_categories",
  // jobs
  "jobs", "job_listings", "job_applications", "job_categories", "cvs",
  // social
  "posts", "comments", "post_reactions", "comment_reactions", "post_shares", "saved_posts",
  "friendships", "chat_conversations", "chat_participants", "chat_messages",
  // points
  "user_points", "point_transactions", "points_transactions", "points_milestones",
]

const RPCS = [
  ["award_points", { target_user_id: "00000000-0000-0000-0000-000000000000", points_to_add: 0, action_name: "probe", action_desc: "probe" }],
  ["ensure_chat_conversation", { initiator_uuid: "00000000-0000-0000-0000-000000000000", recipient_uuid: "00000000-0000-0000-0000-000000000001" }],
  ["exec_sql", { sql_query: "select 1" }],
]

const result = { tables: {}, rpcs: {} }

for (const t of TABLES) {
  const { data, error } = await supabase.from(t).select("*").limit(1)
  if (error) {
    result.tables[t] = { exists: false, error: error.message, code: error.code }
  } else {
    const cols = data && data[0] ? Object.keys(data[0]) : null
    // if no rows, get columns via a head request with count + an empty insert dry run is risky; report row count
    const { count } = await supabase.from(t).select("*", { count: "exact", head: true })
    result.tables[t] = { exists: true, rowCount: count, sampleColumns: cols }
  }
}

for (const [name, args] of RPCS) {
  const { error } = await supabase.rpc(name, args)
  result.rpcs[name] = error ? { error: error.message, code: error.code } : { ok: true }
}

console.log(JSON.stringify(result, null, 2))
fs.writeFileSync("scripts/_live-db-snapshot.json", JSON.stringify(result, null, 2))
console.log("\nWrote scripts/_live-db-snapshot.json")
