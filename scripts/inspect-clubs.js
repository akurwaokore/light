import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function inspectClubsSchema() {
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
    console.error("Missing Supabase environment variables");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Inspecting 'clubs' table...");
  const { data: clubsCols, error: clubsError } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clubs';" 
  });
  
  if (clubsError) {
    console.error("Error inspecting 'clubs':", clubsError.message);
  } else {
    console.log("Columns in 'clubs':", clubsCols);
  }

  console.log("\nInspecting 'club_memberships' table...");
  const { data: membershipCols, error: membershipError } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'club_memberships';" 
  });

  if (membershipError) {
    console.error("Error inspecting 'club_memberships':", membershipError.message);
  } else {
    console.log("Columns in 'club_memberships':", membershipCols);
  }

  console.log("\nChecking for any clubs...");
  const { data: clubs, error: fetchError } = await supabase.from('clubs').select('*').limit(5);
  if (fetchError) {
    console.error("Error fetching clubs:", fetchError.message);
  } else {
    console.log("Sample clubs:", clubs);
  }
}

inspectClubsSchema().catch(console.error);
