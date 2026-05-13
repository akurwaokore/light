-- Deadlock-safe chat system setup
-- Part 1: Ensure tables exist
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

-- Part 2: Functions (safe to run separately)
CREATE OR REPLACE FUNCTION find_conversation_between(user1 UUID, user2 UUID)
RETURNS UUID AS $$
    SELECT p1.conversation_id
    FROM public.chat_participants p1
    JOIN public.chat_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = user1 AND p2.user_id = user2
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Part 3: Enable RLS and set policies (Run this after Part 1)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Reset and apply policies
DO $$
BEGIN
    -- Conversations
    DROP POLICY IF EXISTS "Conversation visibility" ON public.chat_conversations;
    CREATE POLICY "Conversation visibility" ON public.chat_conversations
        FOR SELECT USING (
            id IN (SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid())
        );

    -- Participants
    DROP POLICY IF EXISTS "Participant visibility" ON public.chat_participants;
    CREATE POLICY "Participant visibility" ON public.chat_participants
        FOR SELECT USING (
            conversation_id IN (SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid())
        );

    -- Messages
    DROP POLICY IF EXISTS "Message visibility" ON public.chat_messages;
    CREATE POLICY "Message visibility" ON public.chat_messages
        FOR SELECT USING (
            conversation_id IN (SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid())
        );

    DROP POLICY IF EXISTS "Message insertion" ON public.chat_messages;
    CREATE POLICY "Message insertion" ON public.chat_messages
        FOR INSERT WITH CHECK (
            auth.uid() = sender_id AND
            conversation_id IN (SELECT conversation_id FROM public.chat_participants WHERE user_id = auth.uid())
        );
END $$;
