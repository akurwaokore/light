-- Messaging schema + policies helper

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 3. Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function used by policies (runs with definer rights to avoid recursive RLS)
CREATE OR REPLACE FUNCTION is_conversation_member(conversation_uuid UUID, check_user UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    exists_flag BOOLEAN := FALSE;
BEGIN
    SET LOCAL row_security = OFF;
    SELECT EXISTS (
        SELECT 1 FROM chat_participants
        WHERE conversation_id = conversation_uuid
          AND user_id = check_user
    ) INTO exists_flag;
    RETURN exists_flag;
END;
$$;

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
CREATE POLICY "Users can view their conversations" ON chat_conversations
    FOR SELECT USING (
        is_conversation_member(chat_conversations.id, auth.uid())
    );

-- Participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON chat_participants;
CREATE POLICY "Users can view participants in their conversations" ON chat_participants
    FOR SELECT USING (
        is_conversation_member(chat_participants.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can add themselves to conversations" ON chat_participants;
CREATE POLICY "Users can add themselves to conversations" ON chat_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
    FOR SELECT USING (
        is_conversation_member(chat_messages.conversation_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON chat_messages;
CREATE POLICY "Users can send messages to their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND is_conversation_member(chat_messages.conversation_id, auth.uid())
    );

-- Trigger helper to keep conversation timestamp fresh
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE chat_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_conversation_timestamp ON chat_messages;
CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- RPC helper to create conversation and participants atomically
DROP FUNCTION IF EXISTS ensure_chat_conversation(uuid, uuid);
CREATE FUNCTION ensure_chat_conversation(initiator_uuid UUID, recipient_uuid UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    existing_conv UUID;
    result_conv UUID;
BEGIN
    SELECT find_conversation_between(initiator_uuid, recipient_uuid) INTO existing_conv;
    IF existing_conv IS NOT NULL THEN
        RETURN existing_conv;
    END IF;

    INSERT INTO chat_conversations (updated_at)
    VALUES (NOW())
    RETURNING id INTO result_conv;

    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES (result_conv, initiator_uuid), (result_conv, recipient_uuid);

    RETURN result_conv;
END;
$$;