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
  
  // Try using the rest API with Postgres functions if we have one, but we don't.
  // We'll have to use individual RPC calls for DML or tell the user to run it in the Supabase dashboard.
  console.log("--------------------------------------------------------------------------------");
  console.log("PLEASE RUN THE FOLLOWING SQL SCRIPT IN THE SUPABASE SQL EDITOR:");
  console.log(sqlPath);
  console.log("--------------------------------------------------------------------------------");
  
  const dashboardUrl = supabaseUrl.replace('.supabase.co', '').replace('https://', 'https://supabase.com/dashboard/project/');
  console.log(`You can run it here: ${dashboardUrl}/sql/new`);
  
}

runSql().catch(console.error);