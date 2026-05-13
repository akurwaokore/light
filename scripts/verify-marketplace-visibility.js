import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function verify() {
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
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log("--- Verification Start ---");

  // 1. Check data as Admin
  const { data: adminData, count: adminCount } = await adminClient
    .from('products')
    .select('*', { count: 'exact' })
    .eq('status', 'approved');
  
  console.log(`Admin Check: Found ${adminCount} approved products.`);

  // 2. Check data as Anon (Simulating public user)
  const { data: anonData, error: anonError, count: anonCount } = await anonClient
    .from('products')
    .select('*', { count: 'exact' });
  
  if (anonError) {
    console.log("Anon Check FAILED:", anonError.message);
    if (anonError.message.includes("policy")) {
      console.log("Reason: RLS policy is blocking public access.");
    } else if (anonError.message.includes("permission denied")) {
      console.log("Reason: Missing GRANT SELECT on the table.");
    }
  } else {
    console.log(`Anon Check: Successfully fetched ${anonCount} products.`);
  }

  // 3. Check for RLS specifically
  const { data: rlsCheck } = await adminClient.rpc('exec_sql', { 
    sql_query: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products';"
  }).catch(() => ({ data: null }));

  if (rlsCheck) {
    console.log("RLS Status:", rlsCheck);
  } else {
    console.log("Could not check RLS status via RPC.");
  }

  console.log("--- Verification End ---");
}

verify().catch(console.error);
