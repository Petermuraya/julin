-- =====================================================
-- SECURITY FIX: Address 4 Critical Security Issues
-- =====================================================

-- =====================================================
-- 1. CRITICAL: Remove auto-admin role assignment trigger
-- This trigger was granting admin role to ALL new signups
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_role_to_new_user();

-- =====================================================
-- 2. CRITICAL: Fix chat_conversations RLS policies
-- Remove overly permissive policies that expose customer data
-- =====================================================

-- Drop ALL existing policies on chat_conversations to start fresh
DROP POLICY IF EXISTS "Admins can manage chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Auth users can select own chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Auth users can update own chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "anon_create_conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "anon_read_conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "admin_full_access" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow all access to chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update their own conversation" ON public.chat_conversations;

-- Ensure RLS is enabled
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Create secure policies for chat_conversations
-- Admins can manage all conversations
CREATE POLICY "chat_conv_admin_all"
ON public.chat_conversations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can create a new conversation (to start chat)
CREATE POLICY "chat_conv_insert_anon"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

-- Users can only read their own conversations (by conversation_id stored in session)
-- This allows the chat widget to read back its own conversation
CREATE POLICY "chat_conv_select_own"
ON public.chat_conversations
FOR SELECT
USING (
  -- Admins can see all
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Authenticated users can see their own by email
  (auth.uid() IS NOT NULL AND user_email IS NOT NULL AND user_email = auth.jwt() ->> 'email')
);

-- Users can update their own conversation (for ratings)
CREATE POLICY "chat_conv_update_own"
ON public.chat_conversations
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  (auth.uid() IS NOT NULL AND user_email IS NOT NULL AND user_email = auth.jwt() ->> 'email')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  (auth.uid() IS NOT NULL AND user_email IS NOT NULL AND user_email = auth.jwt() ->> 'email')
);

-- =====================================================
-- 3. CRITICAL: Enable RLS on page_views table
-- Currently has no RLS, exposing all analytics data
-- =====================================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Only admins can read page views
CREATE POLICY "page_views_admin_select"
ON public.page_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert page views (for analytics tracking)
CREATE POLICY "page_views_insert_anon"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Only admins can delete page views
CREATE POLICY "page_views_admin_delete"
ON public.page_views
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 4. Fix chat_messages policies to be consistent
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can create chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Auth users can select chat_messages for own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat_messages" ON public.chat_messages;

-- Ensure RLS is enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all messages
CREATE POLICY "chat_msg_admin_all"
ON public.chat_messages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert messages (for chat functionality)
CREATE POLICY "chat_msg_insert_anon"
ON public.chat_messages
FOR INSERT
WITH CHECK (true);

-- Users can read messages from their own conversations
CREATE POLICY "chat_msg_select_own"
ON public.chat_messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.conversation_id = chat_messages.conversation_id
    AND c.user_email IS NOT NULL
    AND c.user_email = auth.jwt() ->> 'email'
  )
);