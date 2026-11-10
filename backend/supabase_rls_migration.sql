-- =============================================================================
-- DocuGraph AI – Supabase PostgreSQL + pgvector + Row-Level Security (RLS)
-- Course Alignment: Week 10 (Mobile Backend: BaaS, Offline Sync & Security)
-- =============================================================================

-- 1. Enable pgvector extension for 768-dim Gemini embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1b. Public Users Profile Table (Mirrors auth.users into public schema for Table Editor)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    provider VARCHAR(32) DEFAULT 'email',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and update own profile" ON public.users;
CREATE POLICY "Users can view and update own profile"
    ON public.users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger to automatically insert into public.users whenever a user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, provider, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill existing users from auth.users into public.users
INSERT INTO public.users (id, email, full_name, created_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    created_at
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Documents Table (with multi-tenant user_id and Last-Write-Wins updated_at)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    file_type VARCHAR(32) NOT NULL DEFAULT 'PDF',
    file_size INTEGER,
    num_pages INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'ready',
    summary_tldr TEXT,
    summary_detailed TEXT,
    ocr_latency_ms FLOAT,
    ocr_confidence FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 3. Document Chunks Table (Dense Vector Retrieval)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    embedding vector(768),
    token_count INTEGER DEFAULT 0
);

-- 4. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL DEFAULT 'A',
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Offline Sync Queue Audit Table (Last-Write-Wins Conflict Resolution)
CREATE TABLE IF NOT EXISTS public.offline_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    entity_type VARCHAR(64) NOT NULL,
    entity_id TEXT NOT NULL,
    client_updated_at TIMESTAMPTZ NOT NULL,
    server_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolution_strategy VARCHAR(32) NOT NULL DEFAULT 'LAST_WRITE_WINS'
);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES (Week 10 Slide 4 Standard)
-- =============================================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users manage only their own documents
DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;
CREATE POLICY "Users manage own documents"
ON public.documents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users manage only their own document chunks
DROP POLICY IF EXISTS "Users manage own document_chunks" ON public.document_chunks;
CREATE POLICY "Users manage own document_chunks"
ON public.document_chunks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users manage only their own quiz questions
DROP POLICY IF EXISTS "Users manage own quiz_questions" ON public.quiz_questions;
CREATE POLICY "Users manage own quiz_questions"
ON public.quiz_questions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users manage only their own offline sync logs
DROP POLICY IF EXISTS "Users manage own offline_sync_logs" ON public.offline_sync_logs;
CREATE POLICY "Users manage own offline_sync_logs"
ON public.offline_sync_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

