const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic manual env loader
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

async function addLogoUrlToJobTable() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Attempting to find any SQL execution RPC ---');
  
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql'];
  for (const rpc of rpcs) {
    console.log(`Trying RPC: ${rpc}...`);
    const { error } = await supabase.rpc(rpc, { sql_query: 'SELECT 1;', sql: 'SELECT 1;', query: 'SELECT 1;' });
    if (error) {
      console.log(`RPC ${rpc} error:`, error.message);
    } else {
      console.log(`RPC ${rpc} seems to EXIST!`);
    }
  }
}

addLogoUrlToJobTable();
