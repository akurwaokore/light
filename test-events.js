import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function testEventsQuery() {
  const envPath = fs.existsSync(path.join(process.cwd(), ".env.local")) 
    ? path.join(process.cwd(), ".env.local")
    : path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Querying events joining profiles with !events_organizer_id_fkey...");
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      organizer:profiles!events_organizer_id_fkey(id, display_name, email, photo_url)
    `)
    .limit(1);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log("Query succeeded! Sample event data:", JSON.stringify(data, null, 2));
  }
}

testEventsQuery().catch(console.error);
