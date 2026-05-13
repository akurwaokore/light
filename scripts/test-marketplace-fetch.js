import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function testFetch() {
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
  
  console.log("Testing fetch from 'products' table...");
  const { data: pData, error: pError } = await supabase.from("products").select("*");
  if (pError) console.error("Products error:", pError.message);
  else console.log(`Products count: ${pData.length}`);

  console.log("Testing fetch from 'marketplace_products' table...");
  const { data: mpData, error: mpError } = await supabase.from("marketplace_products").select("*");
  if (mpError) console.error("Marketplace products error:", mpError.message);
  else console.log(`Marketplace products count: ${mpData.length}`);
}

testFetch().catch(console.error);
