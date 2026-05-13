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

async function fixConnections() {
  console.log('Finding user sbirzhan@gmail.com...');
  const { data: user } = await supabase.from('profiles').select('id').eq('email', 'sbirzhan@gmail.com').single();
  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Accepting all pending requests for sbirzhan...');
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('status', 'pending')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) {
    console.error('Error updating friendships:', error);
  } else {
    console.log('Connections fixed.');
  }
}

fixConnections();
