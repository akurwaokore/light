import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function addPesapalSettings() {
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
  
  console.log("Checking system_settings for Pesapal columns...");

  // We can't easily add columns via API if RPC is missing, 
  // but we can try to update existing row if columns were added via dashboard 
  // or use camelCase which might exist in some versions.
  
  const { data: settings } = await supabase.from('system_settings').select('*').limit(1).single();
  console.log("Current columns in system_settings:", Object.keys(settings || {}));

  // Logic to handle snake_case vs camelCase mapping in the update
  const payload = {
    id: 1,
    pesapal_consumer_key: '', 
    pesapal_consumer_secret: '',
    pesapal_environment: 'sandbox'
  };

  // If the table doesn't have these exact names, they might be camelCased in the schema
  // (though the inspection before showed snake_case mostly)
  
  console.log("This script is for diagnostic inspection since DDL is restricted.");
}

addPesapalSettings().catch(console.error);