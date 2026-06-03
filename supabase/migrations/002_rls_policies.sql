-- ============================================
-- StudyFlow AI — RLS Policies Migration 002
-- Row Level Security for all tables
-- Run AFTER 001_schema.sql
-- ============================================

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE
-- Users can only see/edit their own profile
-- ============================================
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can insert (for auto-profile creation trigger)
CREATE POLICY "users_insert_service" ON public.users
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (via webhooks)
CREATE POLICY "subscriptions_all_service" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- UPLOADS TABLE
-- ============================================
CREATE POLICY "uploads_select_own" ON public.uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "uploads_insert_own" ON public.uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uploads_update_own" ON public.uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "uploads_delete_own" ON public.uploads
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STUDY SETS TABLE
-- ============================================
CREATE POLICY "study_sets_select_own" ON public.study_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "study_sets_insert_own" ON public.study_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_sets_update_own" ON public.study_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "study_sets_delete_own" ON public.study_sets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- AI NOTES TABLE
-- ============================================
CREATE POLICY "ai_notes_select_own" ON public.ai_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_notes_insert_own" ON public.ai_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_notes_update_own" ON public.ai_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_notes_delete_own" ON public.ai_notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FLASHCARDS TABLE
-- ============================================
CREATE POLICY "flashcards_select_own" ON public.flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "flashcards_insert_own" ON public.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "flashcards_update_own" ON public.flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "flashcards_delete_own" ON public.flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE POLICY "quizzes_select_own" ON public.quizzes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quizzes_insert_own" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quizzes_update_own" ON public.quizzes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "quizzes_delete_own" ON public.quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- QUIZ QUESTIONS TABLE
-- Access via quiz ownership join
-- ============================================
CREATE POLICY "quiz_questions_select_own" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "quiz_questions_insert_own" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "quiz_questions_delete_own" ON public.quiz_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
    )
  );

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CHATS TABLE
-- ============================================
CREATE POLICY "chats_select_own" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chats_insert_own" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_update_own" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "chats_delete_own" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- LEARNING PROGRESS TABLE
-- ============================================
CREATE POLICY "learning_progress_select_own" ON public.learning_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "learning_progress_insert_own" ON public.learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "learning_progress_update_own" ON public.learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PAYMENTS TABLE
-- Users can see their own payments
-- Only service role can insert (from webhooks)
-- ============================================
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_service" ON public.payments
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- API USAGE TABLE
-- Users can see their own usage
-- Only service role can insert
-- ============================================
CREATE POLICY "api_usage_select_own" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "api_usage_insert_service" ON public.api_usage
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Storage bucket policies
-- Create bucket: study-materials (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  FALSE,
  26214400, -- 25MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files
CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
