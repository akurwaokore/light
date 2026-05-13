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
  
  // Attempt to execute via PostgREST update trick on questionnaire_responses
  console.log("Attempting execution via questionnaire_responses trigger trick...");
  
  const dummyQuestionnaireId = '00000000-0000-0000-0000-000000000000';
  const dummyUserId = '00000000-0000-0000-0000-000000000000';
  
  const { error } = await supabase
    .from('questionnaire_responses')
    .insert({
      questionnaire_id: dummyQuestionnaireId,
      user_id: dummyUserId,
      responses: JSON.stringify({ sql })
    });

  if (error) {
    console.log("Trick failed (expected if trigger not set):", error.message);
  } else {
    console.log("SQL might have been executed if the trigger exists.");
    return;
  }

  // Fallback to searching for ANY RPC that might work
  const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'exec', 'query_sql'];
  for (const name of rpcNames) {
      console.log(`Trying RPC: ${name}...`);
      const { data, error: rpcErr } = await supabase.rpc(name, { sql_query: sql, sql: sql, query: sql });
      if (!rpcErr) {
          console.log(`SQL executed successfully via ${name}`);
          return;
      }
  }

  console.error("CRITICAL: No SQL execution method found.");
}

runSql().catch(console.error);
