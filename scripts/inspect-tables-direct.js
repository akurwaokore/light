import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function inspectTables() {
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

  console.log("Fetching some rows from 'products'...");
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (productsError) {
    console.error("Error fetching from 'products':", productsError.message);
    if (productsError.message.includes("does not exist")) {
        console.log("'products' table DOES NOT EXIST.");
    }
  } else {
    console.log("'products' table exists. Sample row columns:", Object.keys(productsData[0] || {}));
  }

  console.log("\nFetching some rows from 'marketplace_products'...");
  const { data: marketData, error: marketError } = await supabase
    .from('marketplace_products')
    .select('*')
    .limit(1);

  if (marketError) {
    console.error("Error fetching from 'marketplace_products':", marketError.message);
    if (marketError.message.includes("does not exist")) {
        console.log("'marketplace_products' table DOES NOT EXIST.");
    }
  } else {
    console.log("'marketplace_products' table exists. Sample row columns:", Object.keys(marketData[0] || {}));
  }
}

inspectTables().catch(console.error);
