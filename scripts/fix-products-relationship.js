import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function fixRelationship() {
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log("Fixing products -> profiles relationship...");

  const sql = `
    -- Add foreign key constraint if it doesn't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_seller_id_fkey'
      ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_seller_id_fkey
        FOREIGN KEY (seller_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
      END IF;
    END $$;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error("Error applying SQL:", error.message);
  } else {
    console.log("Relationship fix applied successfully.");
  }
}

fixRelationship().catch(console.error);
