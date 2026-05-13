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

async function verifyTablesAndData() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- Checking tables ---');
  
  const tables = ['jobs', 'job_listings', 'job_applications', 'cvs', 'notifications'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.log(`Table "${table}": Error - ${error.message}`);
    } else {
      console.log(`Table "${table}": Exists`);
    }
  }

  console.log('\n--- Checking for potential Job Poster ---');
  const { data: poster, error: posterError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .limit(1)
    .single();
    
  if (poster) {
    console.log(`Poster: ${poster.full_name} (${poster.id})`);
  }

  console.log('\n--- Checking for potential Applicant (with CV) ---');
  const { data: cv, error: cvError } = await supabase
    .from('cvs')
    .select('user_id, id, file_name')
    .limit(1)
    .single();
    
  if (cv) {
    console.log(`Applicant (CV Owner): ${cv.user_id} (CV ID: ${cv.id})`);
  } else {
    console.log('No CVs found.');
  }

  console.log('\n--- Checking for active Job Listing ---');
  // Try both table names
  let jobTable = 'jobs';
  let { data: job, error: jobError } = await supabase.from('jobs').select('id, title, posted_by').limit(1).maybeSingle();
  
  if (jobError || !job) {
    jobTable = 'job_listings';
    const result = await supabase.from('job_listings').select('id, title, poster_id').limit(1).maybeSingle();
    job = result.data;
    jobError = result.error;
  }

  if (job) {
    console.log(`Job: "${job.title}" (ID: ${job.id}) in table "${jobTable}"`);
  } else {
    console.log('No active jobs found.');
  }
}

verifyTablesAndData();
