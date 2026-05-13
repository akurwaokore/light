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

async function findJobsTable() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Searching for the correct jobs table ---');
  
  const tablesToTry = ['jobs', 'job_listings', 'marketplace_jobs'];
  
  for (const table of tablesToTry) {
    console.log(`Checking table: ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}" error:`, error.message);
    } else {
      console.log(`Table "${table}" FOUND. Data sample:`, data);
      // If found, inspect columns
      const { data: row } = await supabase.from(table).select('*').limit(1).single();
      if (row) {
        console.log(`Columns in "${table}":`, Object.keys(row));
      }
    }
    console.log('---');
  }
}

findJobsTable();
