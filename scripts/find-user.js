import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function findUser() {
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
  const email = "b.shaimardan@lis.sc.ke";
  
  console.log(`Searching for user with email: ${email}`);
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error finding user:", error.message);
    // Try search by display name or partial email if needed
  } else {
    console.log("User found:");
    console.log(JSON.stringify(profile, null, 2));
  }
}

findUser().catch(console.error);
