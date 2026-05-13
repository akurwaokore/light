import { createServerClient } from "./lib/supabase/server.js";
import fs from "fs";
import path from "path";

async function runSql() {
  const supabase = await createServerClient();
  const sql = fs.readFileSync(path.join(process.cwd(), "scripts/fix-profile-status-constraint.sql"), "utf8");
  
  console.log("Executing SQL...");
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error executing SQL:", error);
    
    // Fallback: Try executing each command separately if exec_sql is not available or fails
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    for (const cmd of commands) {
      console.log(`Executing: ${cmd.trim()}...`);
      const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd.trim() });
      if (cmdError) {
        console.error(`Failed to execute command: ${cmdError.message}`);
      }
    }
  } else {
    console.log("SQL executed successfully");
  }
}

runSql().catch(console.error);
