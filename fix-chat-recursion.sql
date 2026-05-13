-- Fix infinite recursion in chat_participants RLS policies

-- 1. Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_chat_participant_member(conv_id uuid, usr_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.chat_participants 
        WHERE conversation_id = conv_id AND user_id = usr_id
    );
$$;

-- 2. Drop existing recursive policies on chat_participants
DROP POLICY IF EXISTS "Users can view participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Participant visibility" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can see conversation participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view their own chat participants" ON public.chat_participants;

-- 3. Create a clean, non-recursive policy for chat_participants
CREATE POLICY "Participant visibility non recursive" ON public.chat_participants
    FOR SELECT USING (
        public.is_chat_participant_member(conversation_id, auth.uid())
    );

-- 4. Do the same for chat_conversations and chat_messages to be safe
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own conversations non recursive" ON public.chat_conversations
    FOR SELECT USING (
        public.is_chat_participant_member(id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages non recursive" ON public.chat_messages
    FOR SELECT USING (
        public.is_chat_participant_member(conversation_id, auth.uid())
    );

-- Enable RLS (just in case it was disabled)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
