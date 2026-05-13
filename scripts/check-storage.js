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
  console.log('Checking "public" bucket...');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.error('Error listing buckets:', bError);
  } else {
    console.log('Buckets:', buckets.map(b => b.name));
    const publicBucket = buckets.find(b => b.name === 'public');
    if (!publicBucket) {
      console.log('Creating "public" bucket...');
      const { error: cError } = await supabase.storage.createBucket('public', { public: true });
      if (cError) console.error('Error creating bucket:', cError);
      else console.log('Bucket created.');
    } else {
        console.log('"public" bucket exists.');
    }
  }
}

checkStorage();
