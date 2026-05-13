import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function enableAutoApprove() {
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
  
  console.log("Enabling Marketplace Auto-Approval...");

  // Try updating the setting
  const { data, error } = await supabase
    .from('system_settings')
    .update({ marketplace_auto_approve: true })
    .match({ id: 1 }) // Common pattern in this project
    .select();

  if (error) {
    console.error("Failed to update system_settings:", error.message);
    
    // Check if table even has data
    const { data: allSettings } = await supabase.from('system_settings').select('*');
    console.log("Current system_settings table state:", allSettings);

    if (!allSettings || allSettings.length === 0) {
       console.log("Table is empty. Inserting default settings...");
       const { error: insertError } = await supabase.from('system_settings').insert({
         id: 1,
         marketplace_auto_approve: true
       });
       if (insertError) console.error("Insert failed:", insertError.message);
       else console.log("Default settings inserted with Auto-Approve ON.");
    }
  } else {
    console.log("Successfully enabled Auto-Approval:", data);
  }
}

enableAutoApprove().catch(console.error);
