import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function verifyAPI() {
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
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("Simulating NEW API fetch logic (Anonymous)...");

  // Replicating logic in app/api/marketplace/products/route.ts
  let { data: products, error } = await supabase
        .from("products")
        .select('*')
        .or('status.eq.approved,status.eq.active,status.is.null')
        .order("created_at", { ascending: false });

  if (error) {
    console.error("API Fetch Error:", error.message);
  } else {
    console.log(`API Fetch Success! Found ${products.length} products.`);
    if (products.length > 0) {
        console.log("Sample product titles:", products.slice(0, 3).map(p => p.title));
    }
  }
}

verifyAPI().catch(console.error);
