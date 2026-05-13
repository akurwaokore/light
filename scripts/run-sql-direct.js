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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const sql = fs.readFileSync(path.join(process.cwd(), "scripts/fix-profile-status-constraint.sql"), "utf8");
  
  console.log("Executing SQL...");
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error executing SQL:", error);
    
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    for (const cmd of commands) {
      console.log(`Executing: ${cmd.trim()}...`);
      const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd.trim() });
      if (cmdError) {
        console.error(`Failed to execute command: ${cmdError.message}`);
      } else {
        console.log("Command executed successfully");
      }
    }
  } else {
    console.log("SQL executed successfully");
  }
}

runSql().catch(console.error);
