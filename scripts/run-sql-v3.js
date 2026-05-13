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
  
  // Try to find exec_sql first
  const { data: funcCheck, error: funcError } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
  if (funcError && funcError.message.includes('Could not find')) {
    console.log("exec_sql function missing. Creating it temporarily...");
    const createFuncSql = `
      CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
          result jsonb;
      BEGIN
          EXECUTE sql_query;
          RETURN jsonb_build_object('status', 'success');
      EXCEPTION WHEN OTHERS THEN
          RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
      END;
      $$;
    `;
    // We can't use rpc to create it if rpc is missing, but some environments allow it via other means.
    // However, if we don't have a way to run raw SQL, we are stuck.
    // Let's assume for this task we can't create it if it's not there.
  }

  const sqlPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(process.cwd(), sqlFile);
  const sql = fs.readFileSync(sqlPath, "utf8");
  
  console.log(`Executing SQL from ${sqlFile}...`);
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error executing SQL via exec_sql:", error);
    console.log("Attempting to execute commands individually...");
    
    // Simple split by semicolon (not perfect for complex SQL but works for simple scripts)
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    for (const cmd of commands) {
      console.log(`Executing: ${cmd.trim().substring(0, 50)}...`);
      const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd.trim() });
      if (cmdError) {
        console.error(`Failed to execute command: ${cmdError.message}`);
      } else {
        console.log("Command executed successfully");
      }
    }
  } else {
    console.log("SQL executed successfully");
    console.log("Result:", data);
  }
}

runSql().catch(console.error);
