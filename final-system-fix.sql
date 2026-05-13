-- Fix CVs and Jobs System
CREATE TABLE IF NOT EXISTS public.cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    country TEXT,
    linkedin_url TEXT,
    graduation_year INTEGER,
    technical_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    education_json JSONB DEFAULT '[]',
    experience_json JSONB DEFAULT '[]',
    languages_json JSONB DEFAULT '[]',
    certifications_json JSONB DEFAULT '[]',
    volunteer_json JSONB DEFAULT '[]',
    declaration_accepted BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_cv UNIQUE (user_id)
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_url TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat System Tables
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

-- Enable RLS
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- CV Policies
DROP POLICY IF EXISTS "Users can manage their own CV" ON public.cvs;
CREATE POLICY "Users can manage their own CV" ON public.cvs
    FOR ALL USING (auth.uid() = user_id);

-- Job Applications Policies
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;
CREATE POLICY "Applicants can view their own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Applicants can submit applications" ON public.job_applications;
CREATE POLICY "Applicants can submit applications" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Job posters can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Job posters can view applications for their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_applications.job_id
            AND jobs.posted_by = auth.uid()
        )
    );

-- Chat Policies
DROP POLICY IF EXISTS "Users can see conversations they are part of" ON public.chat_conversations;
CREATE POLICY "Users can see conversations they are part of" ON public.chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_conversations.id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can see conversation participants" ON public.chat_participants;
CREATE POLICY "Users can see conversation participants" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.conversation_id = chat_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can see messages in their conversations" ON public.chat_messages;
CREATE POLICY "Users can see messages in their conversations" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;
CREATE POLICY "Users can send messages to their conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE conversation_id = chat_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Ensure profiles are public for chat participant lookup
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
