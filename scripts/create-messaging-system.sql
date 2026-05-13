-- Messaging System Tables

-- 1. Chat Conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Chat Participants
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);

-- RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see conversations they participate in
CREATE POLICY "Users can view their conversations"
ON chat_conversations FOR SELECT
USING (EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_conversations.id AND user_id = auth.uid()));

CREATE POLICY "Users can view participants in their chats"
ON chat_participants FOR SELECT
USING (EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.conversation_id = chat_participants.conversation_id AND cp.user_id = auth.uid()));

CREATE POLICY "Users can view messages in their chats"
ON chat_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));

CREATE POLICY "Users can send messages to their chats"
ON chat_messages FOR INSERT
WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));
