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

async function backfillNotifications() {
  console.log('Fetching pending friendships...');
  const { data: friendships, error: fError } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_user_id_fkey(display_name)')
    .eq('status', 'pending');

  if (fError) {
    console.error('Error fetching friendships:', fError);
    return;
  }

  console.log(`Found ${friendships.length} pending friendships.`);

  for (const f of friendships) {
    // Check if notification already exists
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', f.friend_id)
      .eq('metadata->friendship_id', f.id)
      .maybeSingle();

    if (!existing) {
      console.log(`Creating notification for ${f.friend_id} from ${f.user_id}...`);
      const { error: nError } = await supabase.from('notifications').insert([{
        user_id: f.friend_id,
        type: 'general',
        title: 'New Connection Request',
        message: `${f.requester?.display_name || 'Someone'} sent you a connection request.`,
        link: '/friends',
        metadata: { friendship_id: f.id, requester_id: f.user_id, real_type: 'friend_request' }
      }]);
      
      if (nError) console.error('Error creating notification:', nError);
    } else {
      console.log(`Notification already exists for friendship ${f.id}`);
    }
  }
  
  console.log('Backfill complete.');
}

backfillNotifications();
