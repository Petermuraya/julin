-- 2025-12-19: Restrict chat tables policies to owners and admins

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update their own conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow admin access to chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow admin access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all access to chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON public.chat_messages;

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Admins: full access to manage and view chat_conversations
CREATE POLICY "Admins can manage chat_conversations" ON public.chat_conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Authenticated users may SELECT/UPDATE their own conversations when their email matches
CREATE POLICY "Auth users can select own chat_conversations" ON public.chat_conversations
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_email IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Auth users can update own chat_conversations" ON public.chat_conversations
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND user_email IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_email IS NOT NULL
    AND user_email = auth.jwt() ->> 'email'
  );

-- Allow anonymous (public) inserts so visitors can start conversations/messages
CREATE POLICY "Anyone can create chat_conversations" ON public.chat_conversations
  FOR INSERT
  WITH CHECK (true);

-- Admins: full access to manage chat_messages
CREATE POLICY "Admins can manage chat_messages" ON public.chat_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Anyone can insert chat messages (site visitors)
CREATE POLICY "Anyone can create chat_messages" ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can SELECT messages that belong to their conversations (via conversation ownership)
CREATE POLICY "Auth users can select chat_messages for own conversations" ON public.chat_messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.conversation_id = public.chat_messages.conversation_id
        AND c.user_email IS NOT NULL
        AND c.user_email = auth.jwt() ->> 'email'
    )
  );

-- Prevent non-admins from updating or deleting messages via RLS (admins only)
CREATE POLICY "Admins can update chat_messages" ON public.chat_messages
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete chat_messages" ON public.chat_messages
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON POLICY "Admins can manage chat_conversations" ON public.chat_conversations IS 'Admins can perform all operations on conversations';
COMMENT ON POLICY "Auth users can select own chat_conversations" ON public.chat_conversations IS 'Authenticated users can only select conversations where their email matches user_email';
COMMENT ON POLICY "Anyone can create chat_conversations" ON public.chat_conversations IS 'Allows anonymous users to create conversations (INSERT only)';
COMMENT ON POLICY "Admins can manage chat_messages" ON public.chat_messages IS 'Admins can perform all operations on messages';
COMMENT ON POLICY "Anyone can create chat_messages" ON public.chat_messages IS 'Allows anonymous users to post messages to conversations';
COMMENT ON POLICY "Auth users can select chat_messages for own conversations" ON public.chat_messages IS 'Authenticated users can select messages belonging to their own conversations';

-- Note: consider adding an explicit owner_id (UUID) column or a signed session token for stronger guarantees in future migrations.
