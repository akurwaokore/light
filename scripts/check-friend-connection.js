const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
console.log('Env keys found:', Object.keys(env));

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFriend() {
  console.log('Checking connection for sbirzhan@gmail.com...');
  
  // Find the user by email
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', 'sbirzhan@gmail.com')
    .single();

  if (userError) {
    console.log('Error finding user:', userError.message);
    return;
  }

  console.log('Found user:', user);

  // Find all connections (accepted or pending)
  const { data: friends, error: friendError } = await supabase
    .from('friendships')
    .select(`
      *,
      sender:profiles!friendships_user_id_fkey(id, email),
      receiver:profiles!friendships_friend_id_fkey(id, email)
    `)
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (friendError) {
    console.log('Error finding connections:', friendError.message);
    // If profiles join fails, try a simple query
    const { data: simpleFriends, error: simpleError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    
    if (simpleError) {
       console.log('Simple query also failed:', simpleError.message);
       return;
    }
    
    if (simpleFriends.length === 0) {
      console.log('No connections found (simple query).');
    } else {
      console.log(`Found ${simpleFriends.length} connections (simple query):`, simpleFriends);
    }
    return;
  }

  if (friends.length === 0) {
    console.log('No connections found for this user.');
  } else {
    console.log(`Found ${friends.length} connections:`);
    friends.forEach(f => {
      const other = f.user_id === user.id ? f.receiver : f.sender;
      console.log(`- Connection with ${other?.full_name} (${other?.email}) - Status: ${f.status}`);
    });
  }
}

checkFriend().catch(err => console.error(err));
