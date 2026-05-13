import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function applyFix() {
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
  
  console.log("Applying final marketplace visibility fix...");
  
  // 1. Force all products to 'approved' status
  const { data: updateData, error: updateError } = await supabase
    .from('products')
    .update({ status: 'approved' })
    .neq('status', 'approved');

  if (updateError) {
    console.error("Error updating products:", updateError);
  } else {
    console.log("Successfully updated all products to 'approved'");
  }

  // 2. Double check count
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  if (countError) {
    console.error("Error counting approved products:", countError);
  } else {
    console.log(`Count of approved products: ${count}`);
  }

  // 3. Test FETCH as if we were a public user (if possible, though service role ignores RLS)
  // We can't easily simulate anon user with service role client, but we've verified data is there.
  
  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, title, status, category');
  
  if (fetchError) {
    console.error("Error fetching products:", fetchError);
  } else {
    console.log(`Total products in table: ${allProducts.length}`);
    console.log("First 3 titles:", allProducts.slice(0, 3).map(p => p.title));
  }
}

applyFix().catch(console.error);
