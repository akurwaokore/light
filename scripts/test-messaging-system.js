import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

async function runMessagingTest() {
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
  
  // 1. Find your latest post to get your ID
  const { data: latestPost } = await supabase.from('posts').select('author_id').order('created_at', { ascending: false }).limit(1).single();
  const targetId = latestPost?.author_id;

  if (!targetId) {
    console.log("Could not identify target user.");
    return;
  }
  console.log(`Target user: ${targetId}`);

  // 2. Find any other existing user to act as "Tester Eddy"
  // We can't easily create a user without a trigger from Auth, 
  // so let's use an existing one and rename them temporarily for the test.
  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .neq('id', targetId)
    .limit(1);

  if (!existingUsers || existingUsers.length === 0) {
      console.log("No other users found. Please create at least one other account manually.");
      return;
  }

  const eddy = existingUsers[0];
  const originalName = eddy.display_name;

  console.log(`Using existing user ${eddy.id} (Original Name: ${originalName}) as Tester Eddy.`);

  // Temporarily rename
  await supabase.from('profiles').update({ display_name: 'Tester Eddy' }).eq('id', eddy.id);

  // 3. Send/Upsert Friend Request
  console.log("Sending Friend Request...");
  await supabase
    .from('friendships')
    .upsert({
      user_id: eddy.id,
      friend_id: targetId,
      status: 'pending'
    });

  // 4. Create Notification
  await supabase.from('notifications').insert({
    user_id: targetId,
    type: 'friend_request',
    title: 'New Friend Request',
    message: `Tester Eddy sent you a friend request.`,
    link: `/friends`,
    metadata: { actor_id: eddy.id }
  });

  console.log("Friend request notification sent.");

  // 5. Accept
  console.log("Accepting Friend Request...");
  await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .match({ user_id: eddy.id, friend_id: targetId });

  // 6. Send Message
  console.log("Sending Test Message...");
  
  // Try to find or create a chat
  const { data: chat } = await supabase
    .from('chats')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (chat) {
      await supabase.from('chat_participants').insert([
        { chat_id: chat.id, user_id: eddy.id },
        { chat_id: chat.id, user_id: targetId }
      ]);

      await supabase.from('messages').insert({
        chat_id: chat.id,
        sender_id: eddy.id,
        content: "Hello! This is Tester Eddy. I am confirming that inter-messaging works! 🚀"
      });
      console.log("Message sent via chat system.");
  } else {
      // Fallback
      await supabase.from('messages').insert({
          sender_id: eddy.id,
          receiver_id: targetId,
          content: "Hello! This is Tester Eddy. Messaging test complete."
      });
      console.log("Message sent via fallback.");
  }

  // Restore name
  // await supabase.from('profiles').update({ display_name: originalName }).eq('id', eddy.id);
  console.log("Test sequence complete. Please check your notifications and messages.");
}

runMessagingTest().catch(console.error);