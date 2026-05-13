import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function deepInspect() {
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log("--- DEEP INSPECTION START ---");

  // 1. Check for ANY tables related to marketplace
  const { data: tables } = await adminQuery(supabase, "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%market%';");
  console.log("Marketplace-related tables:", tables);

  // 2. Sample data from 'products' table
  const { data: productsSample } = await supabase.from('products').select('*').limit(3);
  console.log("Sample from 'products':", productsSample);

  // 3. Sample data from 'marketplace_products' table (if exists)
  const { data: mProductsSample } = await supabase.from('marketplace_products').select('*').limit(3).catch(() => ({ data: null }));
  console.log("Sample from 'marketplace_products':", mProductsSample);

  // 4. Check for 'approved' status specifically
  const { count: approvedCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'approved');
  console.log("Count of 'approved' in 'products':", approvedCount);

  // 5. Check if RLS is enabled on 'products'
  const { data: rlsStatus } = await adminQuery(supabase, "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'products';");
  console.log("RLS Status for 'products':", rlsStatus);

  console.log("--- DEEP INSPECTION END ---");
}

async function adminQuery(supabase, sql) {
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        return { data, error };
    } catch (e) {
        return { data: null, error: e };
    }
}

deepInspect().catch(console.error);
