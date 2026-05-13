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

async function inspectConnections() {
  const email = 'sbirzhan@gmail.com';
  console.log(`Inspecting connections for ${email}...`);
  
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('email', email)
    .single();

  if (userError) {
    console.log('Error finding user:', userError.message);
    return;
  }

  console.log('User found:', user);

  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      user_id,
      friend_id,
      requester:profiles!friendships_user_id_fkey(id, email, display_name),
      recipient:profiles!friendships_friend_id_fkey(id, email, display_name)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (friendError) {
    console.log('Error fetching friendships with joins:', friendError.message);
    
    // Try simple fetch
    const { data: simple, error: simpleError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      
    if (simpleError) {
      console.log('Simple fetch also failed:', simpleError.message);
    } else {
      console.log('Simple friendships:', JSON.stringify(simple, null, 2));
    }
  } else {
    console.log('Friendships with joins:', JSON.stringify(friendships, null, 2));
  }
}

inspectConnections().catch(err => console.error(err));
