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

async function runRawSql(query) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log(`--- Running SQL query ---`);
  console.log(query);
  
  // We try to use a standard RPC if available, or find another way
  // Since we don't have exec_sql, we are limited.
  // But wait, many projects have 'run_sql' or similar.
  
  const { data, error } = await supabase.rpc('run_sql', { sql: query });
  
  if (error) {
    console.log('Error running SQL via "run_sql":', error.message);
  } else {
    console.log('SQL Result:', data);
  }
}

runRawSql('ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS logo_url TEXT;');
