-- Final Messaging System Schema Fix

-- 1. Ensure Columns Exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_conversations' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Add Unique Constraint for Upsert (Essential)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'chat_participants' AND constraint_name = 'chat_participants_conversation_id_user_id_key'
    ) THEN
        ALTER TABLE chat_participants ADD CONSTRAINT chat_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);
    END IF;
END $$;

-- 3. Update Trigger for Timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET 
        updated_at = NOW(),
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Robust RLS Policies for Conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
CREATE POLICY "Users can view their conversations" ON chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE conversation_id = chat_conversations.id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
CREATE POLICY "Users can create conversations" ON chat_conversations
    FOR INSERT WITH CHECK (true);

-- 5. Robust RLS Policies for Participants
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants" ON chat_participants;
CREATE POLICY "Users can view participants" ON chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants AS p2 
            WHERE p2.conversation_id = chat_participants.conversation_id 
            AND p2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add participants" ON chat_participants;
CREATE POLICY "Users can add participants" ON chat_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND (
                (user_id = auth.uid() AND friend_id = chat_participants.user_id) OR
                (friend_id = auth.uid() AND user_id = chat_participants.user_id)
            )
        )
    );

-- 6. Robust RLS Policies for Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
CREATE POLICY "Users can view messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE conversation_id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE conversation_id = chat_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );
