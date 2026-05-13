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

async function findExecSql() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Searching for exec_sql function ---');
  // Attempting to list all RPC functions is hard, so we just try to call it with a harmless query
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
  
  if (error) {
    console.log('exec_sql check error:', error.message);
    if (error.code === 'PGRST202') {
        console.log('exec_sql function NOT FOUND.');
    }
  } else {
    console.log('exec_sql function FOUND and WORKING.');
  }
}

findExecSql();
