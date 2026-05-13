-- Consolidated Chat System Fix
-- This script standardizes the chat schema, improves security definer functions, and fixes RLS policies.

-- 1. Ensure Tables Exist with correct relationships
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Helper Functions (SECURITY DEFINER to avoid RLS recursion)

-- Check if a user is a member of a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(conversation_uuid UUID, check_user UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE conversation_id = conversation_uuid
          AND user_id = check_user
    );
END;
$$;

-- Find an existing 1-on-1 conversation between two users
CREATE OR REPLACE FUNCTION public.find_conversation_between(user1 UUID, user2 UUID)
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
    conv_id UUID;
BEGIN
    SELECT p1.conversation_id INTO conv_id
    FROM public.chat_participants p1
    JOIN public.chat_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = user1 AND p2.user_id = user2
    LIMIT 1;
    
    RETURN conv_id;
END;
$$;

-- Ensure a conversation exists between two users
CREATE OR REPLACE FUNCTION public.ensure_chat_conversation(initiator_uuid UUID, recipient_uuid UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    existing_conv UUID;
    result_conv UUID;
BEGIN
    -- 1. Check for existing conversation
    SELECT public.find_conversation_between(initiator_uuid, recipient_uuid) INTO existing_conv;
    
    IF existing_conv IS NOT NULL THEN
        RETURN existing_conv;
    END IF;

    -- 2. Create new conversation
    INSERT INTO public.chat_conversations (updated_at)
    VALUES (NOW())
    RETURNING id INTO result_conv;

    -- 3. Add participants
    INSERT INTO public.chat_participants (conversation_id, user_id)
    VALUES 
        (result_conv, initiator_uuid), 
        (result_conv, recipient_uuid);

    RETURN result_conv;
END;
$$;

-- 3. RLS Policies

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they are part of
DROP POLICY IF EXISTS "Users can view their conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their conversations" ON public.chat_conversations
    FOR SELECT USING (public.is_conversation_member(id, auth.uid()));

-- Participants: Users can see fellow participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.chat_participants;
CREATE POLICY "Users can view participants in their conversations" ON public.chat_participants
    FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Messages: Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Messages: Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;
CREATE POLICY "Users can send messages to their conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND public.is_conversation_member(conversation_id, auth.uid())
    );

-- Messages: Users can mark messages as read in their conversations
DROP POLICY IF EXISTS "Users can update message read status" ON public.chat_messages;
CREATE POLICY "Users can update message read status" ON public.chat_messages
    FOR UPDATE USING (public.is_conversation_member(conversation_id, auth.uid()));

-- 4. Triggers

-- Update updated_at on new messages
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.chat_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_conversation_timestamp ON public.chat_messages;
CREATE TRIGGER tr_update_conversation_timestamp
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- 5. Grant permissions
GRANT ALL ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_participants TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_conversation_between TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_chat_conversation TO authenticated;
