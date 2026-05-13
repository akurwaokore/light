-- 1. Create tables with proper constraints
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_read BOOLEAN DEFAULT FALSE
);

-- 2. Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Conversation visibility" ON public.chat_conversations;
DROP POLICY IF EXISTS "Participant visibility" ON public.chat_participants;
DROP POLICY IF EXISTS "Message visibility" ON public.chat_messages;
DROP POLICY IF EXISTS "Message insertion" ON public.chat_messages;

-- 4. STRICT PRIVACY POLICIES
-- Only participants can see the conversation record
CREATE POLICY "Conversation visibility" ON public.chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_conversations.id
            AND user_id = auth.uid()
        )
    );

-- Only participants can see participant list for their conversations
CREATE POLICY "Participant visibility" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.conversation_id = chat_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

-- Only participants can see messages
CREATE POLICY "Message visibility" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Only participants can insert messages as themselves
CREATE POLICY "Message insertion" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- 5. Helper function for finding existing 1-on-1 chats (if needed in future)
-- Not strictly necessary for the current API but good for performance
CREATE OR REPLACE FUNCTION find_conversation_between(user1 UUID, user2 UUID)
RETURNS UUID AS $$
    SELECT p1.conversation_id
    FROM public.chat_participants p1
    JOIN public.chat_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = user1 AND p2.user_id = user2
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
