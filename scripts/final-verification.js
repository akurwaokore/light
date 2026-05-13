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

async function checkStorage() {
  console.log('--- Storage Bucket Check ---');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.error('Error listing buckets:', bError);
    return;
  }
  console.log('Buckets:', buckets.map(b => b.name));

  const publicBucket = buckets.find(b => b.name === 'public');
  if (!publicBucket) {
    console.log('CRITICAL: "public" bucket is missing!');
  } else {
    console.log('"public" bucket exists. Is public:', publicBucket.public);
  }

  console.log('\n--- Profiles Display Name Check ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, email, display_name').limit(10);
  if (pError) {
      console.error('Error fetching profiles:', pError);
  } else {
      profiles.forEach(p => {
          console.log(`- ${p.email}: ${p.display_name || 'NULL (UI may break)'}`);
      });
  }

  console.log('\n--- Storage Objects Count Check ---');
  const { data: objects, error: oError } = await supabase.storage.from('public').list('posts', { limit: 10 });
  if (oError) {
      console.error('Error listing objects in "public/posts":', oError);
  } else {
      console.log(`Found ${objects?.length || 0} objects in "public/posts" folder.`);
  }
}

checkStorage();
