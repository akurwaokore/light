import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function inspectClubsConstraint() {
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

  console.log("Inspecting 'clubs_category_check' constraint...");
  const { data: constraint, error: constraintError } = await supabase.rpc('exec_sql', { 
    sql_query: `
      SELECT pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname = 'clubs_category_check';
    ` 
  });
  
  if (constraintError) {
    console.error("Error inspecting constraint:", constraintError.message);
    
    // Fallback: Check existing categories in the table
    console.log("\nChecking existing categories in 'clubs' table...");
    const { data: categories, error: fetchError } = await supabase
      .from('clubs')
      .select('category')
      .not('category', 'is', null);
      
    if (fetchError) {
      console.error("Error fetching categories:", fetchError.message);
    } else {
      const uniqueCategories = [...new Set(categories.map(c => c.category))];
      console.log("Unique categories found in 'clubs' table:", uniqueCategories);
    }
  } else {
    console.log("Constraint definition:", constraint);
  }
}

inspectClubsConstraint().catch(console.error);
