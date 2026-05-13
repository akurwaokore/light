import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runSql() {
  // Simple env parser
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
    console.error("Missing Supabase environment variables in .env.local");
    return;
  }

  const scriptPath = process.argv[2];
  if (!scriptPath) {
    console.error("Please provide a SQL file path");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const sql = fs.readFileSync(path.join(process.cwd(), scriptPath), "utf8");
  
  console.log(`Executing SQL from ${scriptPath}...`);
  
  // Use postgrest query directly for common operations if rpc fails
  // But for DDL we usually need a specialized function or the dashboard
  // Since I don't have the dashboard, I'll try to use the existing rpc if available
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error executing SQL via RPC:", error.message);
    console.log("Trying to execute via individual table operations or alternative methods is not possible for DDL via SDK.");
    console.log("Please ensure 'exec_sql' function exists in your Supabase database.");
  } else {
    console.log("SQL executed successfully");
  }
}

runSql().catch(console.error);
