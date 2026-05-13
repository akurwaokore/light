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

async function addPermissions() {
  console.log('Fetching user sbirzhan@gmail.com...');
  const { data: user } = await supabase.from('profiles').select('id, full_name').eq('email', 'sbirzhan@gmail.com').single();
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('Updating profile for Birzhan...');
  // Ensure Birzhan has a display_name if null, so the UI works better
  if (!user.full_name) {
    await supabase.from('profiles').update({ full_name: 'Birzhan', display_name: 'Birzhan' }).eq('id', user.id);
  }

  // Also check edamoke@gmail.com since i fixed connections with them
  const { data: user2 } = await supabase.from('profiles').select('id').eq('email', 'edamoke@gmail.com').single();
  if (user2) {
      console.log('Updating profile for user edamoke...');
      await supabase.from('profiles').update({ display_name: 'Friend User' }).eq('id', user2.id);
  }

  console.log('Birzhan and friend should now be connected and profiles updated.');
}

addPermissions();
