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

async function sendTestMessage() {
  console.log('Finding Birzhan...');
  const { data: birzhan } = await supabase.from('profiles').select('id').eq('email', 'sbirzhan@gmail.com').single();
  
  if (!birzhan) {
    console.log('Birzhan not found');
    return;
  }
  
  console.log(`Birzhan ID: ${birzhan.id}`);

  // Find your ID (assuming Friend User or just finding one)
  console.log('Finding your profile (edamoke@gmail.com)...');
  const { data: me } = await supabase.from('profiles').select('id').eq('email', 'edamoke@gmail.com').single();
  
  if (!me) {
    console.log('Your profile not found');
    return;
  }
  console.log(`Your ID: ${me.id}`);

  // 1. Create or find conversation
  console.log('Checking for existing conversation...');
  const { data: participants } = await supabase.from('chat_participants').select('conversation_id').eq('user_id', me.id);
  const convIds = participants?.map(p => p.conversation_id) || [];
  
  let conversationId;
  if (convIds.length > 0) {
    const { data: existing } = await supabase.from('chat_participants').select('conversation_id').eq('user_id', birzhan.id).in('conversation_id', convIds).maybeSingle();
    if (existing) conversationId = existing.conversation_id;
  }

  if (!conversationId) {
    console.log('Creating new conversation...');
    const { data: newConv } = await supabase.from('chat_conversations').insert({}).select().single();
    conversationId = newConv.id;
    await supabase.from('chat_participants').insert([
        { conversation_id: conversationId, user_id: me.id },
        { conversation_id: conversationId, user_id: birzhan.id }
    ]);
  }

  console.log(`Conversation ID: ${conversationId}`);

  // 2. Send message
  console.log('Sending message...');
  const { data: msg, error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: me.id,
    content: "Hello Birzhan! I'm testing the messaging system. Let me know if you see this!"
  }).select().single();

  if (error) {
    console.error('Error sending message:', error.message);
  } else {
    console.log('Message sent successfully:', msg);
  }
}

sendTestMessage().catch(err => console.error(err));
