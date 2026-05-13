const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Basic env parser
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const sql = fs.readFileSync('scripts/fix-friendships-schema.sql', 'utf8');
  console.log('Executing SQL to fix friendships schema...');

  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

  if (error) {
    console.error('Error executing SQL:', error.message);
    // If exec_sql RPC doesn't exist, we might need a different approach or the user has to run it manually
    if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('\n--- MANUAL ACTION REQUIRED ---');
        console.log('The "exec_sql" function is not available in your Supabase project.');
        console.log('Please copy the content of "scripts/fix-friendships-schema.sql" and run it in the Supabase SQL Editor.');
        console.log('------------------------------\n');
    }
  } else {
    console.log('SQL executed successfully:', data);
  }
}

runSQL().catch(err => console.error(err));
