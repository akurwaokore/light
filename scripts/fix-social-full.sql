-- COMPREHENSIVE FIX FOR POSTS, COMMENTS, AND MESSAGING

-- 1. FIX COMMENTS TABLE AND PERMISSIONS
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure parent_comment_id column exists if table was already there
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_comment_id') THEN
        ALTER TABLE public.comments ADD COLUMN parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS and set policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments 
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their comments" ON public.comments;
CREATE POLICY "Authors can update their comments" ON public.comments 
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their comments" ON public.comments;
CREATE POLICY "Authors can delete their comments" ON public.comments 
    FOR DELETE USING (auth.uid() = author_id);


-- 2. FIX POST REACTION PERMISSIONS (Preventing "like" issues)
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Anyone can view reactions" ON public.post_reactions 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.post_reactions;
CREATE POLICY "Users can manage their own reactions" ON public.post_reactions 
    FOR ALL USING (auth.uid() = user_id);

-- Ensure unique constraint for reactions (prevents multiple likes)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_reactions_post_id_user_id_key') THEN
        ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_post_id_user_id_key UNIQUE (post_id, user_id);
    END IF;
END $$;


-- 3. FIX MESSAGING SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Chat
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat Policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id = chat_conversations.id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view their own chat participants" ON public.chat_participants;
CREATE POLICY "Users can view their own chat participants" ON public.chat_participants
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_participants AS p2 WHERE p2.conversation_id = chat_participants.conversation_id AND p2.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE conversation_id = chat_messages.conversation_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
