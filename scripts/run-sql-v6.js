import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runSql() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Please provide a SQL file path as an argument");
    process.exit(1);
  }

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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const sqlPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(process.cwd(), sqlFile);
  const sql = fs.readFileSync(sqlPath, "utf8");
  
  console.log(`Executing SQL from ${sqlFile}...`);
  
  // Try to find if we can execute this via some other RPC name
  const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'sql'];
  
  for (const name of rpcNames) {
      console.log(`Trying RPC: ${name}...`);
      const { data, error } = await supabase.rpc(name, { sql_query: sql, sql: sql, query: sql });
      if (!error) {
          console.log(`SQL executed successfully via ${name}`);
          console.log("Result:", data);
          return;
      }
      console.log(`${name} failed: ${error.message}`);
  }

  console.log("All RPC attempts failed. Attempting to split and execute via common tables (this will likely fail for DDL)...");
  
  // Last resort: try to find any existing table and run a query that might allow execution
  // Actually, there's no way to run arbitrary DDL via PostgREST without a dedicated RPC.
  // Let's try to see if we can at least update the notification types constraint if we can't run the whole script.
  
  console.error("CRITICAL: No SQL execution function found in database. Please create 'exec_sql' function in Supabase Dashboard.");
}

runSql().catch(console.error);
