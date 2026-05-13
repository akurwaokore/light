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

async function inspectSchemaDirectly() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('--- Inspecting Information Schema ---');
  // We try to use a select on a system table if possible, or just use RPC if it exists
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title')
    .limit(1);

  if (error) {
    console.log('Error selecting from "jobs":', error.message);
  } else {
    console.log('Successfully selected from "jobs":', data);
  }

  // Check if we can find other tables
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (pError) {
    console.log('Error selecting from "profiles":', pError.message);
  } else {
    console.log('Successfully selected from "profiles":', profiles);
  }
}

inspectSchemaDirectly();
