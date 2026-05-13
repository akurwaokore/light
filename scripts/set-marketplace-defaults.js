import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function setDefaults() {
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
  
  console.log("Setting Marketplace Defaults...");

  // 1. Ensure Marketplace Auto-Approve is ON by default in settings
  const { data: settingData, error: settingError } = await supabase
    .from('system_settings')
    .update({ marketplace_auto_approve: true })
    .match({ id: 1 })
    .select();

  if (settingError) console.error("Setting update error:", settingError.message);
  else console.log("System Setting 'marketplace_auto_approve' set to TRUE.");

  // 2. Approve any remaining products that are not currently approved
  const { data: updateData, error: updateError } = await supabase
    .from('products')
    .update({ status: 'approved' })
    .neq('status', 'approved');

  if (updateError) console.error("Bulk approval error:", updateError.message);
  else console.log(`Bulk approval complete. All products are now 'approved'.`);

  // 3. Final count verification
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');
  
  console.log(`Total approved products: ${count}`);
}

setDefaults().catch(console.error);
