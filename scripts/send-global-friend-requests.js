import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function sendGlobalFriendRequests() {
  const envPath = fs.existsSync(path.join(process.cwd(), ".env.local")) 
    ? path.join(process.cwd(), ".env.local")
    : path.join(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  const env = {};
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 1. Identify "Me" (the main user)
  const { data: latestPost } = await supabase.from('posts').select('author_id').order('created_at', { ascending: false }).limit(1).single();
  const myId = latestPost?.author_id;

  if (!myId) {
    console.error("Could not identify your user ID.");
    return;
  }

  const { data: myProfile } = await supabase.from('profiles').select('display_name').eq('id', myId).single();
  const myName = myProfile?.display_name || "Alumni Admin";

  console.log(`Identified you as: ${myName} (${myId})`);

  // 2. Get all other users
  const { data: otherUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .neq('id', myId);

  if (usersError || !otherUsers) {
    console.error("Error fetching users:", usersError);
    return;
  }

  console.log(`Found ${otherUsers.length} other users to send requests to.`);

  for (const user of otherUsers) {
    console.log(`Processing request to ${user.display_name}...`);

    // 3. Insert Friend Request
    const { error: requestError } = await supabase
      .from('friendships')
      .upsert({
        user_id: myId,
        friend_id: user.id,
        status: 'pending'
      }, { onConflict: 'user_id,friend_id' });

    if (requestError) {
      console.error(`Failed to send request to ${user.display_name}:`, requestError.message);
      continue;
    }

    // 4. Trigger Notification for them
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${myName} sent you a friend request! Join their network.`,
        link: `/friends`,
        metadata: { actor_id: myId }
      });

    if (notifError) {
      console.error(`Failed to notify ${user.display_name}:`, notifError.message);
    } else {
      console.log(`Successfully sent request and notification to ${user.display_name}.`);
    }
  }

  console.log("Global friend request operation complete.");
}

sendGlobalFriendRequests().catch(console.error);