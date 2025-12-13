-- Create tables for storing chatbot conversations and messages
CREATE TABLE IF NOT EXISTS chat_conversations (
  id text PRIMARY KEY,
  user_display_name text,
  started_at timestamptz DEFAULT now(),
  last_message text,
  summary text
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text,
  role text,
  content text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups by session
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);