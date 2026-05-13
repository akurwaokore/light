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

async function inspectJobsColumns() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Inspecting "jobs" table columns ---');
  // Using a query that is likely to fail if a column is missing to see what's there
  // Or just fetching one row and looking at keys
  const { data, error } = await supabase.from('jobs').select('*').limit(1).single();
  if (error) {
    console.log('Error fetching "jobs" row:', error.message);
  } else {
    console.log('Columns in "jobs":', Object.keys(data));
  }
}

inspectJobsColumns();
