import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runSql() {
  const sqlFile = process.argv[2] || "scripts/update-social-feed-system.sql";
  console.log(`Using SQL file: ${sqlFile}`);

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
  const sql = fs.readFileSync(path.join(process.cwd(), sqlFile), "utf8");
  
  console.log("Executing SQL...");
  
  // Try direct query if possible, but supabase-js doesn't have a direct .query()
  // We have to rely on RPC or some other way. 
  // If exec_sql doesn't exist, we might be in trouble without a proper tool.
  // Let's try to at least log the attempt.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error executing SQL via RPC:", error);
    console.log("Attempting to split and execute commands (this may fail if RPC is missing)...");
    
    // Split by semicolon, but be careful with DO blocks
    // This is a very crude split
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    for (const cmd of commands) {
      // Skip if it looks like part of a DO block that was split
      if (cmd.toLowerCase().includes('begin') && !cmd.toLowerCase().includes('end')) continue;
      
      console.log(`Executing segment: ${cmd.trim().substring(0, 50)}...`);
      const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd.trim() });
      if (cmdError) {
        console.error(`Failed: ${cmdError.message}`);
      } else {
        console.log("Success");
      }
    }
  } else {
    console.log("SQL executed successfully");
  }
}

runSql().catch(console.error);
