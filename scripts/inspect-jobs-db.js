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

async function inspectJobsSchema() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Checking for "jobs" table ---');
  const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*').limit(1);
  if (jobsError) {
    console.log('"jobs" table error:', jobsError.message);
  } else {
    console.log('"jobs" table exists. Data sample:', jobsData);
  }

  console.log('\n--- Checking for "job_listings" table ---');
  const { data: listingsData, error: listingsError } = await supabase.from('job_listings').select('*').limit(1);
  if (listingsError) {
    console.log('"job_listings" table error:', listingsError.message);
  } else {
    console.log('"job_listings" table exists. Data sample:', listingsData);
  }
}

inspectJobsSchema();
