import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function inspectSchema() {
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

  console.log("Inspecting 'products' table...");
  const { data: productsCols, error: productsError } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';" 
  });
  
  if (productsError) {
    console.error("Error inspecting 'products':", productsError.message);
  } else {
    console.log("Columns in 'products':", productsCols);
  }

  console.log("\nInspecting 'marketplace_products' table...");
  const { data: marketCols, error: marketError } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'marketplace_products';" 
  });

  if (marketError) {
    console.error("Error inspecting 'marketplace_products':", marketError.message);
  } else {
    console.log("Columns in 'marketplace_products':", marketCols);
  }

  console.log("\nChecking for 'exec_sql' function...");
  const { data: funcCheck, error: funcError } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT 1" 
  });
  if (funcError) {
      console.log("exec_sql function seems to be missing or failing:", funcError.message);
  } else {
      console.log("exec_sql function is working.");
  }
}

inspectSchema().catch(console.error);
