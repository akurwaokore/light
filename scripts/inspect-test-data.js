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

async function runDetailedInspection() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- Detailed Data Inspection ---');

  // 1. Jobs Inspection
  const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*').limit(2);
  console.log('\nJobs Data:', JSON.stringify(jobs, null, 2));

  // 2. CVs Inspection
  const { data: cvs, error: cvsError } = await supabase.from('cvs').select('*').limit(2);
  console.log('\nCVs Data:', JSON.stringify(cvs, null, 2));

  // 3. Profiles Inspection (to find names)
  const { data: profiles, error: profError } = await supabase.from('profiles').select('id, full_name, email').limit(5);
  console.log('\nProfiles Data:', JSON.stringify(profiles, null, 2));
}

runDetailedInspection();
