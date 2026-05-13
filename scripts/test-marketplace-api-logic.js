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
  
  console.log("Simulating API fetch (Anonymous)...");

  // Replicating logic in app/api/marketplace/products/route.ts
  const status = "approved";
  let query = supabase
        .from("products")
        .select(`
          *,
          seller:profiles(id, display_name, email, photo_url)
        `)
        .order("created_at", { ascending: false });
      
  query = query.or('status.eq.approved,status.eq.active,status.is.null');

  const { data, error } = await query;

  if (error) {
    console.error("API Fetch Error:", error.message);
  } else {
    console.log(`API Fetch Success! Found ${data.length} products.`);
    if (data.length > 0) {
        console.log("Sample product titles:", data.slice(0, 3).map(p => p.title));
        console.log("Sample seller data:", data[0].seller);
    }
  }

  // Check categories
  const { data: catData } = await supabase.from('products').select('category');
  const uniqueCats = [...new Set(catData?.map(p => p.category))];
  console.log("Categories found in DB:", uniqueCats);
}

verifyAPI().catch(console.error);
