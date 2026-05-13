import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function inspectTable() {
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
  
  console.log("Inspecting columns for table 'products'...");
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'products';" 
  });

  if (error) {
    console.error("Error inspecting table:", error.message);
  } else {
    console.log("Columns found:");
    console.table(data);
  }
}

inspectTable().catch(console.error);
