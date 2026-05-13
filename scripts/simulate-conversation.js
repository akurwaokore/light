const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Fallback to checking .env as well
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables. Make sure .env.local or .env exists.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const edEmail = 'edamoke@gmail.com';
const birzhanEmail = 'sbirzhan@gmail.com';

const edMessages = [
  "Hey Birzhan! How have you been?",
  "I was thinking about the upcoming alumni event.",
  "Are you planning to attend?",
  "Let me know if you want to meet up beforehand."
];

const birzhanMessages = [
  "Hi Ed! I'm doing well, thanks.",
  "Yes, I'm definitely going to the event.",
  "It's been a while since the last one.",
  "Meeting up sounds like a great idea.",
  "We could grab coffee near the venue.",
  "I was actually just looking at the schedule.",
  "There's a really interesting panel at 2 PM.",
  "Have you seen who the speakers are?",
  "I think Professor Smith might be there too.",
  "Let's coordinate closer to the date.",
  "What time were you thinking of heading over?",
  "Maybe around 1:00 PM?"
];

async function simulateConversation() {
  try {
    console.log(`Looking up users: ${edEmail}, ${birzhanEmail}...`);

    // 1. Get user IDs
    const { data: edProfiles, error: edErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', edEmail);

    const { data: birzhanProfiles, error: bErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', birzhanEmail);

    if (edErr || bErr) {
      console.error("Error looking up users:", edErr || bErr);
      return;
    }

    if (!edProfiles?.length || !birzhanProfiles?.length) {
      console.error("Could not find both users in the database.");
      console.log(`Found Ed: ${edProfiles?.length > 0}, Found Birzhan: ${birzhanProfiles?.length > 0}`);
      
      // Attempt to find by partial email or display name just in case
      console.log("\nAttempting fuzzy lookup...");
      const { data: allUsers } = await supabase.from('profiles').select('id, email, display_name');
      console.log("Available profiles:");
      allUsers?.slice(0, 5).forEach(u => console.log(`- ${u.display_name} (${u.email}) [${u.id}]`));
      return;
    }

    const edId = edProfiles[0].id;
    const birzhanId = birzhanProfiles[0].id;
    console.log(`Found Ed: ${edId}`);
    console.log(`Found Birzhan: ${birzhanId}`);

    // 2. Ensure Friendship
    console.log("\nChecking friendship status...");
    const { data: existingFriendship, error: friendCheckErr } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${edId},friend_id.eq.${birzhanId}),and(user_id.eq.${birzhanId},friend_id.eq.${edId})`)
      .maybeSingle();

    if (friendCheckErr) {
        console.error("Error checking friendship:", friendCheckErr);
    } else if (!existingFriendship) {
        console.log("No friendship found. Creating one...");
        const { error: friendInsertErr } = await supabase
            .from('friendships')
            .insert({
                user_id: edId,
                friend_id: birzhanId,
                status: 'accepted'
            });
        if (friendInsertErr) {
             console.error("Error creating friendship:", friendInsertErr);
             return;
        }
        console.log("Friendship created successfully.");
    } else if (existingFriendship.status !== 'accepted') {
        console.log(`Friendship exists but status is '${existingFriendship.status}'. Updating to 'accepted'...`);
        const { error: friendUpdateErr } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', existingFriendship.id);
         if (friendUpdateErr) {
             console.error("Error updating friendship:", friendUpdateErr);
             return;
         }
         console.log("Friendship updated successfully.");
    } else {
        console.log("Users are already friends.");
    }

    // 3. Find or Create Conversation
    console.log("\nChecking for existing conversation...");
    let conversationId = null;

    // Use the RPC if available, or manual check
    const { data: rpcConvId, error: rpcErr } = await supabase
      .rpc('find_conversation_between', { user1: edId, user2: birzhanId });

    if (!rpcErr && rpcConvId) {
        conversationId = rpcConvId;
        console.log(`Found existing conversation via RPC: ${conversationId}`);
    } else {
        console.log("RPC check failed or no conversation found. Creating new conversation...");
        
        const { data: newConv, error: convErr } = await supabase
            .from('chat_conversations')
            .insert({ updated_at: new Date().toISOString() })
            .select('id')
            .single();

        if (convErr || !newConv) {
            console.error("Error creating conversation:", convErr);
            return;
        }
        
        conversationId = newConv.id;
        console.log(`Created new conversation: ${conversationId}`);

        console.log("Adding participants...");
        const { error: partErr } = await supabase
            .from('chat_participants')
            .insert([
                { conversation_id: conversationId, user_id: edId },
                { conversation_id: conversationId, user_id: birzhanId }
            ]);

        if (partErr) {
            console.error("Error adding participants:", partErr);
            return;
        }
        console.log("Participants added.");
    }

    // 4. Insert Messages
    console.log("\nInserting messages...");
    let messageCount = 0;
    
    // Insert Ed's messages (spread out slightly over time)
    for (let i = 0; i < edMessages.length; i++) {
        const timestamp = new Date(Date.now() - (1000 * 60 * 60 * 2) + (i * 60000)).toISOString(); // 2 hours ago, 1 min apart
        
        const { error: msgErr } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: edId,
                content: edMessages[i],
                created_at: timestamp,
                is_read: true
            });
            
        if (msgErr) {
            console.error(`Error inserting Ed's message ${i}:`, msgErr);
        } else {
            messageCount++;
        }
    }
    
    // Insert Birzhan's messages
    for (let i = 0; i < birzhanMessages.length; i++) {
        const timestamp = new Date(Date.now() - (1000 * 60 * 30) + (i * 60000)).toISOString(); // 30 mins ago, 1 min apart
        
        const { error: msgErr } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: birzhanId,
                content: birzhanMessages[i],
                created_at: timestamp,
                is_read: false // Leaving some unread for realism
            });
            
        if (msgErr) {
            console.error(`Error inserting Birzhan's message ${i}:`, msgErr);
        } else {
            messageCount++;
        }
    }

    // Update conversation timestamp
    await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    console.log(`\nSuccessfully inserted ${messageCount} total messages into conversation ${conversationId}.`);

  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

simulateConversation();
